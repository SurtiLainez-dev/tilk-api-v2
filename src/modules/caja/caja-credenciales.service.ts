
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'node:crypto';
import { hash } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';

import {
    Cajas,
    CajaSesiones,
} from '../../database/entities/index.js';

import { MailService } from '../../common/mail/mail.service.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { ColaboradoresService } from '../colaboradores/colaboradores.service.js';

@Injectable()
export class CajaCredencialesService {
    private readonly logger = new Logger(
        CajaCredencialesService.name,
    );

    constructor(
        @InjectRepository(Cajas)
        private readonly cajasRepository: Repository<Cajas>,

        private readonly dataSource: DataSource,
        private readonly mailService: MailService,
        private readonly usuariosService: UsuariosService,
        private readonly colaboradoresService: ColaboradoresService,
    ) {}

    // ==========================================
    // GENERAR PIN ALEATORIO DE 6 DÍGITOS
    // ==========================================
    private generarPin(): string {
        return randomInt(0, 1_000_000)
            .toString()
            .padStart(5, '0');
    }

    // ==========================================
    // OBTENER CAJA POR ID
    // ==========================================
    private async obtenerCaja(
        cajaId: string,
    ): Promise<Cajas> {
        const caja = await this.cajasRepository.findOne({
            where: { id: cajaId },
        });

        if (!caja) {
            throw new NotFoundException(
                'La caja no existe.',
            );
        }

        return caja;
    }

    // ==========================================
    // OBTENER CAJA POR SLUG
    // ==========================================
    private async obtenerCajaPorSlug(
        slug: string,
    ): Promise<Cajas> {
        if (!slug?.trim()) {
            throw new BadRequestException(
                'Debes proporcionar el slug de la caja.',
            );
        }

        const caja = await this.cajasRepository.findOne({
            where: { slug: slug.trim() },
        });

        if (!caja) {
            throw new NotFoundException(
                'La caja no existe.',
            );
        }

        return caja;
    }

    // ==========================================
    // VALIDAR RESPONSABLE DE LA SUCURSAL
    // ==========================================
    // IMPORTANTE:
    // Este método se utiliza únicamente
    // al CAMBIAR el responsable.
    //
    // No se ejecuta al regenerar PIN.
    // ==========================================
    private async validarResponsable(
        userId: string,
        sucursalId: string,
    ): Promise<void> {
        const esValido =
            await this.colaboradoresService
                .validarUsuarioActivoDeSucursal(
                    String(userId),
                    String(sucursalId),
                );

        if (!esValido) {
            throw new BadRequestException(
                'El responsable seleccionado no tiene un usuario activo, ' +
                'su colaborador está inactivo o no pertenece a la sucursal de esta caja.',
            );
        }
    }

    // ==========================================
    // ACTUALIZAR CREDENCIALES DE CAJA
    // ==========================================
    // Método compartido para:
    //
    // 1. Regenerar PIN
    // 2. Cambiar responsable
    //
    // No valida colaboradores ni sucursales.
    // ==========================================
    private async actualizarCredenciales(
        cajaId: string,
        nuevoUsuarioId?: string,
    ) {
        // Buscar caja.
        const caja = await this.obtenerCaja(cajaId);

        // Usuario actual o nuevo usuario asignado.
        const userId = String(
            nuevoUsuarioId ?? caja.user_id ?? '',
        ).trim();

        if (!userId) {
            throw new BadRequestException(
                'La caja no tiene un usuario asignado.',
            );
        }

        // Obtener usuario desde UsuariosService.
        // Se mantiene el funcionamiento original.
        const usuario =
            await this.usuariosService.obtenerConEmail(
                userId,
            );

        // Validar correo.
        const email = String(
            usuario?.email ?? '',
        ).trim();

        if (!email) {
            throw new BadRequestException(
                'El usuario asignado no tiene correo electrónico registrado.',
            );
        }

        // ==========================================
        // GENERAR PIN Y HASH
        // ==========================================
        const pin = this.generarPin();
        const passwordHash = await hash(pin, 12);

        // ==========================================
        // ACTUALIZAR CAJA Y REVOCAR SESIONES
        // ==========================================
        await this.dataSource.transaction(
            async (manager) => {
                const ahora = new Date();

                const resultado = await manager
                    .createQueryBuilder()
                    .update(Cajas)
                    .set({
                        user_id: userId,
                        password: passwordHash,
                        updated_at: ahora,
                    })
                    .where('id = :id', {
                        id: cajaId,
                    })
                    .execute();

                if (!resultado.affected) {
                    throw new NotFoundException(
                        'No se pudo actualizar la caja.',
                    );
                }

                // Revocar todas las sesiones
                // anteriores de esta caja.
                await manager
                    .createQueryBuilder()
                    .update(CajaSesiones)
                    .set({
                        revoked_at: ahora,
                        revoked_by: userId,
                        revocation_reason: nuevoUsuarioId
                            ? 'CAMBIO_USUARIO'
                            : 'REGENERACION_PIN',
                    })
                    .where('caja_id = :cajaId', {
                        cajaId,
                    })
                    .andWhere('revoked_at IS NULL')
                    .execute();
            },
        );

        // ==========================================
        // ENVIAR PIN POR CORREO
        // ==========================================
        let correoEnviado = false;
        let errorCorreo: string | null = null;

        try {
            this.logger.log(
                `Enviando nuevo PIN de caja ${caja.codigo} a ${email}`,
            );

            await this.mailService.enviarNuevoPinCaja(
                email,
                pin,
                caja.codigo,
            );

            correoEnviado = true;

            this.logger.log(
                `Correo de credenciales aceptado por el servicio de envío para la caja ${caja.codigo}`,
            );
        } catch (error: unknown) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : String(error);

            this.logger.error(
                `Error enviando PIN de caja ${caja.codigo}: ${mensaje}`,
                error instanceof Error
                    ? error.stack
                    : undefined,
            );

            // El error SMTP no debe impedir
            // que la operación de Caja termine.
            //
            // El PIN ya fue actualizado y
            // las sesiones anteriores revocadas.
            errorCorreo =
                'No se pudo enviar el correo. Consulta los logs del servidor para conocer el motivo.';
        }

        // ==========================================
        // RESPUESTA AL FRONTEND
        // SIN IDS INTERNOS
        // ==========================================
        return {
            success: true,
            message: correoEnviado
                ? 'Credenciales actualizadas y correo enviado correctamente'
                : 'Credenciales actualizadas, pero el correo no pudo enviarse',
            data: {
                slug: caja.slug,
                codigo_caja: caja.codigo,
                email,
                pin,
                correo_enviado: correoEnviado,
                error_correo: errorCorreo,
            },
        };
    }

    // ==========================================
    // CAMBIAR USUARIO ASIGNADO A LA CAJA
    // ==========================================
    // Aquí SÍ validamos:
    //
    // - Usuario activo.
    // - Colaborador activo.
    // - Misma sucursal de la caja.
    // ==========================================
    async cambiarUsuario(
        cajaId: string,
        nuevoUsuarioId: string,
    ) {
        if (!nuevoUsuarioId?.trim()) {
            throw new BadRequestException(
                'Debes seleccionar un responsable.',
            );
        }

        const caja = await this.obtenerCaja(cajaId);

        if (
            String(caja.user_id) ===
            String(nuevoUsuarioId)
        ) {
            throw new BadRequestException(
                'Este usuario ya es el responsable de la caja.',
            );
        }

        // Esta validación solamente ocurre
        // durante el cambio de responsable.
        await this.validarResponsable(
            String(nuevoUsuarioId),
            String(caja.sucursal_id),
        );

        // Si la validación pasa, actualizamos
        // responsable, PIN y sesiones.
        return this.actualizarCredenciales(
            String(caja.id),
            String(nuevoUsuarioId),
        );
    }

    // ==========================================
    // CAMBIAR RESPONSABLE POR SLUG
    // ==========================================
    async cambiarResponsablePorSlug(
        slug: string,
        nuevoUsuarioId: string,
    ) {
        if (!nuevoUsuarioId?.trim()) {
            throw new BadRequestException(
                'Debes seleccionar un responsable.',
            );
        }

        const caja = await this.obtenerCajaPorSlug(slug);

        // Reutilizamos cambiarUsuario para
        // no duplicar las validaciones.
        return this.cambiarUsuario(
            String(caja.id),
            String(nuevoUsuarioId),
        );
    }

    // ==========================================
    // REGENERAR PIN DE LA CAJA
    // ==========================================
    // NO valida colaboradores.
    // NO valida sucursales.
    //
    // Conserva el funcionamiento original.
    // ==========================================
    async regenerarPin(
        cajaId: string,
    ) {
        return this.actualizarCredenciales(
            cajaId,
        );
    }

    // ==========================================
    // REGENERAR PIN POR SLUG
    // ==========================================
    // También conserva el funcionamiento
    // original, sin validar colaboradores.
    // ==========================================
    async regenerarPinPorSlug(
        slug: string,
    ) {
        const caja = await this.obtenerCajaPorSlug(slug);

        return this.actualizarCredenciales(
            String(caja.id),
        );
    }
}

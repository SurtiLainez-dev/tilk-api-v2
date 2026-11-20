
import {
    Injectable,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { randomUUID, createHash } from 'node:crypto';

import {
    CajaOperacionPago,
    VentasEntity,
} from '../../database/entities/index.js';

export interface CrearOperacionPagoDto {
    venta_slug: string;
    caja_id: string;
    user_id: string;
    monto: string | number;
}

export interface ValidarOperacionPagoDto {
    operacion_id: string;
    caja_id: string;
    user_id: string;
    venta_slug: string;
    monto: string | number;
}

@Injectable()
export class CajaOperacionPagoService {
    constructor(
        @InjectRepository(CajaOperacionPago)
        private readonly operacionesRepository:
            Repository<CajaOperacionPago>,

        @InjectRepository(VentasEntity)
        private readonly ventasRepository:
            Repository<VentasEntity>,
    ) {}

    // ==========================================
    // NORMALIZAR MONTO
    // ==========================================
    private normalizarMonto(
        monto: string | number,
    ): string {
        if (
            typeof monto !== 'string' &&
            typeof monto !== 'number'
        ) {
            throw new BadRequestException(
                'Debes proporcionar un monto válido.',
            );
        }

        const valor = String(monto).trim();

        if (!/^\d+(?:\.\d{1,2})?$/.test(valor)) {
            throw new BadRequestException(
                'El monto debe ser positivo y tener máximo dos decimales.',
            );
        }

        const [enteros, decimales = ''] = valor.split('.');

        const centavos =
            BigInt(enteros) * 100n +
            BigInt(decimales.padEnd(2, '0'));

        if (centavos <= 0n) {
            throw new BadRequestException(
                'El monto debe ser mayor que cero.',
            );
        }

        // La columna monto es DECIMAL(14,2).
        if (centavos > 99999999999999n) {
            throw new BadRequestException(
                'El monto supera el máximo permitido.',
            );
        }

        const parteEntera = centavos / 100n;
        const parteDecimal = centavos % 100n;

        return (
            parteEntera.toString() +
            '.' +
            parteDecimal.toString().padStart(2, '0')
        );
    }

    // ==========================================
    // VALIDAR UUID
    // ==========================================
    private validarFormatoUuid(
        operacionId: string,
    ): string {
        if (
            typeof operacionId !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                operacionId,
            )
        ) {
            throw new BadRequestException(
                'El UUID de la operación no es válido.',
            );
        }

        return operacionId.toLowerCase();
    }

    // ==========================================
    // GENERAR HASH DE LOS DATOS
    // ==========================================
    private generarHash(
        ventaId: string,
        cajaId: string,
        userId: string,
        monto: string,
    ): string {
        const contenido = JSON.stringify({
            venta_id: ventaId,
            caja_id: cajaId,
            user_id: userId,
            monto,
        });

        return createHash('sha256')
            .update(contenido)
            .digest('hex');
    }

    // ==========================================
    // CREAR OPERACIÓN PENDIENTE
    // ==========================================
    async crearOperacion(
        datos: CrearOperacionPagoDto,
    ) {
        if (
            typeof datos?.venta_slug !== 'string' ||
            !datos.venta_slug.trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar una venta válida.',
            );
        }

        if (!datos.caja_id || !datos.user_id) {
            throw new BadRequestException(
                'No se identificó la caja o el usuario.',
            );
        }

        const monto = this.normalizarMonto(datos.monto);

        const venta = await this.ventasRepository.findOne({
            where: {
                slug: datos.venta_slug.trim(),
            },
        });

        if (!venta) {
            throw new NotFoundException(
                'No se encontró la venta solicitada.',
            );
        }

        const operacionId = randomUUID();

        const requestHash = this.generarHash(
            String(venta.id),
            String(datos.caja_id),
            String(datos.user_id),
            monto,
        );

        const operacion = this.operacionesRepository.create({
            operacion_id: operacionId,
            venta_id: String(venta.id),
            caja_id: String(datos.caja_id),
            user_id: String(datos.user_id),
            recibo_id: null,
            monto,
            estado: 'PENDIENTE',
            request_hash: requestHash,
            respuesta: null,
        });

        await this.operacionesRepository.save(operacion);

        return {
            success: true,
            mensaje: 'Operación de pago creada correctamente.',
            operacion_id: operacion.operacion_id,
            estado: operacion.estado,
            monto: operacion.monto,
        };
    }

    // ==========================================
    // VALIDAR OPERACIÓN RECIBIDA
    // ==========================================
    async validarOperacion(
        datos: ValidarOperacionPagoDto,
    ) {
        const operacionId = this.validarFormatoUuid(
            datos?.operacion_id,
        );

        if (!datos.caja_id || !datos.user_id) {
            throw new BadRequestException(
                'No se identificó la caja o el usuario.',
            );
        }

        if (
            typeof datos.venta_slug !== 'string' ||
            !datos.venta_slug.trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar una venta válida.',
            );
        }

        const monto = this.normalizarMonto(datos.monto);

        const operacion =
            await this.operacionesRepository.findOne({
                where: {
                    operacion_id: operacionId,
                },
            });

        if (!operacion) {
            throw new NotFoundException(
                'La operación de pago no existe.',
            );
        }

        if (
            String(operacion.user_id) !==
            String(datos.user_id)
        ) {
            throw new ForbiddenException(
                'La operación pertenece a otro usuario.',
            );
        }

        if (
            String(operacion.caja_id) !==
            String(datos.caja_id)
        ) {
            throw new ForbiddenException(
                'La operación pertenece a otra caja.',
            );
        }

        const venta = await this.ventasRepository.findOne({
            where: {
                slug: datos.venta_slug.trim(),
            },
        });

        if (
            !venta ||
            String(venta.id) !==
            String(operacion.venta_id)
        ) {
            throw new BadRequestException(
                'La operación no corresponde a la venta indicada.',
            );
        }

        const requestHash = this.generarHash(
            String(venta.id),
            String(datos.caja_id),
            String(datos.user_id),
            monto,
        );

        if (operacion.request_hash !== requestHash) {
            throw new ConflictException(
                'Los datos del pago no coinciden con la operación original.',
            );
        }

        // ======================================
        // VALIDAR ESTADO
        // ======================================
        switch (operacion.estado) {
            case 'PENDIENTE':
                break;

            case 'PROCESANDO':
                throw new ConflictException(
                    'Esta operación ya se está procesando.',
                );

            case 'COMPLETADO':
                throw new ConflictException(
                    'Esta operación ya fue completada.',
                );

            case 'ERROR':
                throw new ConflictException(
                    'Esta operación presenta un error.',
                );

            case 'CERRADO':
                throw new ConflictException(
                    'Esta operación ya fue cerrada.',
                );

            default:
                throw new ConflictException(
                    'La operación tiene un estado no permitido.',
                );
        }

        return {
            success: true,
            mensaje: 'Operación validada correctamente.',
            operacion_id: operacion.operacion_id,
            estado: operacion.estado,
            monto: operacion.monto,
        };
    }

    // ==========================================
    // CONSULTAR RESULTADO DE UNA OPERACIÓN
    // ==========================================
    async consultarOperacion(
        operacionId: string,
        userId: string,
        cajaId: string,
    ) {
        const uuid = this.validarFormatoUuid(operacionId);

        const operacion =
            await this.operacionesRepository.findOne({
                where: {
                    operacion_id: uuid,
                },
            });

        if (!operacion) {
            throw new NotFoundException(
                'La operación no existe.',
            );
        }

        if (
            String(operacion.user_id) !== String(userId) ||
            String(operacion.caja_id) !== String(cajaId)
        ) {
            throw new ForbiddenException(
                'No tienes autorización para consultar esta operación.',
            );
        }

        return {
            success: true,
            operacion_id: operacion.operacion_id,
            estado: operacion.estado,
            monto: operacion.monto,
            respuesta: operacion.respuesta,
            created_at: operacion.created_at,
            updated_at: operacion.updated_at,
        };
    }
}

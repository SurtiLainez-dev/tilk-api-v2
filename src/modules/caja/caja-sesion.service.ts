
import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Request } from 'express';

import {
    Cajas,
    CajaSesiones,
    CajaSesionDispositivo,
} from '../../database/entities/index.js';

@Injectable()
export class CajaSesionService {
    private readonly DURACION_MINUTOS = 25;

    constructor(
        @InjectRepository(Cajas)
        private readonly cajasRepository: Repository<Cajas>,

        @InjectRepository(CajaSesiones)
        private readonly sesionesRepository: Repository<CajaSesiones>,

        private readonly dataSource: DataSource,
    ) {}

    private hashToken(token: string): string {
        return createHash('sha256')
            .update(token)
            .digest('hex');
    }

    private nuevaExpiracion(): Date {
        return new Date(
            Date.now() + this.DURACION_MINUTOS * 60_000,
        );
    }

    private detectarNavegador(ua: string) {
        const patrones = [
            { nombre: 'Edge', regex: /Edg(?:A|iOS)?\/([\d.]+)/i },
            { nombre: 'Opera', regex: /(?:OPR|Opera)\/([\d.]+)/i },
            { nombre: 'Samsung Internet', regex: /SamsungBrowser\/([\d.]+)/i },
            { nombre: 'Firefox', regex: /(?:Firefox|FxiOS)\/([\d.]+)/i },
            { nombre: 'Chrome', regex: /(?:Chrome|CriOS)\/([\d.]+)/i },
            { nombre: 'Safari', regex: /Version\/([\d.]+).*Safari/i },
        ];

        for (const patron of patrones) {
            const resultado = ua.match(patron.regex);

            if (resultado) {
                return {
                    nombre: patron.nombre,
                    version: resultado[1] || null,
                };
            }
        }

        return {
            nombre: 'Desconocido',
            version: null,
        };
    }

    private detectarSistema(ua: string) {
        const windows = ua.match(/Windows NT ([\d.]+)/i);

        if (windows) {
            const versiones: Record<string, string> = {
                '10.0': '10/11',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
            };

            return {
                nombre: 'Windows',
                version: versiones[windows[1]] || windows[1],
            };
        }

        const android = ua.match(/Android\s+([\d.]+)/i);

        if (android) {
            return {
                nombre: 'Android',
                version: android[1],
            };
        }

        const ios = ua.match(
            /(?:iPhone OS|CPU(?: iPhone)? OS)\s+([\d_]+)/i,
        );

        if (ios) {
            return {
                nombre: 'iOS',
                version: ios[1].replace(/_/g, '.'),
            };
        }

        const mac = ua.match(/Mac OS X\s+([\d_.]+)/i);

        if (mac) {
            return {
                nombre: 'macOS',
                version: mac[1].replace(/_/g, '.'),
            };
        }

        if (/Linux/i.test(ua)) {
            return {
                nombre: 'Linux',
                version: null,
            };
        }

        return {
            nombre: 'Desconocido',
            version: null,
        };
    }

    private detectarDispositivo(ua: string) {
        if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) {
            return {
                tipo: 'TABLET',
                nombre: /iPad/i.test(ua) ? 'iPad' : 'Tablet',
            };
        }

        if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) {
            return {
                tipo: 'MOVIL',
                nombre: /iPhone/i.test(ua) ? 'iPhone' : 'Smartphone',
            };
        }

        if (/Windows|Macintosh|Linux/i.test(ua)) {
            return {
                tipo: 'ESCRITORIO',
                nombre: 'Computadora',
            };
        }

        return {
            tipo: 'DESCONOCIDO',
            nombre: 'Dispositivo desconocido',
        };
    }

    async iniciarSesion(
        slug: string,
        password: string,
        userId: string,
        request?: Request,
    ) {
        if (!slug || !password) {
            throw new UnauthorizedException(
                'Debes proporcionar la caja y su PIN.',
            );
        }

        const caja = await this.cajasRepository
            .createQueryBuilder('caja')
            .addSelect('caja.password')
            .where('caja.slug = :slug', { slug })
            .getOne();

        if (!caja) {
            throw new NotFoundException(
                'No se encontró la caja solicitada.',
            );
        }

        if (Number(caja.activa) !== 1) {
            throw new ForbiddenException(
                'Esta caja está desactivada.',
            );
        }

        if (String(caja.user_id) !== String(userId)) {
            throw new ForbiddenException(
                'No tienes autorización para acceder a esta caja.',
            );
        }

        if (!caja.password) {
            throw new UnauthorizedException(
                'Esta caja no tiene un PIN configurado.',
            );
        }

        const pinValido = await bcrypt.compare(
            password,
            caja.password,
        );

        if (!pinValido) {
            throw new UnauthorizedException(
                'El PIN de acceso es incorrecto.',
            );
        }

        const token = randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);

        const ahora = new Date();
        const expiracion = this.nuevaExpiracion();

        const sesion = this.sesionesRepository.create({
            caja_id: String(caja.id),
            user_id: String(userId),
            token_hash: tokenHash,
            expires_at: expiracion,
            last_activity_at: ahora,
            revoked_at: null,
            revoked_by: null,
            revocation_reason: null,
        });

        // Crear la sesión y su auditoría en una sola transacción.
        await this.dataSource.transaction(async (manager) => {
            await manager.save(CajaSesiones, sesion);

            const userAgentHeader = request?.headers['user-agent'];

            const userAgent = Array.isArray(userAgentHeader)
                ? userAgentHeader[0] || ''
                : userAgentHeader || '';

            const navegador = this.detectarNavegador(userAgent);
            const sistema = this.detectarSistema(userAgent);
            const dispositivo = this.detectarDispositivo(userAgent);

            const auditoria = manager.create(
                CajaSesionDispositivo,
                {
                    sesion_uuid: randomUUID(),
                    token_hash: tokenHash,

                    user_id: String(userId),
                    caja_id: String(caja.id),
                    sucursal_id: String(caja.sucursal_id),

                    ip_address: request?.ip
                        ? request.ip.slice(0, 45)
                        : null,

                    user_agent: userAgent.slice(0, 2048),

                    navegador: navegador.nombre,
                    navegador_version: navegador.version,

                    sistema_operativo: sistema.nombre,
                    sistema_version: sistema.version,

                    tipo_dispositivo: dispositivo.tipo,
                    dispositivo: dispositivo.nombre,

                    origen: 'CAJA',

                    fecha_inicio: ahora,
                    fecha_expiracion: expiracion,
                    fecha_ultimo_uso: ahora,
                    fecha_cierre: null,
                    motivo_cierre: null,
                },
            );

            await manager.save(CajaSesionDispositivo, auditoria);
        });

        return {
            success: true,
            message: 'Sesión de Caja iniciada correctamente.',
            data: {
                caja: {
                    id: caja.id,
                    slug: caja.slug,
                    codigo: caja.codigo,
                    num_caja: caja.num_caja,
                    sucursal_id: caja.sucursal_id,
                },
                token,
                token_type: 'Caja',
                expires_at: expiracion,
                expires_in: this.DURACION_MINUTOS * 60,
            },
        };
    }

    async validarSesion(
        token: string,
        userId: string,
    ) {
        if (!token) {
            throw new UnauthorizedException(
                'No se recibió el token de Caja.',
            );
        }

        const tokenHash = this.hashToken(token);

        const sesion = await this.sesionesRepository.findOne({
            where: {
                token_hash: tokenHash,
            },
        });

        if (!sesion || sesion.revoked_at) {
            throw new UnauthorizedException(
                'La sesión de Caja no es válida.',
            );
        }

        if (String(sesion.user_id) !== String(userId)) {
            throw new ForbiddenException(
                'La sesión pertenece a otro usuario.',
            );
        }

        const ahora = new Date();

        if (
            new Date(sesion.expires_at).getTime() <=
            ahora.getTime()
        ) {
            throw new UnauthorizedException(
                'La sesión de Caja ha expirado.',
            );
        }

        const caja = await this.cajasRepository.findOne({
            where: {
                id: String(sesion.caja_id),
            },
        });

        if (
            !caja ||
            Number(caja.activa) !== 1 ||
            String(caja.user_id) !== String(userId)
        ) {
            throw new ForbiddenException(
                'La caja está inactiva o ya no pertenece a este usuario.',
            );
        }

        sesion.last_activity_at = ahora;
        sesion.expires_at = this.nuevaExpiracion();

        // Renovar la sesión y actualizar su auditoría.
        await this.dataSource.transaction(async (manager) => {
            await manager.save(CajaSesiones, sesion);

            await manager.update(
                CajaSesionDispositivo,
                { token_hash: tokenHash },
                {
                    fecha_ultimo_uso: ahora,
                    fecha_expiracion: sesion.expires_at,
                },
            );
        });

        return {
            success: true,
            message: 'Sesión de Caja válida.',
            data: {
                caja_id: sesion.caja_id,
                user_id: sesion.user_id,
                expires_at: sesion.expires_at,
            },
        };
    }

    async cerrarSesion(
        token: string,
        userId: string,
    ) {
        const tokenHash = this.hashToken(token);

        const sesion = await this.sesionesRepository.findOne({
            where: {
                token_hash: tokenHash,
                user_id: String(userId),
            },
        });

        if (!sesion || sesion.revoked_at) {
            throw new UnauthorizedException(
                'No existe una sesión activa para cerrar.',
            );
        }

        const ahora = new Date();

        sesion.revoked_at = ahora;
        sesion.revoked_by = String(userId);
        sesion.revocation_reason = 'CIERRE_VOLUNTARIO';

        // Cerrar la sesión y registrar el cierre del dispositivo.
        await this.dataSource.transaction(async (manager) => {
            await manager.save(CajaSesiones, sesion);

            await manager
                .createQueryBuilder()
                .update(CajaSesionDispositivo)
                .set({
                    fecha_cierre: ahora,
                    motivo_cierre: 'CIERRE_VOLUNTARIO',
                })
                .where('token_hash = :tokenHash', { tokenHash })
                .andWhere('fecha_cierre IS NULL')
                .execute();
        });

        return {
            success: true,
            message: 'Sesión de Caja cerrada correctamente.',
        };
    }
}

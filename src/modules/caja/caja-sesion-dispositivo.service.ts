import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import type { Request } from 'express';

import { CajaSesionDispositivo } from '../../database/entities/caja-sesiones-dispositivos.entity.js';

export interface RegistrarAccesoCaja {
    userId: string;
    cajaId: string;
    sucursalId: string;
    expiresAt: Date;
    request: Request;
    sesionUuid?: string;
}

@Injectable()
export class CajaSesionDispositivoService {
    private readonly logger = new Logger(
        CajaSesionDispositivoService.name,
    );

    constructor(
        @InjectRepository(CajaSesionDispositivo)
        private readonly repository: Repository<CajaSesionDispositivo>,
    ) {}

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

    async registrarAcceso(datos: RegistrarAccesoCaja) {
        const userAgentHeader = datos.request.headers['user-agent'];

        const userAgent = Array.isArray(userAgentHeader)
            ? userAgentHeader[0] || ''
            : userAgentHeader || '';

        const navegador = this.detectarNavegador(userAgent);
        const sistema = this.detectarSistema(userAgent);
        const dispositivo = this.detectarDispositivo(userAgent);

        // Express obtiene la IP de la conexión.
        // Si existe un proxy, debe configurarse trust proxy
        // únicamente para proxies confiables.
        const ip = datos.request.ip || null;

        const registro = this.repository.create({
            sesion_uuid: datos.sesionUuid || randomUUID(),

            user_id: datos.userId,
            caja_id: datos.cajaId,
            sucursal_id: datos.sucursalId,

            ip_address: ip ? ip.slice(0, 45) : null,
            user_agent: userAgent.slice(0, 2048),

            navegador: navegador.nombre,
            navegador_version: navegador.version,

            sistema_operativo: sistema.nombre,
            sistema_version: sistema.version,

            tipo_dispositivo: dispositivo.tipo,
            dispositivo: dispositivo.nombre,

            origen: 'CAJA',

            fecha_inicio: new Date(),
            fecha_expiracion: datos.expiresAt,
            fecha_ultimo_uso: new Date(),
            fecha_cierre: null,
            motivo_cierre: null,
        });

        const guardado = await this.repository.save(registro);

        this.logger.log(
            `Inicio de Caja registrado: sesion=${guardado.sesion_uuid}, ` +
            `caja=${datos.cajaId}, usuario=${datos.userId}`,
        );

        return {
            sesion_uuid: guardado.sesion_uuid,
            fecha_inicio: guardado.fecha_inicio,
            fecha_expiracion: guardado.fecha_expiracion,
        };
    }

    async cerrarSesion(
        sesionUuid: string,
        motivo = 'CIERRE_VOLUNTARIO',
    ) {
        await this.repository
            .createQueryBuilder()
            .update(CajaSesionDispositivo)
            .set({
                fecha_cierre: new Date(),
                motivo_cierre: motivo,
            })
            .where('sesion_uuid = :sesionUuid', { sesionUuid })
            .andWhere('fecha_cierre IS NULL')
            .execute();
    }

    async obtenerSesionesUsuario(
        userId: string,
        limite = 50,
    ) {
        const sesiones = await this.repository.find({
            where: {
                user_id: userId,
            },
            order: {
                fecha_inicio: 'DESC',
            },
            take: Math.min(Math.max(limite, 1), 100),
        });

        return sesiones.map((s) => ({
            sesion_uuid: s.sesion_uuid,
            ip: s.ip_address,
            navegador: s.navegador,
            navegador_version: s.navegador_version,
            sistema_operativo: s.sistema_operativo,
            sistema_version: s.sistema_version,
            tipo_dispositivo: s.tipo_dispositivo,
            dispositivo: s.dispositivo,
            fecha_inicio: s.fecha_inicio,
            fecha_expiracion: s.fecha_expiracion,
            fecha_cierre: s.fecha_cierre,
        }));
    }
}
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { NotaCreditoClientes } from '../../database/entities/index.js';
import { SpacesService } from '../spaces/spaces.service.js';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

@Injectable()
export class NotasCreditoConsultasService {
    private readonly fechaInicio = '2026-11-01 00:00:00';
    private readonly limite = 50;

    constructor(
        private readonly dataSource: DataSource,
        private readonly spacesService: SpacesService,
    ) {}

    // ==========================================
    // LISTADO DE NOTAS DE CRÉDITO
    // ==========================================

    async index(pagina = 1, buscar = '') {
        pagina = Number(pagina);

        if (!Number.isSafeInteger(pagina) || pagina < 1) {
            throw new BadRequestException('La página solicitada no es válida.');
        }

        const termino = String(buscar ?? '').trim();
        const offset = (pagina - 1) * this.limite;
        const parametros: unknown[] = [this.fechaInicio];

        const condiciones: string[] = [
            'nc.created_at > ?',
        ];

        if (termino.length > 100) {
            throw new BadRequestException('El término de búsqueda es demasiado largo.');
        }

        if (termino.length > 0 && termino.length < 3) {
            throw new BadRequestException('Ingresa al menos 3 caracteres para realizar la búsqueda.');
        }

        if (termino.length >= 3) {
            const coincidencia = `%${termino}%`;
            const identidad = `%${termino.replace(/[-\s]/g, '')}%`;

            condiciones.push(`
                (
                    nc.codigo LIKE ?
                    OR nc.referencia LIKE ?
                    OR v.cod LIKE ?
                    OR CONCAT_WS(' ', c.nombres, c.apellidos) LIKE ?
                    OR REPLACE(REPLACE(c.identidad, '-', ''), ' ', '') LIKE ?
                )
            `);

            parametros.push(
                coincidencia,
                coincidencia,
                coincidencia,
                coincidencia,
                identidad,
            );
        }

        const joins = `
            FROM nota_credito_clientes nc
            LEFT JOIN ventas v ON v.id = nc.venta_id
            LEFT JOIN clientes c ON c.id = COALESCE(nc.cliente_id, v.cliente_id)
        `;

        const where = condiciones.join(' AND ');

        const [registros, conteo] = await Promise.all([
            this.dataSource.query(`
                SELECT
                    nc.slug,
                    nc.codigo,
                    nc.referencia,
                    nc.modalidad,
                    nc.origen,
                    nc.uso,
                    nc.estado,
                    nc.tipo,
                    nc.monto,
                    nc.saldo_disponible,
                    nc.concepto,
                    nc.created_at,
                    nc.fecha_vencimiento,
                    nc.fecha_anulacion,
                    CASE WHEN nc.url IS NOT NULL AND nc.url <> '' THEN 1 ELSE 0 END AS archivo_adjunto,
                    CASE WHEN nc.url_comprobante IS NOT NULL AND nc.url_comprobante <> '' THEN 1 ELSE 0 END AS comprobante_disponible,
                    c.slug AS cliente_slug,
                    CONCAT_WS(' ', c.nombres, c.apellidos) AS cliente_nombre,
                    c.identidad AS cliente_identidad,
                    v.slug AS venta_slug,
                    v.cod AS venta_codigo,
                    t.nombre AS tipo_nombre,
                    u.usuario AS usuario,
                    CONCAT_WS(' ', co.nombres, co.apellidos) AS usuario_nombre
                ${joins}
                LEFT JOIN tipo_nota_creditos t ON t.id = nc.tipo_nota_credito_id
                LEFT JOIN users u ON u.id = nc.user_id
                LEFT JOIN colaboradors co ON co.id = u.colaborador_id
                WHERE ${where}
                ORDER BY nc.created_at DESC, nc.id DESC
                LIMIT ? OFFSET ?
            `, [...parametros, this.limite, offset]),

            this.dataSource.query(`
                SELECT COUNT(*) AS total
                ${joins}
                WHERE ${where}
            `, parametros),
        ]);

        const total = Number(conteo[0]?.total ?? 0);
        const ultimaPagina = Math.ceil(total / this.limite);

        return {
            success: true,
            data: registros.map((registro: any) => this.formatearRegistro(registro)),
            pagination: {
                pagina_actual: pagina,
                por_pagina: this.limite,
                total,
                ultima_pagina: ultimaPagina,
                tiene_siguiente: pagina < ultimaPagina,
                tiene_anterior: pagina > 1,
            },
        };
    }

    // ==========================================
    // DETALLE DE NOTA DE CRÉDITO
    // ==========================================

    async detalle(slug: string) {
        const registros = await this.dataSource.query(`
            SELECT
                nc.slug,
                nc.codigo,
                nc.contador,
                nc.referencia,
                nc.concepto,
                nc.motivo,
                nc.modalidad,
                nc.origen,
                nc.uso,
                nc.estado,
                nc.tipo,
                nc.monto,
                nc.saldo_disponible,
                nc.saldo_anterior,
                nc.saldo_nuevo,
                nc.created_at,
                nc.updated_at,
                nc.fecha_vencimiento,
                nc.fecha_liquidacion,
                nc.fecha_anulacion,
                nc.motivo_anulacion,
                nc.anticipo_cliente_id,
                nc.venta_id,
                nc.recibo_id,
                nc.recibo_id_2,
                nc.cc_id,
                nc.ct_libro_diario_id,
                CASE WHEN nc.url IS NOT NULL AND nc.url <> '' THEN 1 ELSE 0 END AS archivo_adjunto,
                CASE WHEN nc.url_comprobante IS NOT NULL AND nc.url_comprobante <> '' THEN 1 ELSE 0 END AS comprobante_disponible,
                c.slug AS cliente_slug,
                CONCAT_WS(' ', c.nombres, c.apellidos) AS cliente_nombre,
                c.identidad AS cliente_identidad,
                c.email AS cliente_email,
                v.slug AS venta_slug,
                v.cod AS venta_codigo,
                v.total AS venta_total,
                v.saldo_actual AS venta_saldo,
                v.tipo_venta AS venta_tipo,
                t.nombre AS tipo_nombre,
                u.usuario AS usuario,
                CONCAT_WS(' ', co.nombres, co.apellidos) AS usuario_nombre,
                ua.usuario AS usuario_anulacion,
                CONCAT_WS(' ', coa.nombres, coa.apellidos) AS usuario_anulacion_nombre,
                a.slug AS anticipo_slug,
                r.codigo AS recibo_codigo
            FROM nota_credito_clientes nc
            LEFT JOIN ventas v ON v.id = nc.venta_id
            LEFT JOIN clientes c ON c.id = COALESCE(nc.cliente_id, v.cliente_id)
            LEFT JOIN tipo_nota_creditos t ON t.id = nc.tipo_nota_credito_id
            LEFT JOIN users u ON u.id = nc.user_id
            LEFT JOIN colaboradors co ON co.id = u.colaborador_id
            LEFT JOIN users ua ON ua.id = nc.user_anulacion_id
            LEFT JOIN colaboradors coa ON coa.id = ua.colaborador_id
            LEFT JOIN anticipo_clientes a ON a.id = nc.anticipo_cliente_id
            LEFT JOIN recibos r ON r.id = nc.recibo_id
            WHERE nc.slug = ?
            AND nc.created_at > ?
            LIMIT 1
        `, [slug, this.fechaInicio]);

        const nota = registros[0];

        if (!nota) {
            throw new NotFoundException('La nota de crédito solicitada no existe.');
        }

        const aplicaciones = await this.obtenerAplicaciones(slug);

        const aplicacionesActivas = aplicaciones.filter((aplicacion: { estado: number }) => aplicacion.estado === 1);

        const elegibleAnulacion =
            Number(nota.estado) === 1 &&
            nota.origen === 'CONTABILIDAD' &&
            nota.modalidad === 'SALDO_FAVOR' &&
            Number(nota.tipo) === 1 &&
            !nota.anticipo_cliente_id &&
            !nota.venta_id &&
            !nota.recibo_id &&
            !nota.recibo_id_2 &&
            !nota.cc_id &&
            !nota.ct_libro_diario_id &&
            aplicacionesActivas.length === 0 &&
            Number(nota.monto) > 0 &&
            Math.round(Number(nota.monto) * 100) === Math.round(Number(nota.saldo_disponible) * 100);

        return {
            success: true,
            data: {
                ...this.formatearRegistro(nota),
                contador: nota.contador,
                motivo: nota.motivo,
                saldo_anterior: Number(nota.saldo_anterior ?? 0),
                saldo_nuevo: Number(nota.saldo_nuevo ?? 0),
                monto_utilizado: this.calcularMontoUtilizado(nota),
                fecha_actualizacion: nota.updated_at,
                fecha_liquidacion: nota.fecha_liquidacion,
                cliente: nota.cliente_slug ? {
                    slug: nota.cliente_slug,
                    nombre_completo: nota.cliente_nombre,
                    identidad: nota.cliente_identidad,
                    email: nota.cliente_email,
                } : null,
                cuenta: nota.venta_slug ? {
                    slug: nota.venta_slug,
                    codigo: nota.venta_codigo,
                    total: Number(nota.venta_total ?? 0),
                    saldo_actual: Number(nota.venta_saldo ?? 0),
                    tipo_venta: Number(nota.venta_tipo),
                } : null,
                anticipo: nota.anticipo_slug ? {
                    slug: nota.anticipo_slug,
                } : null,
                recibo: nota.recibo_codigo ? {
                    codigo: nota.recibo_codigo,
                } : null,
                anulacion: nota.fecha_anulacion ? {
                    fecha: nota.fecha_anulacion,
                    motivo: nota.motivo_anulacion,
                    usuario: nota.usuario_anulacion,
                    nombre: nota.usuario_anulacion_nombre || nota.usuario_anulacion,
                } : null,
                aplicaciones,
                total_aplicaciones: aplicaciones.length,
                permite_anular: elegibleAnulacion,
            },
        };
    }

    // ==========================================
    // HISTORIAL DE APLICACIONES
    // ==========================================

    private async obtenerAplicaciones(slug: string) {
        const registros = await this.dataSource.query(`
            SELECT
                ap.slug,
                ap.tipo_aplicacion,
                ap.monto,
                ap.saldo_anterior,
                ap.saldo_nuevo,
                ap.concepto,
                ap.estado,
                ap.created_at,
                ap.fecha_anulacion,
                ap.motivo_anulacion,
                v.slug AS venta_slug,
                v.cod AS venta_codigo,
                r.codigo AS recibo_codigo,
                u.usuario AS usuario,
                CONCAT_WS(' ', co.nombres, co.apellidos) AS usuario_nombre
            FROM nota_credito_cliente_aplicaciones ap
            INNER JOIN nota_credito_clientes nc ON nc.id = ap.nota_credito_cliente_id
            LEFT JOIN ventas v ON v.id = ap.venta_id
            LEFT JOIN recibos r ON r.id = ap.recibo_id
            LEFT JOIN users u ON u.id = ap.user_id
            LEFT JOIN colaboradors co ON co.id = u.colaborador_id
            WHERE nc.slug = ?
            ORDER BY ap.created_at DESC, ap.id DESC
        `, [slug]);

        return registros.map((registro: any) => ({
            slug: registro.slug,
            tipo_aplicacion: registro.tipo_aplicacion,
            monto: Number(registro.monto),
            saldo_anterior: Number(registro.saldo_anterior),
            saldo_nuevo: Number(registro.saldo_nuevo),
            concepto: registro.concepto,
            estado: Number(registro.estado),
            fecha: registro.created_at,
            fecha_anulacion: registro.fecha_anulacion,
            motivo_anulacion: registro.motivo_anulacion,
            cuenta: registro.venta_slug ? {
                slug: registro.venta_slug,
                codigo: registro.venta_codigo,
            } : null,
            recibo: registro.recibo_codigo ? {
                codigo: registro.recibo_codigo,
            } : null,
            usuario: {
                usuario: registro.usuario,
                nombre: registro.usuario_nombre || registro.usuario,
            },
        }));
    }

    // ==========================================
    // ACCESO TEMPORAL A DOCUMENTOS EN SPACES
    // ==========================================

    async obtenerArchivo(slug: string, tipo: string = 'adjunto') {
        if (!['adjunto', 'comprobante'].includes(tipo)) {
            throw new BadRequestException('El tipo de documento solicitado no es válido.');
        }

        const nota = await this.dataSource.getRepository(NotaCreditoClientes).findOne({
            where: { slug },
        });

        if (!nota || !nota.created_at || new Date(nota.created_at).getTime() <= new Date(2026, 10, 1).getTime()) {
            throw new NotFoundException('La nota de crédito no existe.');
        }

        const key = tipo === 'comprobante' ? nota.url_comprobante : nota.url;

        if (!key) {
            throw new NotFoundException('La nota de crédito no tiene el documento solicitado.');
        }

        if (!key.startsWith('Contabilidad/notas-credito/clientes/')) {
            throw new BadRequestException('La ubicación del documento no es compatible.');
        }

        const duracion = 300;
        const url = await this.spacesService.generarUrlFirmada(key, duracion);

        return {
            success: true,
            data: {
                url,
                tipo,
                expira_en: duracion,
                nombre_archivo: key.split('/').pop(),
            },
        };
    }

    // ==========================================
    // FORMATEAR REGISTRO
    // ==========================================

    private formatearRegistro(registro: any) {
        return {
            slug: registro.slug,
            codigo: registro.codigo,
            referencia: registro.referencia,
            modalidad: registro.modalidad,
            origen: registro.origen,
            uso: registro.uso,
            estado: Number(registro.estado),
            estado_nombre: this.nombreEstado(Number(registro.estado)),
            tipo: Number(registro.tipo),
            tipo_nota_credito: registro.tipo_nombre,
            monto: Number(registro.monto ?? 0),
            saldo_disponible: Number(registro.saldo_disponible ?? 0),
            concepto: registro.concepto,
            fecha_creacion: registro.created_at,
            fecha_vencimiento: registro.fecha_vencimiento,
            fecha_anulacion: registro.fecha_anulacion,
            vencida: this.estaVencida(registro.fecha_vencimiento),
            archivo_adjunto: Boolean(Number(registro.archivo_adjunto)),
            comprobante_disponible: Boolean(Number(registro.comprobante_disponible)),
            permite_consultar: Boolean(registro.slug),
            cliente: registro.cliente_slug ? {
                slug: registro.cliente_slug,
                nombre_completo: registro.cliente_nombre,
                identidad: registro.cliente_identidad,
            } : null,
            cuenta: registro.venta_slug ? {
                slug: registro.venta_slug,
                codigo: registro.venta_codigo,
            } : null,
            usuario: {
                usuario: registro.usuario,
                nombre: registro.usuario_nombre || registro.usuario,
            },
        };
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    private nombreEstado(estado: number): string {
        switch (estado) {
            case 0: return 'INACTIVA';
            case 1: return 'DISPONIBLE';
            case 2: return 'LIQUIDADA';
            case 3: return 'ANULADA';
            default: return 'DESCONOCIDO';
        }
    }

    private estaVencida(fecha: string | Date | null): boolean {
        if (!fecha) return false;

        const valor = typeof fecha === 'string'
            ? fecha.substring(0, 10)
            : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

        const { fecha: hoy } = fechaHonduras();

        return valor < hoy;
    }

    private calcularMontoUtilizado(nota: any): number {
        if (nota.modalidad !== 'SALDO_FAVOR' || Number(nota.estado) === 3) {
            return 0;
        }

        return Math.max(0, Math.round(
            (Number(nota.monto) - Number(nota.saldo_disponible)) * 100,
        ) / 100);
    }
}
import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

@Injectable()
export class CajaHistorialCierresService {
    constructor(private readonly dataSource: DataSource) {}

    private validarCaja(cajaId: string): string {
        const valor = String(cajaId ?? '').trim();
        if (!/^[1-9]\d*$/.test(valor)) throw new BadRequestException('Caja inválida.');
        return valor;
    }

    private obtenerRango() {
        const hasta = fechaHonduras().fecha;
        const fecha = new Date(`${hasta}T00:00:00.000Z`);
        fecha.setUTCDate(fecha.getUTCDate() - 89);
        const desde = fecha.toISOString().slice(0, 10);
        return { desde, hasta };
    }

    private validarFecha(fecha: string): string {
        const valor = String(fecha ?? '').trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new BadRequestException('Formato de fecha inválido.');
        }

        const fechaValidada = new Date(`${valor}T00:00:00.000Z`);

        if (Number.isNaN(fechaValidada.getTime()) || fechaValidada.toISOString().slice(0, 10) !== valor) {
            throw new BadRequestException('Fecha inválida.');
        }

        const { desde, hasta } = this.obtenerRango();

        if (valor < desde || valor > hasta) {
            throw new BadRequestException('La fecha está fuera del período de los últimos 90 días.');
        }

        return valor;
    }

    private monto(valor: unknown): string {
        const numero = Number(valor ?? 0);
        return Number.isFinite(numero) ? numero.toFixed(2) : '0.00';
    }

    private booleano(valor: unknown): boolean {
        return valor === true || Number(valor) === 1;
    }

    private tieneDocumento(valor: unknown): boolean {
        return typeof valor === 'string' && valor.trim().length > 0;
    }

    private normalizarRegistro(registro: any) {
        return {
            fecha: String(registro.fecha),
            caja: {
                slug: registro.caja_slug,
                codigo: registro.caja_codigo,
                numero: registro.num_caja,
            },
            sucursal: registro.sucursal || 'Sin sucursal',
            usuario: registro.usuario || 'No disponible',
            revisado: this.booleano(registro.revisado),
            tiene_documento: this.tieneDocumento(registro.file),
            liquidado: Number(registro.total_acumulado) === 0,
            total_acumulado_h: this.monto(registro.total_acumulado_h),
            total_acumulado: this.monto(registro.total_acumulado),
        };
    }

    // ==========================================
    // NORMALIZAR COMPROBANTES DE EGRESOS
    // ==========================================

    private normalizarEgreso(registro: any) {
        const referencia = String(registro.referencia ?? '').trim();
        const partes = referencia.split(' | ');

        const coincidenciaCierre = partes.length >= 4
            ? partes[2].match(/^Cierre:\s*(\d{4}-\d{2}-\d{2})$/i)
            : null;

        const coincidenciaMonto = coincidenciaCierre
            ? partes[1].match(/^Depósito L\.\s*(\d+(?:\.\d{1,2})?)$/i)
            : null;

        const esHistorico = Number(registro.total) === 0 && !!coincidenciaCierre && !!coincidenciaMonto;

        const monto = esHistorico && coincidenciaMonto
            ? Number(coincidenciaMonto[1])
            : Number(registro.total ?? 0);

        return {
            tipo: esHistorico ? 'DEPOSITO_HISTORICO' : 'EGRESO',
            referencia: esHistorico ? partes[0] : referencia,
            referencia_completa: referencia,
            observacion: esHistorico ? partes.slice(3).join(' | ') || null : null,
            fecha_cierre: esHistorico && coincidenciaCierre ? coincidenciaCierre[1] : String(registro.fecha),
            fecha_deposito: String(registro.fecha),
            monto: this.monto(monto),
            total_registrado: this.monto(registro.total),
            forma_pago: registro.forma_pago || 'No disponible',
            usuario: null,
            created_at: registro.created_at,
            comprobante: {
                disponible: true,
                tipo: 'application/pdf',
                path: String(registro.historial).trim(),
            },
        };
    }

    // ==========================================
    // LISTADO DE LOS ÚLTIMOS 90 DÍAS
    // ==========================================

    async listar(cajaId: string) {
        const caja = this.validarCaja(cajaId);
        const { desde, hasta } = this.obtenerRango();

        const registros = await this.dataSource.query(`
            SELECT
                DATE_FORMAT(cc.fecha, '%Y-%m-%d') AS fecha,
                c.slug AS caja_slug,
                c.codigo AS caja_codigo,
                c.num_caja,
                s.nombre AS sucursal,
                u.usuario AS usuario,
                cc.revisado,
                cc.file,
                cc.total_acumulado_h,
                cc.total_acumulado
            FROM cierre_cajas cc
            INNER JOIN cajas c ON c.id = cc.cajas_id
            LEFT JOIN sucursals s ON s.id = c.sucursal_id
            LEFT JOIN users u ON u.id = cc.user_id
            WHERE cc.cajas_id = ?
              AND cc.fecha BETWEEN ? AND ?
            ORDER BY cc.fecha DESC, cc.id DESC
        `, [caja, desde, hasta]);

        const cierres = registros.map((registro: any) => this.normalizarRegistro(registro));

        return {
            success: true,
            data: {
                desde,
                hasta,
                cantidad: cierres.length,
                cierres,
            },
        };
    }

    // ==========================================
    // DETALLES DEL CIERRE
    // ==========================================

    async obtenerDetalle(cajaId: string, fechaSolicitada: string) {
        const caja = this.validarCaja(cajaId);
        const fecha = this.validarFecha(fechaSolicitada);

        return this.dataSource.transaction('REPEATABLE READ', async manager => {

            const registros = await manager.query(`
                SELECT
                    cc.id,
                    DATE_FORMAT(cc.fecha, '%Y-%m-%d') AS fecha,
                    c.slug AS caja_slug,
                    c.codigo AS caja_codigo,
                    c.num_caja,
                    s.nombre AS sucursal,
                    u.usuario AS usuario,
                    cc.revisado,
                    cc.file,
                    cc.total,
                    cc.ingreso,
                    cc.egreso,
                    cc.efectivo,
                    cc.efectivo_declarado,
                    cc.descuadre,
                    cc.observacion,
                    cc.comentario_revision,
                    cc.total_acumulado_h,
                    cc.total_acumulado,
                    cc.created_at,
                    cc.updated_at
                FROM cierre_cajas cc
                INNER JOIN cajas c ON c.id = cc.cajas_id
                LEFT JOIN sucursals s ON s.id = c.sucursal_id
                LEFT JOIN users u ON u.id = cc.user_id
                WHERE cc.cajas_id = ?
                  AND cc.fecha = ?
                LIMIT 2
            `, [caja, fecha]);

            if (!registros.length) {
                throw new NotFoundException('No se encontró el cierre solicitado.');
            }

            if (registros.length > 1) {
                throw new ConflictException('Existe más de un cierre para esta caja y fecha.');
            }

            const cierre = registros[0];

            // IMPORTANTE:
            // El usuario de caja solamente recibe comentarios visibles.
            // Los comentarios privados nunca salen de esta consulta.

            const comentarios = await manager.query(`
                SELECT
                    co.comentario,
                    co.falta_grave,
                    co.revision,
                    co.created_at,
                    u.usuario AS usuario
                FROM comentario_cierres co
                LEFT JOIN users u ON u.id = co.user_id
                WHERE co.cierre_caja_id = ?
                  AND co.visible = 1
                ORDER BY co.created_at DESC, co.id DESC
            `, [cierre.id]);

            // ==========================================
            // EGRESOS CON COMPROBANTES PDF
            // ==========================================

            const registrosEgresos = await manager.query(`
                SELECT
                    DATE_FORMAT(hc.fecha, '%Y-%m-%d') AS fecha,
                    hc.referencia,
                    hc.total,
                    hc.historial,
                    hc.created_at,
                    fp.nombre AS forma_pago
                FROM historial_cajas hc
                LEFT JOIN forma_pagos fp ON fp.id = hc.forma_pago_id
                WHERE hc.cajas_id = ?
                  AND hc.tipo_documento = 4
                  AND hc.tipo = 1
                  AND hc.historial IS NOT NULL
                  AND TRIM(hc.historial) <> ''
                  AND LOWER(TRIM(hc.historial)) LIKE '%.pdf'
                  AND hc.fecha >= ?
                ORDER BY hc.fecha DESC, hc.created_at DESC, hc.id DESC
            `, [caja, fecha]);

            const egresos = registrosEgresos
                .map((registro: any) => this.normalizarEgreso(registro))
                .filter((egreso: ReturnType<typeof this.normalizarEgreso>) => egreso.fecha_cierre === fecha);

            return {
                success: true,
                data: {
                    ...this.normalizarRegistro(cierre),

                    total: this.monto(cierre.total),
                    ingreso: this.monto(cierre.ingreso),
                    egreso: this.monto(cierre.egreso),
                    efectivo: this.monto(cierre.efectivo),
                    efectivo_declarado: this.monto(cierre.efectivo_declarado),
                    descuadre: this.monto(cierre.descuadre),

                    observacion: cierre.observacion || null,
                    comentario_revision: cierre.comentario_revision || null,

                    created_at: cierre.created_at,
                    updated_at: cierre.updated_at,

                    comentarios: comentarios.map((comentario: any) => ({
                        comentario: comentario.comentario,
                        usuario: comentario.usuario || 'No disponible',
                        falta_grave: this.booleano(comentario.falta_grave),
                        revision: this.booleano(comentario.revision),
                        created_at: comentario.created_at,
                    })),

                    cantidad_egresos: egresos.length,
                    egresos,
                },
            };
        });
    }

    // ==========================================
    // OBTENER ARCHIVO PRIVADO
    // ==========================================

    async obtenerArchivo(cajaId: string, fechaSolicitada: string): Promise<string> {
        const caja = this.validarCaja(cajaId);
        const fecha = this.validarFecha(fechaSolicitada);

        const registros = await this.dataSource.query(`
            SELECT file
            FROM cierre_cajas
            WHERE cajas_id = ?
              AND fecha = ?
                LIMIT 2
        `, [caja, fecha]);

        if (!registros.length) {
            throw new NotFoundException('No se encontró el cierre.');
        }

        if (registros.length > 1) {
            throw new ConflictException('Existe más de un cierre para esta fecha.');
        }

        const archivo = registros[0].file;

        if (!this.tieneDocumento(archivo)) {
            throw new NotFoundException('El cierre todavía no tiene un documento firmado.');
        }

        return String(archivo).trim();
    }
}
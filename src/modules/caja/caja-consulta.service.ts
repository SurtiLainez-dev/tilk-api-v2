import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

// ============================================
// INTERFACES
// ============================================

interface CajaRow {
    id: string;
    slug: string;
    sucursal_id: string;
    user_id: string;
    codigo: string;
    num_caja: number;
    estado_cierre: number;
    total: number | string;
    registro: string | null;
    resumen: unknown | null;
    total_inicio: number | null;
    hora_inicio: string | null;
    hora_cierre: string | null;
    estado: number | null;
    activa: number | null;
    is_conta: number | null;
    saldo_acumulado: number | string;
    created_at: Date | string | null;
    updated_at: Date | string | null;

    sucursal_nombre: string | null;
    sucursal_codigo: number | null;
    sucursal_abreviatura: string | null;
}

interface HistorialCajaRow {
    id: string;
    cajas_id: string;
    forma_pago_id: string;
    referencia: string | null;
    tipo_documento: number | string;
    recibo_id: string | null;
    factura_id: string | null;
    total: number | string;
    fecha: string | Date;
    created_at: string | Date | null;
    updated_at: string | Date | null;
    tipo: number | string | null;
    historial: string | null;

    forma_pago_nombre: string | null;
    forma_pago_is_tarjeta: number | null;
    forma_pago_cuenta_banco_id: string | null;

    recibo_codigo: string | null;
    recibo_referencia: string | null;

    factura_contador: string | null;
    factura_file: string | null;
}

type EfectoMovimiento =
    | 'INGRESO'
    | 'EGRESO'
    | 'NEUTRO'
    | 'PENDIENTE';

interface ClasificacionMovimiento {
    codigo: string;
    nombre: string;
    efecto: EfectoMovimiento;
}

interface FormaPagoResumen {
    id: string;
    nombre: string;
    is_tarjeta: boolean;
    cuenta_banco_id: string | null;

    cantidad_movimientos: number;
    cantidad_ingresos: number;
    cantidad_egresos: number;
    cantidad_neutros: number;
    cantidad_pendientes: number;

    total_ingresos: number;
    total_egresos: number;
    neto: number;
}

@Injectable()
export class CajaConsultaService {
    private readonly logger = new Logger(
        CajaConsultaService.name,
    );

    constructor(
        private readonly dataSource: DataSource,
    ) {}

    // ============================================
    // UTILIDADES
    // ============================================

    private numero(
        valor: number | string | null | undefined,
    ): number {
        const resultado = Number(valor ?? 0);

        if (!Number.isFinite(resultado)) {
            throw new BadRequestException(
                'Se encontró un importe inválido en los datos de caja.',
            );
        }

        return resultado;
    }

    private dinero(valor: number): number {
        return Math.round(
            (valor + Number.EPSILON) * 100,
        ) / 100;
    }

    private fechaTexto(
        valor: string | Date | null,
    ): string | null {
        if (!valor) {
            return null;
        }

        if (valor instanceof Date) {
            return [
                valor.getUTCFullYear(),
                String(
                    valor.getUTCMonth() + 1,
                ).padStart(2, '0'),
                String(
                    valor.getUTCDate(),
                ).padStart(2, '0'),
            ].join('-');
        }

        return String(valor).slice(0, 10);
    }

    private fechaConsulta(): {
        fecha: string;
        hora: string;
        fecha_hora: string;
        zona_horaria: string;
    } {
        const { fecha, hora, fecha_hora, zona_horaria } = fechaHonduras();

        return { fecha, hora, fecha_hora, zona_horaria };
    }

    // ============================================
    // CLASIFICACIÓN DE MOVIMIENTOS
    // ============================================


    private clasificar(tipoDocumento: number, tipo: number): ClasificacionMovimiento {
        const documentos: Record<number, { codigo: string; nombre: string }> = {
            1: { codigo: 'FACTURA_COMPRA', nombre: 'Factura de compra' },
            2: { codigo: 'ABONO_CUENTA', nombre: 'Recibo de abono de cuenta' },
            4: { codigo: 'EGRESO', nombre: 'Egreso de caja' },
            5: { codigo: 'ANTICIPO_CLIENTE', nombre: 'Anticipo de cliente' },
            6: { codigo: 'CIERRE_CAJA_CHICA', nombre: 'Cierre de caja chica' },
        };

        const documento = documentos[tipoDocumento];

        if (tipoDocumento === 6 && tipo === 0) {
            return {
                codigo: 'CIERRE_CAJA_CHICA',
                nombre: 'Cierre de caja chica',
                efecto: 'NEUTRO',
            };
        }

        if (tipo === 0) {
            return {
                codigo: documento?.codigo ?? 'OTRO_INGRESO',
                nombre: documento?.nombre ?? 'Otro ingreso de caja',
                efecto: 'INGRESO',
            };
        }

        if (tipo === 1) {
            return {
                codigo: documento?.codigo ?? 'OTRO_EGRESO',
                nombre: documento?.nombre ?? 'Otro egreso de caja',
                efecto: 'EGRESO',
            };
        }

        return {
            codigo: 'NO_CLASIFICADO',
            nombre: 'Movimiento no clasificado',
            efecto: 'PENDIENTE',
        };
    }


    // ============================================
    // CONSULTAR CAJA POR SLUG
    // ============================================

    private async buscarCaja(
        slug: string,
    ): Promise<CajaRow> {

        const filas = await this.dataSource.query(
            `
SELECT
c.id,
    c.slug,
    c.sucursal_id,
    c.user_id,
    c.codigo,
    c.num_caja,
    c.estado_cierre,
    c.total,
    c.registro,
    c.resumen,
    c.total_inicio,
    c.hora_inicio,
    c.hora_cierre,
    c.estado,
    c.activa,
    c.is_conta,
    c.saldo_acumulado,
    c.created_at,
    c.updated_at,

    s.nombre AS sucursal_nombre,
    s.cod AS sucursal_codigo,
    s.abreviatura AS sucursal_abreviatura

FROM cajas c

LEFT JOIN sucursals s
ON s.id = c.sucursal_id

WHERE c.slug = ?

    LIMIT 1
        `,
            [slug],
        ) as CajaRow[];

        const caja = filas[0];

        if (!caja) {
            throw new NotFoundException(
                `No se encontró la caja con slug ${slug}.`,
            );
        }

        return caja;
    }

    // ============================================
    // CONSULTAR HISTORIAL POR FECHA
    // ============================================

    private async buscarHistorial(
        cajaId: string,
        fecha: string,
    ): Promise<HistorialCajaRow[]> {

        return this.dataSource.query(
            `
SELECT
hc.id,
    hc.cajas_id,
    hc.forma_pago_id,
    hc.referencia,
    hc.tipo_documento,
    hc.recibo_id,
    hc.factura_id,
    hc.total,
    hc.fecha,
    hc.created_at,
    hc.updated_at,
    hc.tipo,
    hc.historial,

    fp.nombre AS forma_pago_nombre,
    fp.is_tarjeta AS forma_pago_is_tarjeta,
    fp.cuenta_banco_id AS forma_pago_cuenta_banco_id,

    r.codigo AS recibo_codigo,
    r.referencia AS recibo_referencia,

    fv.contador AS factura_contador,
    fv.file AS factura_file

FROM historial_cajas hc

LEFT JOIN forma_pagos fp
ON fp.id = hc.forma_pago_id

LEFT JOIN recibos r
ON r.id = hc.recibo_id

LEFT JOIN factura_ventas fv
ON fv.id = hc.factura_id

WHERE hc.cajas_id = ?
    AND hc.fecha = ?

        ORDER BY
hc.fecha DESC,
    hc.id DESC
    `,
            [cajaId, fecha],
        ) as Promise<HistorialCajaRow[]>;
    }

    // ============================================
    // MÉTODO PRINCIPAL
    // ============================================

    async consultarPorSlug(slug: string, fecha?: string) {
        const inicio = Date.now();
        const slugLimpio = slug?.trim();

        if (!slugLimpio) {
            throw new BadRequestException('Debe proporcionar el slug de la caja.');
        }

        const prefijo = `[CAJA:${slugLimpio}]`;

        this.logger.log(`${prefijo} INICIANDO CONSULTA`);

        // ========================================
        // 1. DATOS DE CAJA
        // ========================================

        const caja = await this.buscarCaja(slugLimpio);

        this.logger.log(`${prefijo} Caja encontrada: ${caja.codigo}`);

        // ========================================
        // 2. VALIDAR FECHA DE CONSULTA
        // ========================================

        const consulta = this.fechaConsulta();

        if (fecha !== undefined) {
            const fechaSolicitada = fecha.trim();

            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaSolicitada)) {
                throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD.');
            }

            const fechaValidada = new Date(`${fechaSolicitada}T00:00:00.000Z`);

            if (Number.isNaN(fechaValidada.getTime()) || fechaValidada.toISOString().slice(0, 10) !== fechaSolicitada) {
                throw new BadRequestException('La fecha proporcionada no es válida.');
            }

            if (fechaSolicitada > consulta.fecha) {
                throw new BadRequestException('No se pueden consultar fechas futuras.');
            }

            consulta.fecha = fechaSolicitada;
        }

        // ========================================
        // 3. CONSULTAR HISTORIAL DE LA FECHA
        // ========================================

        const movimientos = await this.buscarHistorial(caja.id, consulta.fecha);

        this.logger.log(`${prefijo} Historial del ${consulta.fecha}: ${movimientos.length} movimientos`);

        // ========================================
        // 4. RESUMEN GENERAL
        // ========================================

        let totalIngresos = 0;
        let totalEgresos = 0;

        let cantidadIngresos = 0;
        let cantidadEgresos = 0;
        let cantidadNeutros = 0;
        let cantidadPendientes = 0;

        const formasPago = new Map<string, FormaPagoResumen>();

        // ========================================
        // 5. PROCESAR HISTORIAL
        // ========================================

        const historial = movimientos.map((movimiento) => {

            const tipoDocumento = this.numero(movimiento.tipo_documento);
            const tipo = this.numero(movimiento.tipo);
            const monto = this.numero(movimiento.total);
            const clasificacion = this.clasificar(tipoDocumento, tipo);

            let impactoSaldo = 0;

            if (clasificacion.efecto === 'INGRESO') {
                totalIngresos += monto;
                cantidadIngresos++;
                impactoSaldo = monto;
            }

            if (clasificacion.efecto === 'EGRESO') {
                totalEgresos += monto;
                cantidadEgresos++;
                impactoSaldo = -monto;
            }

            if (clasificacion.efecto === 'NEUTRO') {
                cantidadNeutros++;
            }

            if (clasificacion.efecto === 'PENDIENTE') {
                cantidadPendientes++;
            }

            // ====================================
            // AGRUPAR POR FORMA DE PAGO
            // ====================================

            const formaPagoId = String(movimiento.forma_pago_id);

            if (!formasPago.has(formaPagoId)) {
                formasPago.set(formaPagoId, {
                    id: formaPagoId,
                    nombre: movimiento.forma_pago_nombre ?? 'Sin identificar',
                    is_tarjeta: Number(movimiento.forma_pago_is_tarjeta ?? 0) === 1,
                    cuenta_banco_id: movimiento.forma_pago_cuenta_banco_id,

                    cantidad_movimientos: 0,
                    cantidad_ingresos: 0,
                    cantidad_egresos: 0,
                    cantidad_neutros: 0,
                    cantidad_pendientes: 0,

                    total_ingresos: 0,
                    total_egresos: 0,
                    neto: 0,
                });
            }

            const forma = formasPago.get(formaPagoId)!;

            forma.cantidad_movimientos++;

            if (clasificacion.efecto === 'INGRESO') {
                forma.cantidad_ingresos++;
                forma.total_ingresos += monto;
                forma.neto += monto;
            }

            if (clasificacion.efecto === 'EGRESO') {
                forma.cantidad_egresos++;
                forma.total_egresos += monto;
                forma.neto -= monto;
            }

            if (clasificacion.efecto === 'NEUTRO') {
                forma.cantidad_neutros++;
            }

            if (clasificacion.efecto === 'PENDIENTE') {
                forma.cantidad_pendientes++;
            }

            // ====================================
            // REFERENCIAS DE DOCUMENTOS
            // ====================================

            const documento = {
                recibo: movimiento.recibo_id
                    ? {
                        id: movimiento.recibo_id,
                        codigo: movimiento.recibo_codigo,
                        referencia: movimiento.recibo_referencia,
                    }
                    : null,

                factura: movimiento.factura_id
                    ? {
                        id: movimiento.factura_id,
                        contador: movimiento.factura_contador,
                        archivo: movimiento.factura_file,
                    }
                    : null,
            };

            return {
                id: movimiento.id,
                fecha: this.fechaTexto(movimiento.fecha),
                created_at: movimiento.created_at,
                updated_at: movimiento.updated_at,
                referencia: movimiento.referencia,
                historial: movimiento.historial,
                tipo_documento: tipoDocumento,
                tipo,
                clasificacion: clasificacion.codigo,
                descripcion_tipo: clasificacion.nombre,
                efecto: clasificacion.efecto,
                total: this.dinero(monto),
                impacto_saldo: this.dinero(impactoSaldo),

                forma_pago: {
                    id: formaPagoId,
                    nombre: movimiento.forma_pago_nombre ?? 'Sin identificar',
                    is_tarjeta: Number(movimiento.forma_pago_is_tarjeta ?? 0) === 1,
                    cuenta_banco_id: movimiento.forma_pago_cuenta_banco_id,
                },

                documento,
                url_egreso: null,
            };
        });

        // ========================================
        // 6. PREPARAR RESUMEN FORMAS DE PAGO
        // ========================================

        const resumenFormasPago = Array.from(formasPago.values()).map((forma) => ({
            ...forma,
            total_ingresos: this.dinero(forma.total_ingresos),
            total_egresos: this.dinero(forma.total_egresos),
            neto: this.dinero(forma.neto),
        }));

        // ========================================
        // 7. SALDOS ACTUALES DE CAJA
        // ========================================

        // Estos valores corresponden al estado actual
        // de la caja, independientemente de la fecha
        // seleccionada para consultar el historial.

        const saldoActual = this.numero(caja.total);
        const saldoAcumulado = this.numero(caja.saldo_acumulado);

        // ========================================
        // 8. PREPARAR RESPUESTA
        // ========================================

        const resultado = {
            caja: {
                slug: caja.slug,
                codigo: caja.codigo,
                num_caja: caja.num_caja,

                sucursal: {
                    nombre: caja.sucursal_nombre,
                    codigo: caja.sucursal_codigo,
                    abreviatura: caja.sucursal_abreviatura,
                },

                estado: caja.estado,
                activa: caja.activa,
                estado_cierre: caja.estado_cierre,
                is_conta: caja.is_conta,
                hora_inicio: caja.hora_inicio,
                hora_cierre: caja.hora_cierre,
                registro: caja.registro,
            },

            consulta,

            saldos: {
                saldo_actual: this.dinero(saldoActual),
                saldo_acumulado: this.dinero(saldoAcumulado),
                total_inicio: caja.total_inicio,
            },

            resumen: {
                total_ingresos: this.dinero(totalIngresos),
                total_egresos: this.dinero(totalEgresos),
                neto_movimientos_clasificados: this.dinero(totalIngresos - totalEgresos),
                cantidad_movimientos: historial.length,
                cantidad_ingresos: cantidadIngresos,
                cantidad_egresos: cantidadEgresos,
                cantidad_neutros: cantidadNeutros,
                cantidad_pendientes: cantidadPendientes,
            },

            formas_pago: resumenFormasPago,
            historial,
        };

        // ========================================
        // 9. REGISTRAR RESULTADO DE LA CONSULTA
        // ========================================

        this.logger.log(
            `${prefijo} CONSULTA COMPLETADA: ` +
            JSON.stringify({
                fecha_consultada: consulta.fecha,
                saldo_actual: saldoActual,
                movimientos: historial.length,
                formas_pago: resumenFormasPago.length,
                ingresos: this.dinero(totalIngresos),
                egresos: this.dinero(totalEgresos),
                duracion_ms: Date.now() - inicio,
            }),
        );

        return resultado;
    }
}
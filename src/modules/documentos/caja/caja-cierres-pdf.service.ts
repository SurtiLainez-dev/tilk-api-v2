import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import puppeteer from 'puppeteer';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

interface DatosCierrePdf {
    caja_codigo: string;
    num_caja: string;
    sucursal: string;
    usuario: string;
    fecha: string;
    total: string | number;
    ingreso: string | number;
    egreso: string | number;
    efectivo: string | number;
    efectivo_declarado: string | number;
    descuadre: string | number;
    observacion: string | null;
    created_at: Date | string;
}

interface MovimientoCierrePdf {
    referencia: string | null;
    tipo_documento: number;
    tipo: number;
    forma_pago_id: string | number;
    forma_pago: string | null;
    total: string | number;
    created_at: Date | string;
}

@Injectable()
export class CajaCierresPdfService {
    private readonly logger = new Logger(CajaCierresPdfService.name);

    constructor(private readonly dataSource: DataSource) {}

    // ==========================================
    // FORMATOS Y UTILIDADES
    // ==========================================

    private escaparHtml(valor: unknown): string {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private formatoMonto(valor: unknown): string {
        return Number(valor ?? 0).toLocaleString('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    private moneda(valor: unknown): string {
        return `L ${this.formatoMonto(valor)}`;
    }

    private formatoFecha(fecha: string): string {
        const [anio, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${anio}`;
    }

    private formatoHora(valor: Date | string): string {
        const fecha = new Date(valor);

        if (Number.isNaN(fecha.getTime())) return '—';

        return new Intl.DateTimeFormat('es-HN', {
            timeZone: 'America/Tegucigalpa',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(fecha);
    }

    private fechaHoraGeneracion(): string {
        const { fecha, hora } = fechaHonduras();
        return `${this.formatoFecha(fecha)} ${hora}`;
    }

    private sumarMovimientos(movimientos: MovimientoCierrePdf[]): number {
        return movimientos.reduce((total, movimiento) => total + Math.round(Number(movimiento.total) * 100), 0) / 100;
    }

    // ==========================================
    // VALIDAR FECHA
    // ==========================================

    private validarFecha(fecha: string): string {
        const valor = String(fecha ?? '').trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD.');
        }

        const fechaValidada = new Date(`${valor}T00:00:00.000Z`);

        if (Number.isNaN(fechaValidada.getTime()) || fechaValidada.toISOString().slice(0, 10) !== valor) {
            throw new BadRequestException('La fecha del cierre no es válida.');
        }

        if (valor > fechaHonduras().fecha) {
            throw new BadRequestException('No se puede consultar un cierre de una fecha futura.');
        }

        return valor;
    }

    // ==========================================
    // DESCRIPCIÓN DEL MOVIMIENTO
    // ==========================================

    private descripcionMovimiento(movimiento: MovimientoCierrePdf): string {
        switch (Number(movimiento.tipo_documento)) {
            case 1:
                return 'Factura de venta de contado';

            case 2:
                return 'Recibo de abono a cuenta';

            case 4:
                return 'Egreso de caja';

            case 5:
                return 'Anticipo de cliente';

            case 6:
                return Number(movimiento.tipo) === 0
                    ? 'Reintegro de caja chica'
                    : 'Movimiento de caja chica';

            case 7:
                return 'Cierre de caja';

            default:
                return 'Movimiento de caja';
        }
    }

    // ==========================================
    // OBTENER ID INTERNO MEDIANTE SLUG
    // ==========================================

    async obtenerCajaIdPorSlug(slug: string): Promise<string> {
        const slugLimpio = String(slug ?? '').trim();

        if (!slugLimpio) {
            throw new BadRequestException('Debes proporcionar el slug de la caja.');
        }

        const cajas = await this.dataSource.query(`
            SELECT id
            FROM cajas
            WHERE slug = ?
                LIMIT 1
        `, [slugLimpio]);

        if (!cajas.length) {
            throw new NotFoundException('No se encontró la caja solicitada.');
        }

        return String(cajas[0].id);
    }

    // ==========================================
    // GENERAR PDF MEDIANTE SLUG
    // ==========================================

    async generarPorSlug(slug: string, fecha: string): Promise<Buffer> {
        const cajaId = await this.obtenerCajaIdPorSlug(slug);

        return this.generar(cajaId, fecha);
    }

    // ==========================================
    // CONSULTAR DATOS DEL CIERRE
    // ==========================================

    private async consultarDatos(cajaId: string, fecha: string) {
        return this.dataSource.transaction('REPEATABLE READ', async manager => {

            const cierres: DatosCierrePdf[] = await manager.query(`
                SELECT
                    c.codigo AS caja_codigo,
                    c.num_caja,
                    s.nombre AS sucursal,
                    u.usuario AS usuario,
                    DATE_FORMAT(cc.fecha, '%Y-%m-%d') AS fecha,
                    cc.total,
                    cc.ingreso,
                    cc.egreso,
                    cc.efectivo,
                    cc.efectivo_declarado,
                    cc.descuadre,
                    cc.observacion,
                    cc.created_at
                FROM cierre_cajas cc
                         INNER JOIN cajas c ON c.id = cc.cajas_id
                         LEFT JOIN sucursals s ON s.id = c.sucursal_id
                         LEFT JOIN users u ON u.id = cc.user_id
                WHERE cc.cajas_id = ?
                  AND cc.fecha = ?
                    LIMIT 2
            `, [cajaId, fecha]);

            if (!cierres.length) {
                throw new NotFoundException('No existe un cierre registrado para esta caja y fecha.');
            }

            if (cierres.length > 1) {
                throw new ConflictException('Existe más de un cierre registrado para esta caja y fecha.');
            }

            const cierre = cierres[0];

            const movimientos: MovimientoCierrePdf[] = await manager.query(`
                SELECT
                    h.referencia,
                    h.tipo_documento,
                    h.tipo,
                    h.forma_pago_id,
                    fp.nombre AS forma_pago,
                    h.total,
                    h.created_at
                FROM historial_cajas h
                         LEFT JOIN forma_pagos fp ON fp.id = h.forma_pago_id
                WHERE h.cajas_id = ?
                  AND h.fecha = ?
                  AND h.tipo_documento <> 7
                ORDER BY h.created_at ASC, h.id ASC
            `, [cajaId, fecha]);

            return { cierre, movimientos };
        });
    }

    // ==========================================
    // CLASIFICAR MOVIMIENTOS DE EFECTIVO
    // ==========================================

    private clasificarMovimientos(movimientos: MovimientoCierrePdf[]) {
        const ingresos = movimientos.filter(movimiento =>
            Number(movimiento.tipo) === 0 &&
            (
                Number(movimiento.forma_pago_id) === 3 ||
                Number(movimiento.tipo_documento) === 6
            )
        );

        const egresos = movimientos.filter(movimiento =>
            Number(movimiento.tipo) === 1 &&
            Number(movimiento.tipo_documento) !== 7
        );

        return { ingresos, egresos };
    }

    // ==========================================
    // CLASIFICAR MOVIMIENTOS GENERALES
    // ==========================================

    private clasificarMovimientosGenerales(movimientos: MovimientoCierrePdf[]) {
        const generales = movimientos.filter(movimiento => Number(movimiento.tipo_documento) !== 7);

        const debe = generales.filter(movimiento => Number(movimiento.tipo) === 0);
        const haber = generales.filter(movimiento => Number(movimiento.tipo) === 1);
        const sinClasificar = generales.filter(movimiento => ![0, 1].includes(Number(movimiento.tipo)));

        const totalDebe = this.sumarMovimientos(debe);
        const totalHaber = this.sumarMovimientos(haber);
        const saldoGeneral = (Math.round(totalDebe * 100) - Math.round(totalHaber * 100)) / 100;

        return {
            movimientos: generales,
            debe,
            haber,
            sinClasificar,
            totalDebe,
            totalHaber,
            saldoGeneral,
        };
    }

    // ==========================================
    // GENERAR FILAS DE EFECTIVO
    // ==========================================

    private generarFilas(movimientos: MovimientoCierrePdf[]): string {
        if (!movimientos.length) {
            return `
                <tr>
                    <td colspan="4" class="sin-movimientos">
                        Sin movimientos registrados
                    </td>
                </tr>
            `;
        }

        return movimientos.map(movimiento => `
            <tr>
                <td>${this.escaparHtml(this.formatoHora(movimiento.created_at))}</td>
                <td>${this.escaparHtml(movimiento.referencia || '—')}</td>
                <td>${this.escaparHtml(this.descripcionMovimiento(movimiento))}</td>
                <td class="monto">${this.moneda(movimiento.total)}</td>
            </tr>
        `).join('');
    }

    // ==========================================
    // GENERAR FILAS DE LA TABLA GENERAL
    // ==========================================

    private generarFilasGenerales(movimientos: MovimientoCierrePdf[]): string {
        if (!movimientos.length) {
            return `
                <tr>
                    <td colspan="6" class="sin-movimientos">
                        Sin movimientos registrados
                    </td>
                </tr>
            `;
        }

        return movimientos.map(movimiento => {
            const tipo = Number(movimiento.tipo);
            const esIngreso = tipo === 0;
            const esEgreso = tipo === 1;

            const debe = esIngreso ? this.moneda(movimiento.total) : '—';
            const haber = esEgreso ? this.moneda(movimiento.total) : '—';

            const concepto = this.descripcionMovimiento(movimiento);
            const formaPago = movimiento.forma_pago || 'No especificada';

            const conceptoHtml = !esIngreso && !esEgreso
                ? `${this.escaparHtml(concepto)}<br><span class="movimiento-pendiente">Sin clasificar: ${this.moneda(movimiento.total)}</span>`
                : this.escaparHtml(concepto);

            return `
                <tr>
                    <td>${this.escaparHtml(this.formatoHora(movimiento.created_at))}</td>
                    <td>${this.escaparHtml(movimiento.referencia || '—')}</td>
                    <td>${conceptoHtml}</td>
                    <td>${this.escaparHtml(formaPago)}</td>
                    <td class="monto ${esIngreso ? 'debe' : 'monto-vacio'}">${debe}</td>
                    <td class="monto ${esEgreso ? 'haber' : 'monto-vacio'}">${haber}</td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================
    // GENERAR DOCUMENTO PDF
    // ==========================================

    async generar(cajaId: string, fechaSolicitada: string): Promise<Buffer> {
        const inicio = Date.now();
        const fecha = this.validarFecha(fechaSolicitada);

        if (!/^[1-9]\d*$/.test(String(cajaId))) {
            throw new BadRequestException('Identificador de caja inválido.');
        }

        const prefijo = `[PDF CIERRE:${cajaId}:${fecha}]`;

        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

        try {
            this.logger.log(`${prefijo} INICIO`);

            // ======================================
            // 1. CONSULTAR CIERRE Y MOVIMIENTOS
            // ======================================

            const { cierre, movimientos } = await this.consultarDatos(cajaId, fecha);

            const { ingresos, egresos } = this.clasificarMovimientos(movimientos);
            const generales = this.clasificarMovimientosGenerales(movimientos);

            const totalIngresosDetalle = this.sumarMovimientos(ingresos);
            const totalEgresosDetalle = this.sumarMovimientos(egresos);

            const descuadre = Number(cierre.descuadre);

            const tieneDiferencia =
                Math.round(totalIngresosDetalle * 100) !== Math.round(Number(cierre.ingreso) * 100) ||
                Math.round(totalEgresosDetalle * 100) !== Math.round(Number(cierre.egreso) * 100) ||
                Math.round(generales.totalDebe * 100) !== Math.round(Number(cierre.total) * 100);

            const estadoArqueo = descuadre === 0
                ? 'EFECTIVO CUADRADO'
                : descuadre > 0
                    ? 'SOBRANTE DE EFECTIVO'
                    : 'FALTANTE DE EFECTIVO';

            const claseArqueo = descuadre === 0
                ? 'cuadrado'
                : descuadre > 0
                    ? 'sobrante'
                    : 'faltante';

            this.logger.log(`${prefijo} Cierre consultado. Ingresos=${ingresos.length}, Egresos=${egresos.length}, Generales=${generales.movimientos.length}, Debe=${generales.totalDebe}, Haber=${generales.totalHaber}`);

            // ======================================
            // 2. LEER PLANTILLA HTML
            // ======================================

            const rutaPlantilla = join(
                process.cwd(),
                'dist',
                'modules',
                'documentos',
                'caja',
                'templates',
                'cierre-caja.html',
            );

            let html = await readFile(rutaPlantilla, 'utf8');

            // ======================================
            // 3. PREPARAR VARIABLES
            // ======================================

            const avisos: string[] = [];

            if (tieneDiferencia) {
                avisos.push('Los movimientos consultados actualmente no coinciden con los totales registrados en el cierre. Se conservan los importes originales de la declaración para revisión.');
            }

            if (generales.sinClasificar.length) {
                avisos.push(`Existen ${generales.sinClasificar.length} movimientos sin clasificación de ingreso o egreso. Se muestran en el detalle general, pero no se incluyen en los totales del Debe y Haber.`);
            }

            const reemplazos: Record<string, string> = {
                EMPRESA: 'SURTIDORA LAINEZ',
                SUCURSAL: this.escaparHtml(cierre.sucursal || 'Sin sucursal'),
                CAJA: this.escaparHtml(cierre.caja_codigo),
                NUM_CAJA: this.escaparHtml(cierre.num_caja),
                USUARIO: this.escaparHtml(cierre.usuario || 'No disponible'),
                FECHA_CIERRE: this.formatoFecha(fecha),
                HORA_REGISTRO: this.escaparHtml(this.formatoHora(cierre.created_at)),
                FECHA_GENERACION: this.escaparHtml(this.fechaHoraGeneracion()),

                TOTAL: this.moneda(cierre.total),
                INGRESO: this.moneda(cierre.ingreso),
                EGRESO: this.moneda(cierre.egreso),
                EFECTIVO: this.moneda(cierre.efectivo),
                EFECTIVO_DECLARADO: this.moneda(cierre.efectivo_declarado),
                DESCUADRE: this.moneda(descuadre),

                ESTADO_ARQUEO: estadoArqueo,
                CLASE_ARQUEO: claseArqueo,

                CANTIDAD_INGRESOS: String(ingresos.length),
                CANTIDAD_EGRESOS: String(egresos.length),
                CANTIDAD_GENERALES: String(generales.movimientos.length),

                MOVIMIENTOS_INGRESOS: this.generarFilas(ingresos),
                MOVIMIENTOS_EGRESOS: this.generarFilas(egresos),
                MOVIMIENTOS_GENERALES: this.generarFilasGenerales(generales.movimientos),

                TOTAL_INGRESOS_DETALLE: this.moneda(totalIngresosDetalle),
                TOTAL_EGRESOS_DETALLE: this.moneda(totalEgresosDetalle),

                TOTAL_DEBE: this.moneda(generales.totalDebe),
                TOTAL_HABER: this.moneda(generales.totalHaber),
                SALDO_GENERAL: this.moneda(generales.saldoGeneral),

                OBSERVACION: this.escaparHtml(cierre.observacion || 'Sin observaciones.'),

                AVISO_DIFERENCIA: avisos.length
                    ? `<div class="aviso">${avisos.map(aviso => this.escaparHtml(aviso)).join('<br>')}</div>`
                    : '',
            };

            // ======================================
            // 4. REEMPLAZAR VARIABLES
            // ======================================

            html = html.replace(/\{\{([A-Z_]+)\}\}/g, (variable, clave: string) => {
                if (!Object.prototype.hasOwnProperty.call(reemplazos, clave)) {
                    throw new Error(`Variable HTML sin reemplazar: ${clave}`);
                }

                return reemplazos[clave];
            });

            // ======================================
            // 5. INICIAR CHROMIUM
            // ======================================

            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: 'load' });
            await page.emulateMediaType('print');

            await page.evaluate(async () => {
                await document.fonts.ready;
            });

            // ======================================
            // 6. GENERAR PDF TAMAÑO CARTA
            // ======================================

            const pdf = await page.pdf({
                format: 'Letter',
                printBackground: true,
                preferCSSPageSize: true,
                displayHeaderFooter: true,
                headerTemplate: '<div></div>',
                footerTemplate: `
                    <div style="width:100%;padding:0 10mm;font-size:7px;color:#64748b;display:flex;justify-content:space-between;">
                        <span>Tilk Cloud · Arqueo de caja</span>
                        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
                    </div>
                `,
                margin: {
                    top: '8mm',
                    right: '10mm',
                    bottom: '12mm',
                    left: '10mm',
                },
            });

            const resultado = Buffer.from(pdf);

            if (resultado.subarray(0, 5).toString('ascii') !== '%PDF-') {
                throw new Error('Chromium no generó un PDF válido.');
            }

            this.logger.log(`${prefijo} PDF generado. Bytes=${resultado.length}, Duración=${Date.now() - inicio}ms`);

            return resultado;

        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));

            this.logger.error(`${prefijo} ${err.message}`, err.stack);

            throw error;

        } finally {
            if (browser) {
                await browser.close().catch((error: unknown) => {
                    this.logger.error(`${prefijo} Error cerrando Chromium`, String(error));
                });
            }
        }
    }
}
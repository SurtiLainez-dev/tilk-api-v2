import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

export interface ArticuloFacturaPdf {
    nombre_articulo: string;
    modelo: string | null;
    serie: string | null;
    serie_sistema?: string | null;
    cantidad: number;
    precio: number;
    total: number;
    impuesto?: number;
    descuento?: number;
    es_exonerado?: boolean;
    es_regalia?: boolean;
}

export interface DatosFacturaPdf {
    codigo: string;

    // INFORMACIÓN DE LA EMPRESA
    empresa: string;
    empresa_direccion: string;
    empresa_propietario: string;
    empresa_email: string;
    empresa_rtn: string;

    // INFORMACIÓN DE LA SUCURSAL
    sucursal: string;
    sucursal_codigo: string;
    sucursal_direccion: string;
    sucursal_telefono: string;
    sucursal_email: string;

    // INFORMACIÓN DE LA FACTURA
    tipo_compra: string;
    fecha: string;
    hora: string;
    caja: string;
    usuario: string;
    codigo_venta: string;
    vendedor: string;

    // INFORMACIÓN DEL CLIENTE
    cliente: string;
    cliente_rtn: string | null;

    // DETALLE DE ARTÍCULOS
    articulos: ArticuloFacturaPdf[];

    // INFORMACIÓN DEL PAGO
    sub_total: number;
    impuesto: number;
    descuento: number;
    total: number;
    efectivo: number;
    cambio: number;
    monto_letras: string;
    forma_pago?: string | null;

    // INFORMACIÓN FISCAL
    cai: string;
    rango_inicial: string;
    rango_final: string;
    fecha_limite_emision: string;

    // INFORMACIÓN ADICIONAL
    sac_telefono?: string;
    sac_email?: string;
    observacion?: string | null;
}

export interface DesgloseImpuestosFacturaPdf {
    importe_exonerado: number;
    importe_exento: number;
    importe_gravado_15: number;
    importe_gravado_18: number;
    descuentos: number;
    isv_15: number;
    isv_18: number;
    total: number;
}

@Injectable()
export class FacturaPdfService {
    private readonly logger = new Logger(FacturaPdfService.name);

    // ==========================================
    // ESCAPAR CONTENIDO HTML
    // ==========================================

    private escaparHtml(valor: unknown): string {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ==========================================
    // FORMATO MONETARIO
    // ==========================================

    private formatoMonto(valor: number): string {
        return Number(valor ?? 0).toLocaleString('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    private centavos(valor: unknown): number {
        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero < 0) {
            throw new Error(`Importe monetario inválido: ${valor}`);
        }

        const resultado = Math.round((numero + Number.EPSILON) * 100);

        if (!Number.isSafeInteger(resultado)) {
            throw new Error('El importe monetario excede el límite permitido.');
        }

        return resultado;
    }

    private redondear(valor: number): number {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    // ==========================================
    // FECHA DE GENERACIÓN
    // ==========================================

    private fechaHoraGeneracion(): string {
        const { fecha, hora } = fechaHonduras();
        const [anio, mes, dia] = fecha.split('-');

        return `${dia}/${mes}/${anio}, ${hora}`;
    }

    // ==========================================
    // VALIDAR PORCENTAJE DE IMPUESTO
    // ==========================================

    private obtenerTasaImpuesto(valor: unknown): number {
        if (valor === null || valor === undefined || valor === '') {
            throw new Error('El artículo no tiene un porcentaje de impuesto definido.');
        }

        const tasa = Number(valor);

        if (![0, 0.15, 0.18].includes(tasa)) {
            throw new Error(`Porcentaje de impuesto no admitido: ${valor}`);
        }

        return tasa;
    }

    // ==========================================
    // CALCULAR DESGLOSE DE IMPUESTOS
    // ==========================================

    calcularImpuestos(articulos: ArticuloFacturaPdf[]): DesgloseImpuestosFacturaPdf {
        let importeExonerado = 0;
        let importeExento = 0;
        let importeGravado15 = 0;
        let importeGravado18 = 0;
        let descuentos = 0;
        let isv15 = 0;
        let isv18 = 0;
        let totalFactura = 0;

        for (const articulo of articulos) {
            const cantidad = Number(articulo.cantidad);

            if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
                throw new Error(`Cantidad inválida para ${articulo.nombre_articulo}.`);
            }

            const totalLinea = this.centavos(articulo.total);
            const descuentoLinea = this.centavos(articulo.descuento ?? 0);
            const tasa = this.obtenerTasaImpuesto(articulo.impuesto);

            if (articulo.es_regalia && totalLinea !== 0) {
                throw new Error(`La regalía ${articulo.nombre_articulo} tiene un importe distinto de cero.`);
            }

            totalFactura += totalLinea;
            descuentos += descuentoLinea;

            // PRODUCTO EXONERADO
            if (articulo.es_exonerado) {
                importeExonerado += totalLinea;
                continue;
            }

            // PRODUCTO EXENTO
            if (tasa === 0) {
                importeExento += totalLinea;
                continue;
            }

            // EL PRECIO FINAL YA INCLUYE EL IMPUESTO
            const baseGravada = Math.round(totalLinea / (1 + tasa));
            const impuestoLinea = totalLinea - baseGravada;

            // PRODUCTO GRAVADO AL 15%
            if (tasa === 0.15) {
                importeGravado15 += baseGravada;
                isv15 += impuestoLinea;
                continue;
            }

            // PRODUCTO GRAVADO AL 18%
            if (tasa === 0.18) {
                importeGravado18 += baseGravada;
                isv18 += impuestoLinea;
            }
        }

        return {
            importe_exonerado: importeExonerado / 100,
            importe_exento: importeExento / 100,
            importe_gravado_15: importeGravado15 / 100,
            importe_gravado_18: importeGravado18 / 100,
            descuentos: descuentos / 100,
            isv_15: isv15 / 100,
            isv_18: isv18 / 100,
            total: totalFactura / 100,
        };
    }

    // ==========================================
    // VALIDAR DATOS DE LA FACTURA
    // ==========================================

    private validarFactura(datos: DatosFacturaPdf): void {
        if (!datos.codigo?.trim()) {
            throw new Error('Código de factura no proporcionado.');
        }

        if (!datos.cliente?.trim()) {
            throw new Error('Nombre del cliente no proporcionado.');
        }

        if (!datos.empresa_rtn?.trim()) {
            throw new Error('RTN de la empresa no proporcionado.');
        }

        if (!datos.cai?.trim()) {
            throw new Error('La factura no tiene un CAI definido.');
        }

        if (!datos.rango_inicial?.trim() || !datos.rango_final?.trim()) {
            throw new Error('La factura no tiene un rango autorizado.');
        }

        if (!datos.fecha_limite_emision?.trim()) {
            throw new Error('Fecha límite de emisión no proporcionada.');
        }

        if (!Array.isArray(datos.articulos) || !datos.articulos.length) {
            throw new Error('La factura no contiene artículos.');
        }

        this.centavos(datos.total);
        this.centavos(datos.efectivo);
        this.centavos(datos.cambio);
    }

    // ==========================================
    // CONSTRUIR DETALLE DE ARTÍCULOS
    // ==========================================

    private construirArticulos(articulos: ArticuloFacturaPdf[]): string {
        return articulos.map((articulo) => {
            const nombre = this.escaparHtml(articulo.nombre_articulo);
            const modelo = this.escaparHtml(articulo.modelo);
            const serie = this.escaparHtml(articulo.serie);
            const cantidad = Number(articulo.cantidad);
            const precioUnitario = articulo.precio;
            const totalLinea = articulo.total;
            const serieSistema = this.escaparHtml(articulo.serie_sistema);
            const serieSistemaHtml = serieSistema ? `<div class="articulo-serie">Serie sistema: ${serieSistema}</div>` : '';

            const modeloHtml = modelo
                ? `<div class="articulo-modelo">Modelo: ${modelo}</div>`
                : '';

            const serieHtml = serie
                ? `<div class="articulo-serie">Serie fabricante: ${serie}</div>`
                : '';

            const regaliaHtml = articulo.es_regalia
                ? `<div class="articulo-regalia">REGALÍA</div>`
                : '';

            const descuentoHtml = Number(articulo.descuento ?? 0) > 0
                ? `<div class="articulo-descuento">Descuento: L ${this.formatoMonto(Number(articulo.descuento))}</div>`
                : '';

            return `
                <tr class="articulo-fila">
                    <td class="col-cantidad">
                        ${cantidad}
                    </td>

                    <td class="col-detalle">
                        <div class="articulo-nombre">
                            ${nombre}
                        </div>

                        ${modeloHtml}
                        ${serieSistemaHtml}
                        ${serieHtml}
                        ${regaliaHtml}
                        ${descuentoHtml}


                    </td>

                    <td class="col-precio">
                        L. ${this.formatoMonto(precioUnitario)}
                    </td>

                    <td class="col-total">
                        L. ${this.formatoMonto(totalLinea)}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==========================================
    // GENERAR FACTURA PDF
    // ==========================================

    async generar(datos: DatosFacturaPdf): Promise<Buffer> {
        const inicio = Date.now();
        const prefijo = `[FACTURA-PDF:${datos.codigo}]`;

        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

        try {
            this.logger.log(`${prefijo} INICIO`);

            // ======================================
            // 1. VALIDAR FACTURA
            // ======================================

            this.validarFactura(datos);

            this.logger.log(`${prefijo} PASO 1 OK: Factura validada`);

            // ======================================
            // 2. CALCULAR IMPUESTOS
            // ======================================

            this.centavos(datos.sub_total);
            this.centavos(datos.impuesto);
            this.centavos(datos.descuento);

            // ======================================
            // 3. LEER PLANTILLA HTML
            // ======================================

            const rutaPlantilla = join(
                process.cwd(),
                'dist',
                'modules',
                'documentos',
                'caja',
                'templates',
                'factura.html',
            );

            let html = await readFile(rutaPlantilla, 'utf8');

            this.logger.log(`${prefijo} PASO 3 OK: ${rutaPlantilla}`);

            // ======================================
            // 4. CONSTRUIR DETALLE
            // ======================================

            const articulosHtml = this.construirArticulos(datos.articulos);

            const cantidadArticulos = datos.articulos.reduce(
                (total, articulo) => total + Number(articulo.cantidad),
                0,
            );

            const observacionHtml = datos.observacion?.trim()
                ? `
                    <div class="observacion">
                        <strong>OBSERVACIÓN:</strong>
                        ${this.escaparHtml(datos.observacion)}
                    </div>
                `
                : '';

            const formaPagoHtml = datos.forma_pago?.trim()
                ? `
                    <div class="dato">
                        <span class="etiqueta">FORMA DE PAGO:</span>
                        ${this.escaparHtml(datos.forma_pago)}
                    </div>
                `
                : '';

            const clienteRtnHtml = datos.cliente_rtn?.trim()
                ? `
                    <div class="dato">
                        <span class="etiqueta">RTN:</span>
                        ${this.escaparHtml(datos.cliente_rtn)}
                    </div>
                `
                : '';

            // ======================================
            // 5. REEMPLAZAR VARIABLES
            // ======================================

            const reemplazos: Record<string, string> = {

                // EMPRESA

                EMPRESA: this.escaparHtml(datos.empresa),
                EMPRESA_DIRECCION: this.escaparHtml(datos.empresa_direccion),
                EMPRESA_PROPIETARIO: this.escaparHtml(datos.empresa_propietario),
                EMPRESA_EMAIL: this.escaparHtml(datos.empresa_email),
                EMPRESA_RTN: this.escaparHtml(datos.empresa_rtn),

                // SUCURSAL

                SUCURSAL: this.escaparHtml(datos.sucursal),
                SUCURSAL_CODIGO: this.escaparHtml(datos.sucursal_codigo),
                SUCURSAL_DIRECCION: this.escaparHtml(datos.sucursal_direccion),
                SUCURSAL_TELEFONO: this.escaparHtml(datos.sucursal_telefono),
                SUCURSAL_EMAIL: this.escaparHtml(datos.sucursal_email),

                // FACTURA

                CODIGO: this.escaparHtml(datos.codigo),
                TIPO_COMPRA: this.escaparHtml(datos.tipo_compra),
                FECHA: this.escaparHtml(datos.fecha),
                HORA: this.escaparHtml(datos.hora),
                CAJA: this.escaparHtml(datos.caja),
                USUARIO: this.escaparHtml(datos.usuario),
                CODIGO_VENTA: this.escaparHtml(datos.codigo_venta),
                VENDEDOR: this.escaparHtml(datos.vendedor),

                // CLIENTE

                CLIENTE: this.escaparHtml(datos.cliente),
                CLIENTE_RTN_HTML: clienteRtnHtml,

                // DETALLE

                ARTICULOS: articulosHtml,
                CANTIDAD_ARTICULOS: String(cantidadArticulos),

                // IMPUESTOS

                SUB_TOTAL: this.formatoMonto(datos.sub_total),
                IMPUESTO: this.formatoMonto(datos.impuesto),
                DESCUENTOS: this.formatoMonto(datos.descuento),
                IMPORTE_EXONERADO: 'N/D',
                IMPORTE_EXENTO: 'N/D',
                IMPORTE_GRAVADO_15: 'N/D',
                IMPORTE_GRAVADO_18: 'N/D',
                ISV_15: 'N/D',
                ISV_18: 'N/D',

                // PAGO

                TOTAL: this.formatoMonto(datos.total),
                EFECTIVO: this.formatoMonto(datos.efectivo),
                CAMBIO: this.formatoMonto(datos.cambio),
                FORMA_PAGO_HTML: formaPagoHtml,
                MONTO_LETRAS: this.escaparHtml(datos.monto_letras),

                // INFORMACIÓN FISCAL

                CAI: this.escaparHtml(datos.cai),
                RANGO_INICIAL: this.escaparHtml(datos.rango_inicial),
                RANGO_FINAL: this.escaparHtml(datos.rango_final),
                FECHA_LIMITE_EMISION: this.escaparHtml(datos.fecha_limite_emision),

                // INFORMACIÓN ADICIONAL

                OBSERVACION_HTML: observacionHtml,
                SAC_TELEFONO: this.escaparHtml(datos.sac_telefono || '96252525'),
                SAC_EMAIL: this.escaparHtml(datos.sac_email || 'sac@grupolainez.com'),
                FECHA_GENERACION: this.escaparHtml(this.fechaHoraGeneracion()),
            };

            html = html.replace(
                /\{\{([A-Z0-9_]+)\}\}/g,
                (variable, clave: string) => {
                    if (!Object.prototype.hasOwnProperty.call(reemplazos, clave)) {
                        throw new Error(`Variable HTML sin reemplazar: ${variable}`);
                    }

                    return reemplazos[clave];
                },
            );

            this.logger.log(`${prefijo} PASO 4 OK: ${cantidadArticulos} artículos`);

            // ======================================
            // 6. INICIAR CHROMIUM
            // ======================================

            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ],
            });

            const page = await browser.newPage();

            await page.setViewport({
                width: Math.ceil((80 * 96) / 25.4),
                height: 100,
                deviceScaleFactor: 1,
            });

            await page.setContent(html, {
                waitUntil: 'load',
            });

            await page.emulateMediaType('print');

            await page.evaluate(async () => {
                await document.fonts.ready;
            });

            this.logger.log(`${prefijo} PASO 5 OK: Chromium iniciado`);

            // ======================================
            // 7. VALIDAR CONTENIDO
            // ======================================

            const diagnostico = await page.evaluate(() => ({
                texto: document.body.innerText.length,
                altura: document.body.scrollHeight,
            }));

            if (diagnostico.texto === 0) {
                throw new Error('La plantilla de factura no contiene texto visible.');
            }

            // ======================================
            // 8. CALCULAR ALTURA DINÁMICA
            // ======================================

            const alturaPx = await page.evaluate(() => {
                const body = document.body;

                return Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    body.getBoundingClientRect().height,
                );
            });

            const alturaMm = Math.max(
                30,
                Math.ceil((alturaPx * 25.4) / 96) + 2,
            );

            this.logger.log(`${prefijo} PASO 6 OK: Altura=${alturaMm}mm`);

            // ======================================
            // 9. GENERAR PDF TÉRMICO
            // ======================================

            const pdf = await page.pdf({
                width: '80mm',
                height: `${alturaMm}mm`,
                printBackground: true,
                margin: {
                    top: '0mm',
                    right: '0mm',
                    bottom: '0mm',
                    left: '0mm',
                },
                preferCSSPageSize: false,
            });

            const resultado = Buffer.from(pdf);

            if (resultado.subarray(0, 5).toString('ascii') !== '%PDF-') {
                throw new Error('Chromium no generó un PDF válido.');
            }

            this.logger.log(
                `${prefijo} PDF generado correctamente. ` +
                `Bytes=${resultado.length}, ` +
                `Duración=${Date.now() - inicio}ms`,
            );

            return resultado;

        } catch (error: unknown) {
            const err = error instanceof Error
                ? error
                : new Error(String(error));

            this.logger.error(
                `${prefijo} Error generando factura: ${err.message}`,
                err.stack,
            );

            throw error;

        } finally {
            if (browser) {
                await browser.close().catch((error: unknown) => {
                    this.logger.error(
                        `${prefijo} Error cerrando Chromium`,
                        error instanceof Error
                            ? error.stack
                            : String(error),
                    );
                });
            }
        }
    }
}

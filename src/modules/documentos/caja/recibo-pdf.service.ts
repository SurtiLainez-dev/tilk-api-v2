import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

export interface DatosReciboPdf {
    qr_token: string;
    codigo: string;
    empresa: string;
    sucursal: string;
    sucursal_codigo: string;
    sucursal_direccion: string;
    sucursal_telefono: string;
    sucursal_email: string;
    fecha: string;
    hora: string;
    caja: string;
    usuario: string;
    cuenta: string;
    cliente: string;
    comentario: string | null;
    referencia: string | null;
    pago: string | null;

    movimientos: Array<{
        concepto: string;
        monto: number;
    }>;

    total: number;
    total_capital: number;
    total_interes: number;
    total_mora: number;
    saldo_anterior: number;
    saldo_nuevo: number;
    monto_letras: string;
}

@Injectable()
export class ReciboPdfService {
    private readonly logger = new Logger(ReciboPdfService.name);

    private escaparHtml(valor: unknown): string {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private formatoMonto(valor: number): string {
        return Number(valor ?? 0).toLocaleString('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    private fechaHoraGeneracion(): string {
        const { fecha, hora } = fechaHonduras();
        const [anio, mes, dia] = fecha.split('-');

        return `${dia}/${mes}/${anio}, ${hora}`;
    }

    async generar(datos: DatosReciboPdf): Promise<Buffer> {
        const inicio = Date.now();
        const prefijo = `[PDF:${datos.codigo}]`;

        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

        try {
            this.logger.log(`${prefijo} INICIO`);

            if (!datos.codigo?.trim()) {
                throw new Error('Código del recibo no proporcionado.');
            }

            if (!datos.qr_token?.trim()) {
                throw new Error('Token QR no proporcionado.');
            }

            // ======================================
            // 1. GENERAR QR
            // ======================================

            this.logger.log(`${prefijo} PASO 1: Generando QR`);

            const urlVerificacion =
                'https://surtilainez.com/surti/qr/' +
                encodeURIComponent(datos.qr_token);

            const qrImagen = await QRCode.toDataURL(urlVerificacion, {
                width: 300,
                margin: 1,
                errorCorrectionLevel: 'M',
            });

            this.logger.log(`${prefijo} PASO 1 OK`);

            // ======================================
            // 2. LEER PLANTILLA
            // ======================================

            this.logger.log(`${prefijo} PASO 2: Leyendo plantilla`);

            const rutaPlantilla = join(
                process.cwd(),
                'dist',
                'modules',
                'documentos',
                'caja',
                'templates',
                'recibo.html',
            );

            let html = await readFile(rutaPlantilla, 'utf8');

            this.logger.log(`${prefijo} PASO 2 OK: ${rutaPlantilla}`);

            // ======================================
            // 3. PREPARAR MOVIMIENTOS
            // ======================================

            this.logger.log(`${prefijo} PASO 3: Preparando movimientos`);

            const movimientosHtml = datos.movimientos
                .map((movimiento) => {
                    const concepto = this.escaparHtml(movimiento.concepto);
                    const monto = this.formatoMonto(movimiento.monto);

                    return `
                        <div class="fila movimiento">
                            <span>${concepto}</span>
                            <span>L ${monto}</span>
                        </div>
                    `;
                })
                .join('');

            const fechaHoraGeneracion = this.fechaHoraGeneracion();

            // ======================================
            // 4. VARIABLES HTML
            // ======================================

            const reemplazos: Record<string, string> = {
                EMPRESA: this.escaparHtml(datos.empresa),

                SUCURSAL: this.escaparHtml(datos.sucursal),

                SUCURSAL_CODIGO: this.escaparHtml(datos.sucursal_codigo),

                SUCURSAL_DIRECCION: this.escaparHtml(datos.sucursal_direccion),

                SUCURSAL_TELEFONO: this.escaparHtml(datos.sucursal_telefono),

                SUCURSAL_EMAIL: this.escaparHtml(datos.sucursal_email),

                CODIGO: this.escaparHtml(datos.codigo),

                REFERENCIA: this.escaparHtml(datos.referencia),

                FECHA: this.escaparHtml(datos.fecha),

                HORA: this.escaparHtml(datos.hora),

                CAJA: this.escaparHtml(datos.caja),

                USUARIO: this.escaparHtml(datos.usuario),

                CUENTA: this.escaparHtml(datos.cuenta),

                CLIENTE: this.escaparHtml(datos.cliente),

                COMENTARIO: this.escaparHtml(datos.comentario),

                PAGO: this.escaparHtml(datos.pago),

                MOVIMIENTOS: movimientosHtml,

                TOTAL: this.formatoMonto(datos.total),

                TOTAL_CAPITAL: this.formatoMonto(datos.total_capital),

                TOTAL_MORA: this.formatoMonto(datos.total_mora),

                SALDO_ANTERIOR: this.formatoMonto(datos.saldo_anterior),

                SALDO_NUEVO: this.formatoMonto(datos.saldo_nuevo),

                MONTO_LETRAS: this.escaparHtml(datos.monto_letras),

                QR_IMAGEN: qrImagen,

                QR_TOKEN: this.escaparHtml(datos.qr_token),

                FECHA_GENERACION: this.escaparHtml(fechaHoraGeneracion),
            };

            for (const [clave, valor] of Object.entries(reemplazos)) {
                html = html.replaceAll(`{{${clave}}}`, valor);
            }

            // ======================================
            // 5. VALIDAR VARIABLES
            // ======================================

            const pendientes = [
                ...html.matchAll(/\{\{([A-Z_]+)\}\}/g),
            ].map((m) => m[1]);

            if (pendientes.length > 0) {
                throw new Error(
                    'Variables HTML sin reemplazar: ' +
                    [...new Set(pendientes)].join(', '),
                );
            }

            this.logger.log(
                `${prefijo} PASO 3 OK: ` +
                `${datos.movimientos.length} movimientos`,
            );

            // ======================================
            // 6. INICIAR CHROMIUM
            // ======================================

            this.logger.log(`${prefijo} PASO 4: Iniciando Chromium`);

            browser = await puppeteer.launch({
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ],
            });

            const page = await browser.newPage();

            await page.setContent(html, {
                waitUntil: 'load',
            });

            await page.emulateMediaType('print');

            // ======================================
            // 7. ESPERAR FUENTES E IMÁGENES
            // ======================================

            await page.evaluate(async () => {
                await document.fonts.ready;

                await Promise.all(
                    Array.from(document.images).map(async (img) => {
                        if (!img.complete) {
                            await new Promise<void>((resolve) => {
                                img.addEventListener(
                                    'load',
                                    () => resolve(),
                                    { once: true },
                                );

                                img.addEventListener(
                                    'error',
                                    () => resolve(),
                                    { once: true },
                                );
                            });
                        }
                    }),
                );
            });

            const diagnostico = await page.evaluate(() => ({
                texto: document.body.innerText.length,
                imagenes: document.images.length,
                imagenesCargadas: Array.from(document.images).filter(
                    (img) => img.complete && img.naturalWidth > 0,
                ).length,
                altura: document.body.scrollHeight,
            }));

            this.logger.log(
                `${prefijo} PASO 4 OK: ` +
                JSON.stringify(diagnostico),
            );

            if (diagnostico.texto === 0) {
                throw new Error('La plantilla no contiene texto visible.');
            }

            if (diagnostico.imagenesCargadas < diagnostico.imagenes) {
                throw new Error('Una o más imágenes del recibo no cargaron.');
            }

            // ======================================
            // 8. CALCULAR ALTURA DINÁMICA
            // ======================================

            this.logger.log(`${prefijo} PASO 5: Calculando altura`);

            const alturaPx = await page.evaluate(() => {
                const body = document.body;
                const html = document.documentElement;

                return Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.scrollHeight,
                    html.offsetHeight,
                );
            });

            const alturaMm = Math.max(
                30,
                Math.ceil((alturaPx * 25.4) / 96) + 2,
            );

            this.logger.log(
                `${prefijo} PASO 5 OK: ` +
                JSON.stringify({
                    altura_px: alturaPx,
                    altura_mm: alturaMm,
                }),
            );

            // ======================================
            // 9. GENERAR PDF DE 80 MM
            // ======================================

            this.logger.log(`${prefijo} PASO 6: Generando PDF`);

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
                `${prefijo} Error generando PDF: ${err.message}`,
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
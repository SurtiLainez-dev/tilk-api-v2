import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

interface AnticipoRow {
    codigo: string;
    fecha: string;
    hora: string;
    total: string | number;
    pago: string | null;
    observacion: string | null;
    caja_id: string;
    user_id: string;

    cliente_nombres: string;
    cliente_apellidos: string;
    cliente_identidad: string;

    nota_codigo: string;
    nota_monto: string | number;
    uso: 'GENERAL' | 'PAGO_DXC';
    fecha_vencimiento: string | null;

    sucursal_nombre: string;
    sucursal_abreviatura: string;
    sucursal_cod: string;
    sucursal_direccion: string;
    sucursal_telefono: string;
    sucursal_email: string;

    forma_pago: string;
}

@Injectable()
export class CajaAnticiposPdfService {
    private readonly logger = new Logger(CajaAnticiposPdfService.name);

    constructor(private readonly dataSource: DataSource) {}

    private escaparHtml(valor: unknown): string {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private moneda(valor: number | string): string {
        return Number(valor).toLocaleString('es-HN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    private fechaHoraGeneracion(): string {
        const { fecha, hora } = fechaHonduras();
        const [anio, mes, dia] = fecha.split('-');

        return `${dia}/${mes}/${anio}, ${hora}`;
    }

    private valorDe(fila: Record<string, unknown> | undefined, campos: string[]): string {
        if (!fila) return '';

        for (const campo of campos) {
            const valor = String(fila[campo] ?? '').trim();

            if (valor) return valor;
        }

        return '';
    }

    private async consultarRegistro(tabla: 'users' | 'cajas', id: string) {
        const filas = await this.dataSource.query(
            `SELECT * FROM ${tabla}
             WHERE id = ?
                 LIMIT 1`,
            [id],
        );

        return filas[0] as Record<string, unknown> | undefined;
    }

    private async buscarQr(codigo: string): Promise<string | null> {
        const filas = await this.dataSource.query(
            `
                SELECT token
                FROM verificacion_documentos
                WHERE referencia = ?
                ORDER BY id DESC
                    LIMIT 1
            `,
            [codigo],
        );

        const token = String(filas[0]?.token ?? '').trim();

        return token || null;
    }

    private obtenerPoliticaUso(uso: AnticipoRow['uso']): string {
        if (uso === 'PAGO_DXC') {
            return (
                'Este anticipo está destinado al pago de ' +
                'documentos por cobrar, incluyendo trámites ' +
                'de traspasos, placas, fletes y cualquier ' +
                'otro documento por cobrar registrado ' +
                'a nombre del cliente.'
            );
        }

        return (
            'Este anticipo podrá utilizarse para realizar ' +
            'abonos a cuentas existentes o compras al contado ' +
            'en Surtidora Laínez, hasta agotar el saldo disponible.'
        );
    }

    async generar(codigo: string): Promise<Buffer> {
        const inicio = Date.now();
        const codigoLimpio = codigo?.trim();
        const prefijo = `[PDF_ANTICIPO:${codigoLimpio}]`;

        let paso = 'INICIO';

        let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;

        try {
            if (!codigoLimpio) {
                throw new BadRequestException('Código de recibo no proporcionado.');
            }

            // ======================================
            // 1. CONSULTAR ANTICIPO
            // ======================================

            paso = 'CONSULTAR_ANTICIPO';

            this.logger.log(`${prefijo} Consultando recibo de anticipo`);

            const filas = await this.dataSource.query(
                `
                    SELECT
                        r.codigo,
                        DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
                        r.hora,
                        r.total,
                        r.pago,
                        r.observacion,
                        r.caja_id,
                        r.user_id,

                        c.nombres AS cliente_nombres,
                        c.apellidos AS cliente_apellidos,
                        c.identidad AS cliente_identidad,

                        nc.codigo AS nota_codigo,
                        nc.monto AS nota_monto,
                        nc.uso,
                        DATE_FORMAT(
                                nc.fecha_vencimiento,
                                '%Y-%m-%d'
                            ) AS fecha_vencimiento,

                        s.nombre AS sucursal_nombre,
                        s.abreviatura AS sucursal_abreviatura,
                        s.cod AS sucursal_cod,
                        s.direccion_completa AS sucursal_direccion,
                        s.telefono AS sucursal_telefono,
                        s.email AS sucursal_email,

                        fp.nombre AS forma_pago

                    FROM recibos r

                             INNER JOIN historial_cajas hc
                                        ON hc.recibo_id = r.id
                                            AND hc.tipo_documento = 5
                                            AND hc.tipo = 0
                                            AND hc.cajas_id = r.caja_id

                             INNER JOIN nota_credito_clientes nc
                                        ON nc.recibo_id = r.id
                                            AND nc.origen = 'CAJA'

                             INNER JOIN anticipo_clientes ac
                                        ON ac.id = nc.anticipo_cliente_id
                                            AND ac.recibo_id = r.id

                             INNER JOIN clientes c
                                        ON c.id = nc.cliente_id

                             INNER JOIN sucursals s
                                        ON s.id = r.sucursal_id

                             INNER JOIN forma_pagos fp
                                        ON fp.id = hc.forma_pago_id

                    WHERE r.codigo = ?

                        LIMIT 2
                `,
                [codigoLimpio],
            ) as AnticipoRow[];

            if (!filas.length) {
                throw new NotFoundException(`No se encontró el anticipo ${codigoLimpio}.`);
            }

            if (filas.length !== 1) {
                throw new ConflictException('El anticipo contiene registros duplicados.');
            }

            const anticipo = filas[0];
            const total = Number(anticipo.total);

            if (!Number.isFinite(total) || total <= 0) {
                throw new ConflictException('El total del anticipo no es válido.');
            }

            if (Math.round(total * 100) !== Math.round(Number(anticipo.nota_monto) * 100)) {
                throw new ConflictException('El importe no coincide con la nota de crédito.');
            }

            if (anticipo.uso !== 'GENERAL' && anticipo.uso !== 'PAGO_DXC') {
                throw new ConflictException('El propósito del anticipo no es válido.');
            }

            this.logger.log(
                `${prefijo} Anticipo encontrado: ` +
                JSON.stringify({
                    codigo: anticipo.codigo,
                    nota: anticipo.nota_codigo,
                    uso: anticipo.uso,
                    total,
                    forma_pago: anticipo.forma_pago,
                }),
            );

            // ======================================
            // 2. CAJA Y USUARIO
            // ======================================

            paso = 'CONSULTAR_CAJA_USUARIO';

            const [caja, usuario] = await Promise.all([
                this.consultarRegistro('cajas', anticipo.caja_id),
                this.consultarRegistro('users', anticipo.user_id),
            ]);

            const cajaCodigo = this.valorDe(caja, ['codigo', 'cod', 'abreviatura']);

            const usuarioNombre = this.valorDe(usuario, ['usuario', 'username', 'name', 'nombre']);

            // ======================================
            // 3. TOKEN Y QR OPCIONAL
            // ======================================

            paso = 'BUSCAR_QR';

            const qrToken = await this.buscarQr(anticipo.codigo);

            let qrImagen = '';

            if (qrToken) {
                paso = 'GENERAR_QR';

                const urlVerificacion =
                    'https://surtilainez.com/surti/qr/' +
                    encodeURIComponent(qrToken);

                qrImagen = await QRCode.toDataURL(urlVerificacion, {
                    width: 300,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                });

                this.logger.log(`${prefijo} QR generado correctamente`);
            } else {
                this.logger.log(`${prefijo} No tiene QR registrado. Se generará el PDF sin QR.`);
            }

            // ======================================
            // 4. LEER TEMPLATE
            // ======================================

            paso = 'LEER_TEMPLATE';

            const rutaPlantilla = join(
                process.cwd(),
                'dist',
                'modules',
                'documentos',
                'caja',
                'templates',
                'recibo-anticipo.html',
            );

            let plantilla = await readFile(rutaPlantilla, 'utf8');

            // Eliminar completamente la sección QR
            // cuando el recibo no tenga token registrado.

            if (!qrToken) {
                plantilla = plantilla.replace(
                    /<!--\s*QR_INICIO\s*-->[\s\S]*?<!--\s*QR_FIN\s*-->/g,
                    '',
                );
            }

            // ======================================
            // 5. PREPARAR VARIABLES
            // ======================================

            paso = 'PREPARAR_VARIABLES';

            const cliente = [
                anticipo.cliente_nombres,
                anticipo.cliente_apellidos,
            ].filter(Boolean).join(' ').trim();

            const proposito = anticipo.uso === 'PAGO_DXC'
                ? 'PAGO DE DOCUMENTOS POR COBRAR'
                : 'USO GENERAL';

            const reemplazos: Record<string, string> = {
                EMPRESA: 'SURTIDORA LAÍNEZ',

                SUCURSAL: anticipo.sucursal_nombre,

                SUCURSAL_CODIGO:
                    anticipo.sucursal_abreviatura ||
                    String(anticipo.sucursal_cod ?? ''),

                SUCURSAL_DIRECCION: anticipo.sucursal_direccion,

                SUCURSAL_TELEFONO: anticipo.sucursal_telefono,

                SUCURSAL_EMAIL: anticipo.sucursal_email,

                CODIGO: anticipo.codigo,

                FECHA: anticipo.fecha,

                HORA: anticipo.hora,

                CAJA: cajaCodigo || 'NO DISPONIBLE',

                USUARIO: usuarioNombre || 'NO DISPONIBLE',

                CLIENTE: cliente,

                IDENTIDAD: anticipo.cliente_identidad,

                COMENTARIO: anticipo.observacion || 'Anticipo de cliente',

                NOTA_CREDITO: anticipo.nota_codigo,

                FORMA_PAGO: anticipo.forma_pago,

                PROPOSITO: proposito,

                TOTAL: this.moneda(total),

                MONTO_LETRAS: anticipo.pago || '',

                FECHA_VENCIMIENTO: anticipo.fecha_vencimiento || 'NO REGISTRADA',

                POLITICA_USO: this.obtenerPoliticaUso(anticipo.uso),

                QR_IMAGEN: qrImagen,

                QR_TOKEN: qrToken || '',

                FECHA_GENERACION: this.fechaHoraGeneracion(),
            };

            const html = plantilla.replace(
                /\{\{([A-Z_]+)\}\}/g,
                (_variable, clave: string) => {
                    if (!Object.prototype.hasOwnProperty.call(reemplazos, clave)) {
                        throw new Error(`Variable HTML desconocida: ${clave}`);
                    }

                    return this.escaparHtml(reemplazos[clave]);
                },
            );

            // ======================================
            // 6. INICIAR CHROMIUM
            // ======================================

            paso = 'INICIAR_CHROMIUM';

            browser = await puppeteer.launch({
                headless: true,

                executablePath:
                    process.env.PUPPETEER_EXECUTABLE_PATH ||
                    undefined,

                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ],
            });

            const page = await browser.newPage();

            await page.setViewport({
                width: 303,
                height: 800,
                deviceScaleFactor: 1,
            });

            await page.setContent(html, {
                waitUntil: 'load',
            });

            await page.emulateMediaType('print');

            // ======================================
            // 7. VERIFICAR IMÁGENES Y FUENTES
            // ======================================

            paso = 'VALIDAR_CONTENIDO';

            await page.evaluate(async () => {
                await document.fonts.ready;

                await Promise.all(
                    Array.from(document.images).map(
                        (img) => img.decode(),
                    ),
                );
            });

            const diagnostico = await page.evaluate(() => ({
                texto: document.body.innerText.length,

                imagenes: document.images.length,

                imagenesCargadas:
                Array.from(document.images).filter(
                    (img) => img.complete && img.naturalWidth > 0,
                ).length,

                qrPresente:
                    Array.from(document.images).some(
                        (img) => img.getAttribute('data-documento-qr') === 'true',
                    ),

                altura: Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                ),
            }));

            if (
                !diagnostico.texto ||
                (qrToken && !diagnostico.qrPresente) ||
                diagnostico.imagenes !== diagnostico.imagenesCargadas
            ) {
                throw new Error('El contenido del recibo no cargó correctamente.');
            }

            // ======================================
            // 8. ALTURA DINÁMICA
            // ======================================

            paso = 'CALCULAR_ALTURA';

            const alturaMm = Math.max(
                30,
                Math.ceil(diagnostico.altura * 25.4 / 96) + 2,
            );

            this.logger.log(`${prefijo} Altura PDF=${alturaMm}mm`);

            // ======================================
            // 9. GENERAR PDF
            // ======================================

            paso = 'GENERAR_PDF';

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
                throw new InternalServerErrorException('No se generó un PDF válido.');
            }

            this.logger.log(
                `${prefijo} PDF GENERADO ` +
                `bytes=${resultado.length}, ` +
                `duracion=${Date.now() - inicio}ms`,
            );

            return resultado;

        } catch (error: unknown) {
            const err = error instanceof Error
                ? error
                : new Error(String(error));

            this.logger.error(
                `${prefijo} ERROR EN ${paso}: ${err.message}`,
                err.stack,
            );

            throw error;

        } finally {
            if (browser) {
                await browser.close().catch(
                    (error: unknown) => {
                        this.logger.error(
                            `${prefijo} Error cerrando Chromium`,
                            String(error),
                        );
                    },
                );
            }
        }
    }
}
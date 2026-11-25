import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';

interface MovimientoArqueo {
    fecha: string;
    created_at: Date;
    referencia: string | null;
    tipo_documento: number;
    tipo: number;
    total: string | number;
    forma_pago: string;
    recibo: string | null;
    factura: string | null;
}

@Injectable()
export class CajaCierresPdfService {

    private readonly azul = '#183451';
    private readonly gris = '#64748B';
    private readonly borde = '#CBD5E1';
    private readonly fondo = '#F1F5F9';

    constructor(private readonly dataSource: DataSource) {}

    private dinero(valor: unknown): string {
        return Number(valor ?? 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    private fechaLocal(fecha: string): string {
        return fecha.split('-').reverse().join('/');
    }

    private horaLocal(fecha: Date): string {
        return new Intl.DateTimeFormat('es-HN', {
            timeZone: 'America/Tegucigalpa',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(fecha));
    }

    private validarFecha(fecha: string): void {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new BadRequestException('La fecha del arqueo no es válida.');
        }

        const date = new Date(`${fecha}T00:00:00Z`);

        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fecha) {
            throw new BadRequestException('La fecha del arqueo no existe.');
        }
    }

    private descripcion(tipo: number): string {
        const documentos: Record<number, string> = {
            1: 'Venta de contado',
            2: 'Abono a cuenta',
            4: 'Egreso de caja',
            5: 'Anticipo de cliente',
            6: 'Cierre de caja chica',
            7: 'Cierre de caja',
        };

        return documentos[tipo] ?? 'Otro movimiento';
    }

    private async obtenerDatos(cajaId: string, fecha: string) {

        const registros = await this.dataSource.query(`
            SELECT
                cc.*,
                c.codigo AS caja_codigo,
                s.nombre AS sucursal,
                u.name AS usuario
            FROM cierre_cajas cc
            INNER JOIN cajas c ON c.id = cc.cajas_id
            LEFT JOIN sucursals s ON s.id = c.sucursal_id
            LEFT JOIN users u ON u.id = cc.user_id
            WHERE cc.cajas_id = ?
              AND cc.fecha = ?
            LIMIT 1
        `, [cajaId, fecha]);

        const cierre = registros[0];

        if (!cierre) {
            throw new NotFoundException('Primero debes registrar el cierre de caja.');
        }

        const movimientos = await this.dataSource.query(`
            SELECT
                hc.fecha,
                hc.created_at,
                hc.referencia,
                hc.tipo_documento,
                hc.tipo,
                hc.total,
                fp.nombre AS forma_pago,
                r.codigo AS recibo,
                fv.contador AS factura
            FROM historial_cajas hc
            INNER JOIN forma_pagos fp ON fp.id = hc.forma_pago_id
            LEFT JOIN recibos r ON r.id = hc.recibo_id
            LEFT JOIN factura_ventas fv ON fv.id = hc.factura_id
            WHERE hc.cajas_id = ?
              AND hc.fecha = ?
              AND hc.tipo_documento <> 7
              AND COALESCE(fp.is_tarjeta, 0) = 0
              AND (
                  (hc.tipo = 0 AND hc.forma_pago_id = 3)
                  OR (hc.tipo = 0 AND hc.tipo_documento = 6)
                  OR (hc.tipo = 1 AND hc.tipo_documento = 4)
              )
              AND hc.total > 0
              AND hc.created_at <= ?
            ORDER BY hc.created_at ASC, hc.id ASC
        `, [cajaId, fecha, cierre.created_at]) as MovimientoArqueo[];

        return { cierre, movimientos };
    }

    private agrupar(movimientos: MovimientoArqueo[]) {
        const grupos = new Map<string, number>();

        for (const movimiento of movimientos) {
            const nombre = this.descripcion(Number(movimiento.tipo_documento));
            const monto = Math.round(Number(movimiento.total) * 100);

            grupos.set(nombre, (grupos.get(nombre) ?? 0) + monto);
        }

        return Array.from(grupos.entries()).map(([nombre, monto]) => ({
            nombre,
            monto: monto / 100,
        }));
    }

    async generar(cajaId: string, fecha: string): Promise<Buffer> {

        this.validarFecha(fecha);

        const { cierre, movimientos } = await this.obtenerDatos(cajaId, fecha);

        const ingresos = movimientos.filter(m => Number(m.tipo) === 0);
        const egresos = movimientos.filter(m => Number(m.tipo) === 1);

        const gruposIngresos = this.agrupar(ingresos);
        const gruposEgresos = this.agrupar(egresos);

        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 36,
            bufferPages: true,
            info: {
                Title: `Arqueo de caja ${cierre.caja_codigo} - ${fecha}`,
                Author: 'Surtidora Lainez',
                Subject: 'Control interno de efectivo',
            },
        });

        return new Promise<Buffer>((resolve, reject) => {

            const buffers: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const x = 36;
            const ancho = 540;
            const mitad = ancho / 2;

            const texto = (
                contenido: string,
                px: number,
                py: number,
                width: number,
                size = 9,
                bold = false,
                color = this.azul,
                align: 'left' | 'center' | 'right' = 'left',
            ) => {
                doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
                    .fontSize(size)
                    .fillColor(color)
                    .text(contenido, px, py, { width, align });
            };

            const linea = (px: number, py: number, longitud: number) => {
                doc.strokeColor(this.borde)
                    .lineWidth(0.6)
                    .moveTo(px, py)
                    .lineTo(px + longitud, py)
                    .stroke();
            };

            const rectangulo = (px: number, py: number, width: number, height: number, color: string) => {
                doc.rect(px, py, width, height).fill(color);
            };

            const encabezado = (detalle = false) => {

                rectangulo(36, 36, 6, 52, this.azul);

                texto('SURTIDORA LAINEZ', 52, 38, 300, 19, true);
                texto('Departamento de Contabilidad', 52, 62, 300, 10);
                texto('TILK CLOUD | CONTROL INTERNO', 52, 77, 300, 7, false, this.gris);

                texto(detalle ? 'DETALLE DE ARQUEO' : 'ARQUEO DE CAJA', 350, 39, 226, 15, true, this.azul, 'right');
                texto(String(cierre.caja_codigo), 350, 61, 226, 12, true, this.azul, 'right');
                texto(this.fechaLocal(fecha), 350, 78, 226, 9, false, this.gris, 'right');

                linea(x, 98, ancho);
            };

            encabezado();

            // ==========================================
            // INFORMACIÓN GENERAL
            // ==========================================

            rectangulo(x, 110, ancho, 90, this.fondo);

            const emision = new Intl.DateTimeFormat('es-HN', {
                timeZone: 'America/Tegucigalpa',
                dateStyle: 'short',
                timeStyle: 'short',
            }).format(new Date());

            texto('SUCURSAL', x + 12, 120, 245, 8, true, this.gris);
            texto(String(cierre.sucursal ?? 'No disponible'), x + 12, 133, 245, 11, true);

            texto('CAJERO RESPONSABLE', x + 12, 158, 245, 8, true, this.gris);
            texto(String(cierre.usuario ?? 'No disponible'), x + 12, 171, 245, 10, true);

            texto('FECHA DEL CIERRE', x + mitad + 12, 120, 245, 8, true, this.gris);
            texto(this.fechaLocal(fecha), x + mitad + 12, 133, 245, 11, true);

            texto('FECHA Y HORA DE EMISIÓN', x + mitad + 12, 158, 245, 8, true, this.gris);
            texto(emision, x + mitad + 12, 171, 245, 10);

            // ==========================================
            // PARTIDA T
            // ==========================================

            let y = 216;

            rectangulo(x, y, ancho, 24, this.azul);
            texto('RESUMEN DE MOVIMIENTOS EN EFECTIVO', x, y + 7, ancho, 10, true, '#FFFFFF', 'center');

            y += 24;

            rectangulo(x, y, ancho, 25, this.fondo);

            texto('DEBE / INGRESOS', x + 10, y + 8, mitad - 20, 10, true, this.azul, 'center');
            texto('HABER / EGRESOS', x + mitad + 10, y + 8, mitad - 20, 10, true, this.azul, 'center');

            const inicioT = y;
            y += 25;

            const filas = Math.max(gruposIngresos.length, gruposEgresos.length, 3);

            for (let i = 0; i < filas; i++) {

                const ingreso = gruposIngresos[i];
                const egreso = gruposEgresos[i];

                if (i % 2 === 0) rectangulo(x, y, ancho, 23, '#F8FAFC');

                if (ingreso) {
                    texto(ingreso.nombre, x + 10, y + 7, 170, 9);
                    texto(this.dinero(ingreso.monto), x + 180, y + 7, 80, 9, false, this.azul, 'right');
                }

                if (egreso) {
                    texto(egreso.nombre, x + mitad + 10, y + 7, 170, 9);
                    texto(this.dinero(egreso.monto), x + mitad + 180, y + 7, 80, 9, false, this.azul, 'right');
                }

                if (i === 0 && gruposIngresos.length === 0) {
                    texto('Sin ingresos', x + 10, y + 7, 170, 9, false, this.gris);
                }

                if (i === 0 && gruposEgresos.length === 0) {
                    texto('Sin egresos', x + mitad + 10, y + 7, 170, 9, false, this.gris);
                }

                y += 23;
            }

            linea(x, y, ancho);

            rectangulo(x, y, ancho, 28, this.fondo);

            texto('TOTAL INGRESOS', x + 10, y + 9, 160, 9, true);
            texto(this.dinero(cierre.ingreso), x + 170, y + 9, 90, 10, true, this.azul, 'right');

            texto('TOTAL EGRESOS', x + mitad + 10, y + 9, 160, 9, true);
            texto(this.dinero(cierre.egreso), x + mitad + 170, y + 9, 90, 10, true, this.azul, 'right');

            y += 28;

            doc.strokeColor(this.borde).lineWidth(0.8)
                .rect(x, inicioT, ancho, y - inicioT).stroke();

            doc.moveTo(x + mitad, inicioT)
                .lineTo(x + mitad, y).stroke();

            // ==========================================
            // CONCILIACIÓN
            // ==========================================

            y += 18;

            if (y + 310 > 740) {
                doc.addPage();
                encabezado();
                y = 112;
            }

            texto('CONCILIACIÓN DE EFECTIVO', x, y, ancho, 11, true);
            y += 20;

            const conciliacion = [
                ['Efectivo esperado por el sistema', cierre.efectivo],
                ['Efectivo declarado por el cajero', cierre.efectivo_declarado],
            ];

            for (const [nombre, monto] of conciliacion) {
                texto(String(nombre), x + 12, y + 7, 350, 10);
                texto(`L ${this.dinero(monto)}`, x + 365, y + 7, 163, 11, true, this.azul, 'right');
                linea(x, y + 25, ancho);
                y += 27;
            }

            const diferencia = Number(cierre.descuadre);
            const correcto = diferencia === 0;

            const colorResultado = correcto ? '#166534' : '#B91C1C';
            const fondoResultado = correcto ? '#F0FDF4' : '#FEF2F2';

            rectangulo(x, y, ancho, 42, fondoResultado);

            texto('DIFERENCIA DE ARQUEO', x + 12, y + 7, 350, 10, true, colorResultado);

            texto(
                correcto ? 'EFECTIVO CONCILIADO' : diferencia < 0 ? 'FALTANTE DE EFECTIVO' : 'SOBRANTE DE EFECTIVO',
                x + 12, y + 22, 350, 8, true, colorResultado,
            );

            texto(`L ${this.dinero(diferencia)}`, x + 350, y + 13, 178, 16, true, colorResultado, 'right');

            y += 58;

            // ==========================================
            // OBSERVACIONES
            // ==========================================

            texto('OBSERVACIONES DEL CAJERO', x, y, ancho, 10, true);
            y += 17;

            const observacion = String(cierre.observacion || 'Sin observaciones.');

            doc.font('Helvetica').fontSize(9);

            const altoObservacion = Math.max(
                55,
                doc.heightOfString(observacion, { width: ancho - 24 }) + 24,
            );

            doc.strokeColor(this.borde)
                .rect(x, y, ancho, altoObservacion)
                .stroke();

            texto(observacion, x + 12, y + 12, ancho - 24, 9);

            y += altoObservacion + 45;

            // ==========================================
            // FIRMAS
            // ==========================================

            if (y + 45 > 740) {
                doc.addPage();
                encabezado();
                y = 170;
            }

            linea(x + 15, y, 220);
            linea(x + mitad + 35, y, 220);

            texto('FIRMA DEL CAJERO', x + 15, y + 8, 220, 9, true, this.azul, 'center');
            texto(String(cierre.usuario ?? ''), x + 15, y + 23, 220, 8, false, this.gris, 'center');

            texto('FIRMA DE REVISIÓN', x + mitad + 35, y + 8, 220, 9, true, this.azul, 'center');
            texto('Contabilidad / Supervisor', x + mitad + 35, y + 23, 220, 8, false, this.gris, 'center');

            // ==========================================
            // ANEXO: DETALLE DE TRANSACCIONES
            // ==========================================

            if (movimientos.length > 0) {

                doc.addPage();
                encabezado(true);

                y = 112;

                const encabezadoTabla = () => {

                    rectangulo(x, y, ancho, 24, this.azul);

                    texto('HORA', x + 8, y + 8, 65, 8, true, '#FFFFFF');
                    texto('DOCUMENTO / REFERENCIA', x + 76, y + 8, 160, 8, true, '#FFFFFF');
                    texto('CONCEPTO', x + 240, y + 8, 130, 8, true, '#FFFFFF');
                    texto('INGRESO', x + 375, y + 8, 75, 8, true, '#FFFFFF', 'right');
                    texto('EGRESO', x + 455, y + 8, 75, 8, true, '#FFFFFF', 'right');

                    y += 24;
                };

                encabezadoTabla();

                for (let i = 0; i < movimientos.length; i++) {

                    const movimiento = movimientos[i];

                    const referencia = String(
                        movimiento.recibo ||
                        movimiento.factura ||
                        movimiento.referencia ||
                        'Sin referencia',
                    );

                    const concepto = this.descripcion(Number(movimiento.tipo_documento));

                    doc.font('Helvetica').fontSize(8);

                    const alto = Math.max(
                        28,
                        doc.heightOfString(referencia, { width: 158 }) + 14,
                        doc.heightOfString(concepto, { width: 130 }) + 14,
                    );

                    if (y + alto > 720) {
                        doc.addPage();
                        encabezado(true);
                        y = 112;
                        encabezadoTabla();
                    }

                    if (i % 2 === 0) rectangulo(x, y, ancho, alto, '#F8FAFC');

                    texto(this.horaLocal(movimiento.created_at), x + 8, y + 7, 65, 8);
                    texto(referencia, x + 76, y + 7, 158, 8);
                    texto(concepto, x + 240, y + 7, 130, 8);

                    if (Number(movimiento.tipo) === 0) {
                        texto(this.dinero(movimiento.total), x + 375, y + 7, 75, 8, true, this.azul, 'right');
                    } else {
                        texto(this.dinero(movimiento.total), x + 455, y + 7, 75, 8, true, this.azul, 'right');
                    }

                    y += alto;
                    linea(x, y, ancho);
                }
            }

            // ==========================================
            // PIE DE PÁGINA
            // ==========================================

            const paginas = doc.bufferedPageRange();

            for (let i = 0; i < paginas.count; i++) {

                doc.switchToPage(paginas.start + i);

                linea(x, 744, ancho);

                doc.font('Helvetica')
                    .fontSize(7)
                    .fillColor(this.gris)
                    .text(
                        'Tilk Cloud | Documento de control interno | Importes expresados en lempiras',
                        x, 752,
                        { width: 440, lineBreak: false },
                    );

                doc.text(
                    `${i + 1} / ${paginas.count}`,
                    x + 450, 752,
                    { width: 90, align: 'right', lineBreak: false },
                );
            }

            doc.end();
        });
    }
}
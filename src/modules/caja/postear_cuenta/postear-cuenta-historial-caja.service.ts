import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface RegistrarHistorialCaja {
    caja_id: string;
    forma_pago_id: string;
    recibo_id: string | null;
    factura_id?: string | null;
    referencia?: string | null;
    total: number | string;
    tipo?: number;
    historial?: string | null;
    tipo_documento?: number | null;
}

@Injectable()
export class PostearCuentaHistorialCajaService {
    private readonly logger = new Logger(PostearCuentaHistorialCajaService.name);

    async registrar(manager: EntityManager, datos: RegistrarHistorialCaja) {
        this.logger.log('========== INICIO HISTORIAL CAJA ==========');

        try {
            this.logger.log(`[DATOS_RECIBIDOS] ${JSON.stringify({
                caja_id: datos.caja_id,
                forma_pago_id: datos.forma_pago_id,
                recibo_id: datos.recibo_id,
                factura_id: datos.factura_id,
                referencia: datos.referencia,
                total: datos.total,
                tipo: datos.tipo,
                tipo_documento: datos.tipo_documento,
            })}`);

            this.logger.log(`[TRANSACCION] Activa=${manager.queryRunner?.isTransactionActive ?? false}`);

            const cajaId = String(datos.caja_id);
            const formaPagoId = String(datos.forma_pago_id);
            const reciboId = datos.recibo_id == null ? null : String(datos.recibo_id);
            const facturaId = datos.factura_id == null ? null : String(datos.factura_id);
            const tipo = datos.tipo ?? 0;
            const esFactura = reciboId === null && facturaId !== null;
            const tipoDocumento = datos.tipo_documento ?? (esFactura ? 1 : tipo === 0 ? 2 : 4);
            const total = Number(datos.total);
            const historial = datos.historial?.trim() || null;

            const esPagoNotaCredito = formaPagoId === '12' && tipo === 0 && tipoDocumento === 1 && esFactura;

            this.logger.log(
                `[DATOS_NORMALIZADOS] Caja=${cajaId}, FormaPago=${formaPagoId}, ` +
                `Recibo=${reciboId}, Factura=${facturaId}, Total=${total}, ` +
                `Tipo=${tipo}, TipoDocumento=${tipoDocumento}`,
            );

            // ==========================================
            // VALIDAR IDENTIFICADORES
            // ==========================================

            for (const [campo, valor] of [
                ['caja_id', cajaId],
                ['forma_pago_id', formaPagoId],
            ] as const) {
                if (!/^[1-9]\d*$/.test(valor)) {
                    throw new BadRequestException(`${campo} no es válido.`);
                }
            }

            if (reciboId !== null && !/^[1-9]\d*$/.test(reciboId)) {
                throw new BadRequestException('El recibo no es válido.');
            }

            if (facturaId !== null && !/^[1-9]\d*$/.test(facturaId)) {
                throw new BadRequestException('La factura no es válida.');
            }

            if (reciboId === null && facturaId === null) {
                throw new BadRequestException('Debes proporcionar un recibo o una factura.');
            }

            if (
                !Number.isFinite(total) ||
                total < 0 ||
                (total === 0 && !esPagoNotaCredito) ||
                (formaPagoId === '12' && tipoDocumento === 1 && total !== 0) ||
                Math.abs(total * 100 - Math.round(total * 100)) > 0.000001
            ) {
                throw new BadRequestException('El total no es válido.');
            }

            if (!Number.isInteger(tipo) || tipo < 0 || tipo > 127) {
                throw new BadRequestException('El tipo no es válido.');
            }

            if (!Number.isInteger(tipoDocumento) || tipoDocumento < 0 || tipoDocumento > 127) {
                throw new BadRequestException('El tipo de documento no es válido.');
            }

            if (historial && historial.length > 250) {
                throw new BadRequestException('El historial supera los 250 caracteres.');
            }

            this.logger.log('[VALIDACIONES] Datos validados correctamente.');

            // ==========================================
            // BUSCAR Y BLOQUEAR CAJA
            // ==========================================

            this.logger.log(`[BUSCAR_CAJA] Consultando caja ID=${cajaId}`);

            const cajas = await manager.query(`
                SELECT id, total
                FROM cajas
                WHERE id = ?
                FOR UPDATE
            `, [cajaId]);

            if (!cajas.length) {
                throw new NotFoundException('No se encontró la caja.');
            }

            const saldoAnteriorCaja = cajas[0].total;

            this.logger.log(
                `[CAJA_ENCONTRADA] ID=${cajas[0].id}, SaldoAnterior=${saldoAnteriorCaja}`,
            );

            // ==========================================
            // BUSCAR DOCUMENTO
            // ==========================================

            let referencia = '';

            if (reciboId !== null) {
                this.logger.log(`[BUSCAR_RECIBO] Consultando recibo ID=${reciboId}`);

                const recibos = await manager.query(`
                    SELECT id, codigo, total, caja_id
                    FROM recibos
                    WHERE id = ?
                    LIMIT 1
                `, [reciboId]);

                if (!recibos.length) {
                    throw new NotFoundException('No se encontró el recibo.');
                }

                const recibo = recibos[0];

                this.logger.log(`[RECIBO_ENCONTRADO] ${JSON.stringify(recibo)}`);

                if (String(recibo.caja_id) !== cajaId) {
                    throw new BadRequestException('El recibo no corresponde a la caja.');
                }

                // Validación original de recibos.
                if (Math.round(Number(recibo.total) * 100) !== Math.round(total * 100)) {
                    throw new BadRequestException('El total no coincide con el recibo.');
                }

                referencia = String(recibo.codigo);

            } else {
                this.logger.log(`[BUSCAR_FACTURA] Consultando factura ID=${facturaId}`);

                const facturas = await manager.query(`
                    SELECT
                        fv.id,
                        fv.contador,
                        fv.total,
                        fv.caja_id
                    FROM factura_ventas fv
                    WHERE fv.id = ?
                    LIMIT 1
                `, [facturaId]);

                if (!facturas.length) {
                    throw new NotFoundException('No se encontró la factura.');
                }

                const factura = facturas[0];

                this.logger.log(`[FACTURA_ENCONTRADA] ${JSON.stringify(factura)}`);

                if (String(factura.caja_id) !== cajaId) {
                    throw new BadRequestException('La factura no corresponde a la caja.');
                }

                // ==========================================
                // VALIDAR TOTAL DE LA FACTURA
                // ==========================================

                if (esPagoNotaCredito) {
                    // Las notas de crédito liquidan la factura,
                    // pero no representan un ingreso monetario.

                    if (total !== 0) {
                        throw new BadRequestException('El movimiento de caja por notas de crédito debe ser cero.');
                    }

                    this.logger.log(
                        `[PAGO_NOTAS_CREDITO] Factura=${facturaId}, ` +
                        `TotalFactura=${factura.total}, TotalHistorial=${total.toFixed(2)}`,
                    );

                } else {
                    // Validación original para las demás formas de pago.

                    if (Math.round(Number(factura.total) * 100) !== Math.round(total * 100)) {
                        throw new BadRequestException('El total no coincide con la factura.');
                    }
                }

                referencia = datos.referencia?.trim() || String(factura.contador);

                if (!referencia.trim()) {
                    throw new ConflictException('La factura no tiene referencia.');
                }
            }

            // ==========================================
            // VERIFICAR DUPLICADOS
            // ==========================================

            const existentes = reciboId !== null
                ? await manager.query(`
                    SELECT id
                    FROM historial_cajas
                    WHERE recibo_id = ?
                    LIMIT 1
                `, [reciboId])
                : await manager.query(`
                    SELECT id
                    FROM historial_cajas
                    WHERE factura_id = ?
                    LIMIT 1
                `, [facturaId]);

            this.logger.log(`[DUPLICADOS] Registros encontrados=${existentes.length}`);

            if (existentes.length) {
                throw new ConflictException(
                    reciboId !== null
                        ? 'Este recibo ya tiene un registro en historial de caja.'
                        : 'Esta factura ya tiene un registro en historial de caja.',
                );
            }

            // ==========================================
            // VERIFICAR FORMA DE PAGO
            // ==========================================

            this.logger.log(`[BUSCAR_FORMA_PAGO] ID=${formaPagoId}`);

            const formas = await manager.query(`
                SELECT id, nombre
                FROM forma_pagos
                WHERE id = ?
                LIMIT 1
            `, [formaPagoId]);

            if (!formas.length) {
                throw new NotFoundException('No se encontró la forma de pago.');
            }

            this.logger.log(`[FORMA_PAGO_ENCONTRADA] ${JSON.stringify(formas[0])}`);

            const nombreForma = String(formas[0].nombre ?? '').trim().toUpperCase();
            const esEfectivo = formaPagoId === '3';

            this.logger.log(
                `[VALIDAR_EFECTIVO] ID=${formaPagoId}, ` +
                `Nombre=${JSON.stringify(nombreForma)}, EsEfectivo=${esEfectivo}`,
            );

            // ==========================================
            // FECHA DE HONDURAS
            // ==========================================

            const partes = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Tegucigalpa',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).formatToParts(new Date());

            const valor = (tipoParte: string) =>
                partes.find((p) => p.type === tipoParte)?.value ?? '';

            const fecha = `${valor('year')}-${valor('month')}-${valor('day')}`;

            this.logger.log(`[FECHA] Fecha del movimiento=${fecha}`);

            // ==========================================
            // REGISTRAR HISTORIAL DE CAJA
            // ==========================================

            this.logger.log(`[INSERT_HISTORIAL] ${JSON.stringify({
                cajas_id: cajaId,
                forma_pago_id: formaPagoId,
                referencia,
                tipo_documento: tipoDocumento,
                recibo_id: reciboId,
                factura_id: facturaId,
                total: total.toFixed(2),
                fecha,
                tipo,
            })}`);

            const insertado = await manager.query(`
                INSERT INTO historial_cajas (
                    cajas_id,
                    forma_pago_id,
                    referencia,
                    tipo_documento,
                    recibo_id,
                    factura_id,
                    total,
                    fecha,
                    tipo,
                    historial,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                cajaId,
                formaPagoId,
                referencia,
                tipoDocumento,
                reciboId,
                facturaId,
                total.toFixed(2),
                fecha,
                tipo,
                historial,
            ]);

            this.logger.log(
                `[RESULTADO_INSERT] InsertId=${insertado.insertId}, ` +
                `AffectedRows=${insertado.affectedRows}`,
            );

            if (!insertado.insertId) {
                throw new ConflictException('No se pudo registrar el historial de caja.');
            }

            // ==========================================
            // ACTUALIZAR SALDO DE CAJA
            // ==========================================

            let saldoCaja: string | null = null;

            this.logger.log(
                `[DECISION_ACTUALIZAR_CAJA] EsEfectivo=${esEfectivo}, ` +
                `FormaPago=${nombreForma}, Tipo=${tipo}, TipoDocumento=${tipoDocumento}`,
            );

            // Solamente efectivo incrementa cajas.total.
            // Se suma el importe de la venta, no el dinero
            // entregado antes de devolver el cambio.

            if (esEfectivo) {
                this.logger.log(
                    `[INICIO_UPDATE_CAJA] Caja=${cajaId}, ` +
                    `SaldoAnterior=${saldoAnteriorCaja}, ` +
                    `MontoIncrementar=${total.toFixed(2)}, ` +
                    `SaldoEsperado=${(Number(saldoAnteriorCaja ?? 0) + total).toFixed(2)}`,
                );

                const actualizado = await manager.query(`
                    UPDATE cajas
                    SET
                        total = ROUND(COALESCE(total, 0) + ?, 2),
                        updated_at = NOW()
                    WHERE id = ?
                `, [total.toFixed(2), cajaId]);

                this.logger.log(`[RESULTADO_UPDATE_CAJA] ${JSON.stringify(actualizado)}`);

                if (actualizado.affectedRows !== 1) {
                    throw new ConflictException('No se pudo actualizar el saldo de la caja.');
                }

                const saldo = await manager.query(`
                    SELECT total
                    FROM cajas
                    WHERE id = ?
                `, [cajaId]);

                saldoCaja = Number(saldo[0].total).toFixed(2);

                this.logger.log(
                    `[CAJA_ACTUALIZADA] Caja=${cajaId}, ` +
                    `SaldoAnterior=${saldoAnteriorCaja}, ` +
                    `Incremento=${total.toFixed(2)}, SaldoNuevo=${saldoCaja}`,
                );

            } else {
                this.logger.warn(
                    `[CAJA_NO_ACTUALIZADA] No se ejecutó UPDATE cajas. ` +
                    `FormaPagoID=${formaPagoId}, NombreForma=${JSON.stringify(nombreForma)}, ` +
                    `EsEfectivo=${esEfectivo}`,
                );
            }

            // ==========================================
            // VERIFICAR SALDO FINAL
            // ==========================================

            const verificacionFinal = await manager.query(`
                SELECT id, total
                FROM cajas
                WHERE id = ?
            `, [cajaId]);

            this.logger.log(
                `[VERIFICACION_FINAL_CAJA] ${JSON.stringify(verificacionFinal[0])}`,
            );

            this.logger.log(
                `[HISTORIAL_CAJA] Documento=${referencia}, ` +
                `forma=${nombreForma}, efectivo=${esEfectivo}, total=${total.toFixed(2)}`,
            );

            // ==========================================
            // RESPUESTA
            // ==========================================

            const respuesta = {
                historial_id: String(insertado.insertId),
                recibo_id: reciboId,
                factura_id: facturaId,
                referencia,
                tipo_documento: tipoDocumento,
                forma_pago_id: formaPagoId,
                total: total.toFixed(2),
                fecha,
                tipo,
                historial,
                caja_total_actualizado: esEfectivo,
                caja_total_nuevo: saldoCaja,
            };

            this.logger.log(`[RESPUESTA_HISTORIAL] ${JSON.stringify({
                ...respuesta,
                historial: undefined,
            })}`);

            this.logger.log(
                '[TRANSACCION] Historial procesado. Pendiente de confirmación por la transacción principal.',
            );

            this.logger.log('========== FIN HISTORIAL CAJA ==========');

            return respuesta;

        } catch (error) {
            const detalle = error as {
                message?: string;
                stack?: string;
                code?: string;
                sqlMessage?: string;
            };

            this.logger.error(
                `[ERROR_HISTORIAL_CAJA] Caja=${datos.caja_id}, ` +
                `Recibo=${datos.recibo_id}, Factura=${datos.factura_id}, ` +
                `FormaPago=${datos.forma_pago_id}, ` +
                `Mensaje=${detalle.message ?? 'Error desconocido'}, ` +
                `Codigo=${detalle.code ?? 'N/A'}, ` +
                `SQL=${detalle.sqlMessage ?? 'N/A'}`,
                detalle.stack,
            );

            throw error;
        }
    }
}
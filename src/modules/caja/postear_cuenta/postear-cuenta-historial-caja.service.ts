import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface RegistrarHistorialCaja {
    caja_id: string;
    forma_pago_id: string;
    recibo_id: string;
    factura_id?: string | null;
    total: number | string;
    tipo?: number;
    historial?: string | null;
    tipo_documento?: number | null;
}

@Injectable()
export class PostearCuentaHistorialCajaService {
    private readonly logger = new Logger(
        PostearCuentaHistorialCajaService.name,
    );

    async registrar(
        manager: EntityManager,
        datos: RegistrarHistorialCaja,
    ) {

        this.logger.log(
            '========== INICIO HISTORIAL CAJA ==========',
        );

        try {

            // ==========================================
            // DATOS RECIBIDOS
            // ==========================================

            this.logger.log(
                `[DATOS_RECIBIDOS] ${JSON.stringify({
                    caja_id: datos.caja_id,
                    forma_pago_id: datos.forma_pago_id,
                    recibo_id: datos.recibo_id,
                    factura_id: datos.factura_id,
                    total: datos.total,
                    tipo: datos.tipo,
                    tipo_documento: datos.tipo_documento,
                })}`,
            );

            this.logger.log(
                `[TRANSACCION] Activa=${
                    manager.queryRunner?.isTransactionActive ?? false
                }`,
            );

            const cajaId = String(datos.caja_id);
            const formaPagoId = String(datos.forma_pago_id);
            const reciboId = String(datos.recibo_id);

            const facturaId =
                datos.factura_id == null
                    ? null
                    : String(datos.factura_id);

            const tipo = datos.tipo ?? 0;

            const tipoDocumento =
                datos.tipo_documento ?? (tipo === 0 ? 2 : 4);

            const total = Number(datos.total);

            const historial = datos.historial?.trim() || null;

            this.logger.log(
                `[DATOS_NORMALIZADOS] ` +
                `Caja=${cajaId}, ` +
                `FormaPago=${formaPagoId}, ` +
                `Recibo=${reciboId}, ` +
                `Total=${total}, ` +
                `Tipo=${tipo}, ` +
                `TipoDocumento=${tipoDocumento}`,
            );

            // ==========================================
            // VALIDAR IDENTIFICADORES
            // ==========================================

            for (const [campo, valor] of [
                ['caja_id', cajaId],
                ['forma_pago_id', formaPagoId],
                ['recibo_id', reciboId],
            ] as const) {

                if (!/^[1-9]\d*$/.test(valor)) {
                    throw new BadRequestException(
                        `${campo} no es válido.`,
                    );
                }
            }

            if (
                facturaId !== null &&
                !/^[1-9]\d*$/.test(facturaId)
            ) {
                throw new BadRequestException(
                    'La factura no es válida.',
                );
            }

            if (
                !Number.isFinite(total) ||
                total <= 0 ||
                Math.abs(
                    total * 100 - Math.round(total * 100)
                ) > 0.000001
            ) {
                throw new BadRequestException(
                    'El total no es válido.',
                );
            }

            if (
                !Number.isInteger(tipo) ||
                tipo < 0 ||
                tipo > 127
            ) {
                throw new BadRequestException(
                    'El tipo no es válido.',
                );
            }

            if (historial && historial.length > 250) {
                throw new BadRequestException(
                    'El historial supera los 250 caracteres.',
                );
            }

            this.logger.log(
                '[VALIDACIONES] Datos validados correctamente.',
            );

            // ==========================================
            // BUSCAR Y BLOQUEAR CAJA
            // ==========================================

            this.logger.log(
                `[BUSCAR_CAJA] Consultando caja ID=${cajaId}`,
            );

            const cajas = await manager.query(
                `
                SELECT id, total
                FROM cajas
                WHERE id = ?
                FOR UPDATE
                `,
                [cajaId],
            );

            if (!cajas.length) {
                throw new NotFoundException(
                    'No se encontró la caja.',
                );
            }

            const saldoAnteriorCaja = cajas[0].total;

            this.logger.log(
                `[CAJA_ENCONTRADA] ` +
                `ID=${cajas[0].id}, ` +
                `SaldoAnterior=${saldoAnteriorCaja}`,
            );

            // ==========================================
            // BUSCAR RECIBO
            // ==========================================

            this.logger.log(
                `[BUSCAR_RECIBO] Consultando recibo ID=${reciboId}`,
            );

            const recibos = await manager.query(
                `
                SELECT id, codigo, total, caja_id
                FROM recibos
                WHERE id = ?
                LIMIT 1
                `,
                [reciboId],
            );

            if (!recibos.length) {
                throw new NotFoundException(
                    'No se encontró el recibo.',
                );
            }

            const recibo = recibos[0];

            this.logger.log(
                `[RECIBO_ENCONTRADO] ${JSON.stringify(recibo)}`,
            );

            if (String(recibo.caja_id) !== cajaId) {
                throw new BadRequestException(
                    'El recibo no corresponde a la caja.',
                );
            }

            if (
                Math.round(Number(recibo.total) * 100) !==
                Math.round(total * 100)
            ) {
                throw new BadRequestException(
                    'El total no coincide con el recibo.',
                );
            }

            // ==========================================
            // VERIFICAR DUPLICADOS
            // ==========================================

            const existentes = await manager.query(
                `
                SELECT id
                FROM historial_cajas
                WHERE recibo_id = ?
                LIMIT 1
                `,
                [reciboId],
            );

            this.logger.log(
                `[DUPLICADOS] Registros encontrados=${existentes.length}`,
            );

            if (existentes.length) {
                throw new ConflictException(
                    'Este recibo ya tiene un registro en historial de caja.',
                );
            }

            // ==========================================
            // VERIFICAR FORMA DE PAGO
            // ==========================================

            this.logger.log(
                `[BUSCAR_FORMA_PAGO] ID=${formaPagoId}`,
            );

            const formas = await manager.query(
                `
                SELECT id, nombre
                FROM forma_pagos
                WHERE id = ?
                LIMIT 1
                `,
                [formaPagoId],
            );

            if (!formas.length) {
                throw new NotFoundException(
                    'No se encontró la forma de pago.',
                );
            }

            this.logger.log(
                `[FORMA_PAGO_ENCONTRADA] ${JSON.stringify(formas[0])}`,
            );

            const nombreForma = String(
                formas[0].nombre ?? '',
            )
                .trim()
                .toUpperCase();

            const esEfectivo =
                nombreForma === 'EFECTIVO' ||
                nombreForma === 'CASH';

            this.logger.log(
                `[VALIDAR_EFECTIVO] ` +
                `ID=${formaPagoId}, ` +
                `NombreOriginal=${JSON.stringify(formas[0].nombre)}, ` +
                `NombreNormalizado=${JSON.stringify(nombreForma)}, ` +
                `Longitud=${nombreForma.length}, ` +
                `EsEfectivo=${esEfectivo}`,
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

            const valor = (tipo: string) =>
                partes.find((p) => p.type === tipo)?.value ?? '';

            const fecha =
                `${valor('year')}-${valor('month')}-${valor('day')}`;

            this.logger.log(
                `[FECHA] Fecha del movimiento=${fecha}`,
            );

            // ==========================================
            // REGISTRAR HISTORIAL DE CAJA
            // ==========================================

            this.logger.log(
                `[INSERT_HISTORIAL] ${JSON.stringify({
                    cajas_id: cajaId,
                    forma_pago_id: formaPagoId,
                    referencia: recibo.codigo,
                    tipo_documento: tipoDocumento,
                    recibo_id: reciboId,
                    factura_id: facturaId,
                    total: total.toFixed(2),
                    fecha,
                    tipo,
                })}`,
            );

            const insertado = await manager.query(
                `
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
                `,
                [
                    cajaId,
                    formaPagoId,
                    recibo.codigo,
                    tipoDocumento,
                    reciboId,
                    facturaId,
                    total.toFixed(2),
                    fecha,
                    tipo,
                    historial,
                ],
            );

            this.logger.log(
                `[RESULTADO_INSERT] ` +
                `InsertId=${insertado.insertId}, ` +
                `AffectedRows=${insertado.affectedRows}`,
            );

            if (!insertado.insertId) {
                throw new ConflictException(
                    'No se pudo registrar el historial de caja.',
                );
            }

            // ==========================================
            // ACTUALIZAR SALDO DE CAJA
            // ==========================================

            let saldoCaja: string | null = null;

            this.logger.log(
                `[DECISION_ACTUALIZAR_CAJA] ` +
                `EsEfectivo=${esEfectivo}, ` +
                `FormaPago=${nombreForma}, ` +
                `Tipo=${tipo}, ` +
                `TipoDocumento=${tipoDocumento}`,
            );

            // Solamente efectivo incrementa cajas.total.

            if (esEfectivo) {

                this.logger.log(
                    `[INICIO_UPDATE_CAJA] ` +
                    `Caja=${cajaId}, ` +
                    `SaldoAnterior=${saldoAnteriorCaja}, ` +
                    `MontoIncrementar=${total.toFixed(2)}, ` +
                    `SaldoEsperado=${
                        (Number(saldoAnteriorCaja ?? 0) + total).toFixed(2)
                    }`,
                );

                const actualizado = await manager.query(
                    `
                    UPDATE cajas
                    SET
                        total = ROUND(
                            COALESCE(total, 0) + ?,
                            2
                        ),
                        updated_at = NOW()
                    WHERE id = ?
                    `,
                    [total.toFixed(2), cajaId],
                );

                this.logger.log(
                    `[RESULTADO_UPDATE_CAJA] ${JSON.stringify(actualizado)}`,
                );

                if (actualizado.affectedRows !== 1) {
                    throw new ConflictException(
                        'No se pudo actualizar el saldo de la caja.',
                    );
                }

                // ======================================
                // CONSULTAR NUEVO SALDO
                // ======================================

                const saldo = await manager.query(
                    `
                    SELECT total
                    FROM cajas
                    WHERE id = ?
                    `,
                    [cajaId],
                );

                saldoCaja = Number(saldo[0].total).toFixed(2);

                this.logger.log(
                    `[CAJA_ACTUALIZADA] ` +
                    `Caja=${cajaId}, ` +
                    `SaldoAnterior=${saldoAnteriorCaja}, ` +
                    `Incremento=${total.toFixed(2)}, ` +
                    `SaldoNuevo=${saldoCaja}`,
                );

            } else {

                this.logger.warn(
                    `[CAJA_NO_ACTUALIZADA] ` +
                    `No se ejecutó UPDATE cajas. ` +
                    `FormaPagoID=${formaPagoId}, ` +
                    `NombreForma=${JSON.stringify(nombreForma)}, ` +
                    `EsEfectivo=${esEfectivo}`,
                );

            }

            // ==========================================
            // VERIFICAR SALDO FINAL
            // ==========================================

            const verificacionFinal = await manager.query(
                `
                SELECT id, total
                FROM cajas
                WHERE id = ?
                `,
                [cajaId],
            );

            this.logger.log(
                `[VERIFICACION_FINAL_CAJA] ` +
                `${JSON.stringify(verificacionFinal[0])}`,
            );

            this.logger.log(
                `[HISTORIAL_CAJA] Recibo=${recibo.codigo}, ` +
                `forma=${nombreForma}, ` +
                `efectivo=${esEfectivo}, ` +
                `total=${total.toFixed(2)}`,
            );

            // ==========================================
            // RESPUESTA
            // ==========================================

            const respuesta = {
                historial_id: String(insertado.insertId),
                recibo_id: reciboId,
                referencia: recibo.codigo,
                tipo_documento: tipoDocumento,
                forma_pago_id: formaPagoId,
                total: total.toFixed(2),
                fecha,
                tipo,
                historial,
                caja_total_actualizado: esEfectivo,
                caja_total_nuevo: saldoCaja,
            };

            this.logger.log(
                `[RESPUESTA_HISTORIAL] ${JSON.stringify({
                    ...respuesta,
                    historial: undefined,
                })}`,
            );

            this.logger.log(
                '[TRANSACCION] Historial procesado. Pendiente de confirmación por la transacción principal.',
            );

            this.logger.log(
                '========== FIN HISTORIAL CAJA ==========',
            );

            return respuesta;

        } catch (error) {

            const detalle = error as {
                message?: string;
                stack?: string;
                code?: string;
                sqlMessage?: string;
            };

            this.logger.error(
                `[ERROR_HISTORIAL_CAJA] ` +
                `Caja=${datos.caja_id}, ` +
                `Recibo=${datos.recibo_id}, ` +
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
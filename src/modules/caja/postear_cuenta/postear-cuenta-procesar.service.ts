
import {
    BadRequestException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

import {
    ActualizarPagosContratosService,
    type AbonoContrato,
} from './actualizar-pagos-contratos.service.js';

import {
    PostearCuentaSegmentoService,
} from './postear-cuenta-segmento.service.js';

import {
    PostearCuentaRecibosService,
    type MovimientoCuerpoRecibo,
} from './postear-cuenta-recibos.service.js';

import {
    PostearCuentaEstadoCuentaService,
} from './registrar-estado-cuenta.service.js';

import {
    PostearCuentaHistorialCajaService,
} from './postear-cuenta-historial-caja.service.js';

import {
    PostearCuentaLimiteCreditoService,
} from './postear-cuenta-limite-credito.service.js';

export interface ProcesarPagoCuentaDto {
    operacion_id: string;
    venta_slug: string;
    monto: string | number;
    forma_pago_id: string;
    observacion: string;
    historial: string | null;
    avisar_auditoria: boolean;
    caja_id: string;
    user_id: string;
}

interface OperacionPago {
    id: string;
    operacion_id: string;
    venta_id: string;
    caja_id: string;
    user_id: string;
    monto: string | number;
    estado: string;
    request_hash: string;
    respuesta: string | object | null;
}

interface Cuota {
    id: string;
    estado: number | string;
    is_mora: number | string | null;
    saldo_actual: string | number;
    saldo_cap: string | number;
    mora: string | number;
}

interface CuotaRecalculo {
    id: string;
    estado: number | string;
    pago_inicial: string | number | null;
    saldo_actual: string | number | null;
    saldo_cap: string | number | null;
    mora: string | number | null;
    total_abonado: string | number | null;
    dias_mora: number | string | null;
    fecha_pago: Date | string | null;
}

@Injectable()
export class PostearCuentaProcesarService {
    private readonly logger = new Logger(
        PostearCuentaProcesarService.name,
    );

    constructor(
        private readonly dataSource: DataSource,
        private readonly contratos: ActualizarPagosContratosService,
        private readonly segmentos: PostearCuentaSegmentoService,
        private readonly recibos: PostearCuentaRecibosService,
        private readonly estadosCuenta: PostearCuentaEstadoCuentaService,
        private readonly historialCaja: PostearCuentaHistorialCajaService,
        private readonly limitesCredito: PostearCuentaLimiteCreditoService,
    ) {}

    private centavos(
        valor: unknown,
        campo = 'monto',
    ): number {
        const texto = String(valor ?? '').trim();

        const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(texto);

        if (!match) {
            throw new BadRequestException(
                `${campo} tiene un formato inválido.`,
            );
        }

        const total =
            Number(match[1]) * 100 +
            Number((match[2] ?? '').padEnd(2, '0'));

        if (!Number.isSafeInteger(total)) {
            throw new BadRequestException(
                `${campo} excede el máximo permitido.`,
            );
        }

        return total;
    }

    private dinero(centavos: number): string {
        if (!Number.isSafeInteger(centavos) || centavos < 0) {
            throw new ConflictException(
                'Se detectó un importe monetario inválido.',
            );
        }

        return (
            `${Math.floor(centavos / 100)}.` +
            String(centavos % 100).padStart(2, '0')
        );
    }

    private validarId(
        id: unknown,
        campo: string,
    ): string {
        const texto = String(id ?? '');

        if (!/^[1-9]\d*$/.test(texto)) {
            throw new BadRequestException(
                `${campo} no es válido.`,
            );
        }

        return texto;
    }

    private fechaOrden(
        fecha: Date | string | null,
    ): string {
        if (!fecha) return '';

        if (fecha instanceof Date) {
            return [
                fecha.getFullYear(),
                String(fecha.getMonth() + 1).padStart(2, '0'),
                String(fecha.getDate()).padStart(2, '0'),
            ].join('-');
        }

        return String(fecha).substring(0, 10);
    }

    private calcularDiasMoraVenta(
        pagos: CuotaRecalculo[],
    ): number {
        const vencidos = pagos
            .filter(
                (pago) =>
                    Number(pago.estado) === 2 &&
                    this.centavos(pago.mora, 'mora') > 0,
            )
            .sort((a, b) => {
                const fechaA = this.fechaOrden(a.fecha_pago);
                const fechaB = this.fechaOrden(b.fecha_pago);

                const comparacion = fechaA.localeCompare(fechaB);

                if (comparacion !== 0) {
                    return comparacion;
                }

                const idA = BigInt(a.id);
                const idB = BigInt(b.id);

                return idA < idB ? -1 : idA > idB ? 1 : 0;
            });

        if (!vencidos.length) {
            return 0;
        }

        const dias = Number(vencidos[0].dias_mora ?? 0);

        if (!Number.isSafeInteger(dias) || dias < 0) {
            throw new ConflictException(
                'Los días de mora de la venta son inválidos.',
            );
        }

        return dias;
    }

    /**
     * Recalcula ventas utilizando pagos_contratos.
     *
     * No necesita otro servicio ni otro archivo.
     * Se ejecuta dentro de la transacción principal.
     */
    private async recalcularVenta(
        manager: EntityManager,
        ventaId: string,
    ) {
        const ventas = await manager.query(
            `
        SELECT id
        FROM ventas
        WHERE id = ?
        FOR UPDATE
        `,
            [ventaId],
        );

        if (!ventas.length) {
            throw new NotFoundException(
                'No se encontró la venta para recalcular.',
            );
        }

        const pagos: CuotaRecalculo[] = await manager.query(
            `
        SELECT
            id,
            estado,
            pago_inicial,
            saldo_actual,
            saldo_cap,
            mora,
            total_abonado,
            dias_mora,
            fecha_pago
        FROM pagos_contratos
        WHERE venta_id = ?
        ORDER BY fecha_pago ASC, id ASC
        FOR UPDATE
        `,
            [ventaId],
        );

        if (!pagos.length) {
            throw new ConflictException(
                'La venta no tiene obligaciones para recalcular.',
            );
        }

        let capitalOriginal = 0;
        let saldoActual = 0;
        let saldoActualCapital = 0;
        let totalAbonado = 0;
        let pagando = 0;
        let moraTotal = 0;

        let hayMora = false;
        let hayPendientes = false;

        for (const pago of pagos) {
            const estado = Number(pago.estado);

            if (![1, 2, 3].includes(estado)) {
                throw new ConflictException(
                    'Una obligación tiene un estado inválido.',
                );
            }

            const inicial = this.centavos(
                pago.pago_inicial,
                'pago_inicial',
            );

            const saldo = this.centavos(
                pago.saldo_actual,
                'saldo_actual',
            );

            const capital = this.centavos(
                pago.saldo_cap,
                'saldo_cap',
            );

            const mora = this.centavos(
                pago.mora,
                'mora',
            );

            const abonado = this.centavos(
                pago.total_abonado,
                'total_abonado',
            );

            if (capital + mora !== saldo) {
                throw new ConflictException(
                    'Una obligación tiene saldos inconsistentes.',
                );
            }

            capitalOriginal += inicial;
            totalAbonado += abonado;

            if (estado < 3) {
                saldoActual += saldo;
                saldoActualCapital += capital;

                if (saldo > 0) {
                    hayPendientes = true;
                }
            } else if (saldo !== 0) {
                throw new ConflictException(
                    'Una obligación cancelada conserva saldo.',
                );
            }

            // Acumular las obligaciones en mora.
            if (estado === 2) {
                hayMora = true;
                pagando += capital + mora;
                moraTotal += mora;
            }
        }

        const totalAbonadoCapital =
            capitalOriginal - saldoActualCapital;

        if (
            totalAbonadoCapital < 0 ||
            ![
                capitalOriginal,
                saldoActual,
                saldoActualCapital,
                totalAbonado,
                pagando,
                moraTotal,
                totalAbonadoCapital,
            ].every(Number.isSafeInteger)
        ) {
            throw new ConflictException(
                'Los totales recalculados no son válidos.',
            );
        }

        const estadoVenta = hayMora
            ? 2
            : hayPendientes
                ? 1
                : 3;

        const diasMora = this.calcularDiasMoraVenta(pagos);

        const resultado = await manager.query(
            `
        UPDATE ventas
        SET
            saldo_actual = ?,
            saldo_actual_cap = ?,
            pagando = ?,
            mora = ?,
            total_abonado = ?,
            total_abonado_capital = ?,
            estado = ?,
            dias_mora = ?
        WHERE id = ?
        `,
            [
                this.dinero(saldoActual),
                this.dinero(saldoActualCapital),
                this.dinero(pagando),
                this.dinero(moraTotal),
                this.dinero(totalAbonado),
                this.dinero(totalAbonadoCapital),
                estadoVenta,
                diasMora,
                ventaId,
            ],
        );

        if (resultado.affectedRows !== 1) {
            throw new ConflictException(
                'No se pudo recalcular la venta.',
            );
        }

        this.logger.log(
            `[VENTA] Recalculada. ` +
            `Venta=${ventaId}, ` +
            `saldo=${this.dinero(saldoActual)}, ` +
            `mora=${this.dinero(moraTotal)}, ` +
            `estado=${estadoVenta}, ` +
            `dias_mora=${diasMora}`,
        );

        return {
            saldo_actual: this.dinero(saldoActual),
            saldo_actual_cap: this.dinero(saldoActualCapital),
            pagando: this.dinero(pagando),
            mora: this.dinero(moraTotal),
            total_abonado: this.dinero(totalAbonado),
            total_abonado_capital:
                this.dinero(totalAbonadoCapital),
            estado: estadoVenta,
            dias_mora: diasMora,
        };
    }

    private async bloquearOperacion(
        manager: EntityManager,
        id: string,
    ): Promise<OperacionPago> {
        const registros: OperacionPago[] =
            await manager.query(
                `
                SELECT *
                FROM caja_operaciones_pago
                WHERE operacion_id = ?
                FOR UPDATE
                `,
                [id],
            );

        if (!registros.length) {
            throw new NotFoundException(
                'La operación de pago no existe.',
            );
        }

        return registros[0];
    }

    async procesarPago(
        datos: ProcesarPagoCuentaDto,
    ) {
        const monto = this.centavos(datos.monto);

        if (monto <= 0) {
            throw new BadRequestException(
                'El monto debe ser mayor que cero.',
            );
        }

        const cajaId = this.validarId(
            datos.caja_id,
            'caja_id',
        );

        const userId = this.validarId(
            datos.user_id,
            'user_id',
        );

        const formaPagoId = this.validarId(
            datos.forma_pago_id,
            'forma_pago_id',
        );

        if (
            typeof datos.venta_slug !== 'string' ||
            !datos.venta_slug.trim()
        ) {
            throw new BadRequestException(
                'La venta no es válida.',
            );
        }

        if (
            typeof datos.operacion_id !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                datos.operacion_id,
            )
        ) {
            throw new BadRequestException(
                'El UUID de la operación no es válido.',
            );
        }

        if (
            typeof datos.observacion !== 'string' ||
            datos.observacion.length > 400
        ) {
            throw new BadRequestException(
                'La observación no es válida.',
            );
        }

        if (typeof datos.avisar_auditoria !== 'boolean') {
            throw new BadRequestException(
                'La confirmación de auditoría no es válida.',
            );
        }

        if (
            datos.historial !== null &&
            (
                typeof datos.historial !== 'string' ||
                datos.historial.length > 250
            )
        ) {
            throw new BadRequestException(
                'El historial no es válido.',
            );
        }

        return this.dataSource.transaction(
            'READ COMMITTED',
            async (manager) => {
                // 1. Bloquear operación.

                const operacion =
                    await this.bloquearOperacion(
                        manager,
                        datos.operacion_id.toLowerCase(),
                    );

                if (
                    String(operacion.caja_id) !== cajaId ||
                    String(operacion.user_id) !== userId
                ) {
                    throw new ConflictException(
                        'La operación no pertenece a esta sesión de caja.',
                    );
                }

                if (
                    this.centavos(operacion.monto) !== monto
                ) {
                    throw new ConflictException(
                        'El monto no coincide con la operación original.',
                    );
                }

                // 2. Evitar duplicación.

                if (operacion.estado === 'COMPLETADO') {
                    if (!operacion.respuesta) {
                        throw new ConflictException(
                            'La operación completada no tiene respuesta.',
                        );
                    }

                    return typeof operacion.respuesta === 'string'
                        ? JSON.parse(operacion.respuesta)
                        : operacion.respuesta;
                }

                if (operacion.estado !== 'PENDIENTE') {
                    throw new ConflictException(
                        `La operación está en estado ${operacion.estado}.`,
                    );
                }

                // 3. Verificar integridad original.

                const hash = createHash('sha256')
                    .update(
                        JSON.stringify({
                            venta_id: String(operacion.venta_id),
                            caja_id: cajaId,
                            user_id: userId,
                            monto: this.dinero(monto),
                        }),
                    )
                    .digest('hex');

                if (operacion.request_hash !== hash) {
                    throw new ConflictException(
                        'Los datos no coinciden con la operación original.',
                    );
                }

                // 4. Bloquear venta.

                const ventaRows = await manager.query(
                    `
                    SELECT
                        id,
                        slug,
                        sucursal_id,
                        saldo_actual
                    FROM ventas
                    WHERE id = ?
                    FOR UPDATE
                    `,
                    [operacion.venta_id],
                );

                if (!ventaRows.length) {
                    throw new NotFoundException(
                        'No se encontró la venta.',
                    );
                }

                const venta = ventaRows[0];

                if (
                    String(venta.slug) !==
                    datos.venta_slug.trim()
                ) {
                    throw new ConflictException(
                        'La venta no corresponde a la operación.',
                    );
                }

                const sucursalId = this.validarId(
                    venta.sucursal_id,
                    'sucursal_id',
                );

                const saldoAnterior = this.centavos(
                    venta.saldo_actual,
                    'saldo_actual',
                );

                if (monto > saldoAnterior) {
                    throw new ConflictException(
                        'El pago supera el saldo actual de la venta. Vuelve a distribuir el pago.',
                    );
                }

                // 5. Verificar forma de pago.

                const formas = await manager.query(
                    `
                    SELECT id
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

                // 6. Bloquear obligaciones.

                const cuotas: Cuota[] = await manager.query(
                    `
                    SELECT
                        id,
                        estado,
                        is_mora,
                        saldo_actual,
                        saldo_cap,
                        mora
                    FROM pagos_contratos
                    WHERE venta_id = ?
                      AND estado IN (1, 2)
                    ORDER BY id ASC
                    FOR UPDATE
                    `,
                    [operacion.venta_id],
                );

                if (!cuotas.length) {
                    throw new ConflictException(
                        'La venta no tiene obligaciones pendientes.',
                    );
                }

                // 7. Distribución definitiva.

                let disponible = monto;
                let capitalAbonado = 0;

                const abonos: AbonoContrato[] = [];
                const movimientos: MovimientoCuerpoRecibo[] = [];

                for (const cuota of cuotas) {
                    if (disponible === 0) {
                        break;
                    }

                    const mora = this.centavos(
                        cuota.mora,
                        'mora',
                    );

                    const capital = this.centavos(
                        cuota.saldo_cap,
                        'saldo_cap',
                    );

                    const saldo = this.centavos(
                        cuota.saldo_actual,
                        'saldo_actual',
                    );

                    if (mora + capital !== saldo) {
                        throw new ConflictException(
                            'Una obligación tiene saldos inconsistentes.',
                        );
                    }

                    if (saldo === 0) {
                        continue;
                    }

                    const pagoMora =
                        Number(cuota.is_mora) === 1
                            ? Math.min(disponible, mora)
                            : 0;

                    if (pagoMora > 0) {
                        abonos.push({
                            pago_id: String(cuota.id),
                            tipo: 'MORA',
                            monto: this.dinero(pagoMora),
                        });

                        movimientos.push({
                            pago_id: String(cuota.id),
                            tipo: 2,
                            monto: this.dinero(pagoMora),
                        });

                        disponible -= pagoMora;
                    }

                    const pagoCapital = Math.min(
                        disponible,
                        capital,
                    );

                    if (pagoCapital > 0) {
                        abonos.push({
                            pago_id: String(cuota.id),
                            tipo: 'CAPITAL',
                            monto: this.dinero(pagoCapital),
                        });

                        movimientos.push({
                            pago_id: String(cuota.id),
                            tipo: 1,
                            monto: this.dinero(pagoCapital),
                        });

                        disponible -= pagoCapital;
                        capitalAbonado += pagoCapital;
                    }
                }

                if (
                    disponible !== 0 ||
                    !abonos.length
                ) {
                    throw new ConflictException(
                        'La distribución ya no es válida. Actualiza la cuenta y vuelve a distribuir el pago.',
                    );
                }

                // 8. Actualizar pagos_contratos.

                await this.contratos.aplicarAbonos(
                    manager,
                    String(operacion.venta_id),
                    abonos,
                );

                // 9. Recalcular ventas.
                // Ahora es un método de esta misma clase.

                const ventaActualizada =
                    await this.recalcularVenta(
                        manager,
                        String(operacion.venta_id),
                    );

                // 10. Actualizar segmento.

                await this.segmentos.actualizarSegmentoVenta(
                    manager,
                    String(operacion.venta_id),
                );

                const saldoNuevo = this.centavos(
                    ventaActualizada.saldo_actual,
                    'saldo nuevo',
                );

                if (
                    saldoAnterior - saldoNuevo !== monto
                ) {
                    throw new ConflictException(
                        'El nuevo saldo no coincide con el pago registrado.',
                    );
                }

                // 11. Crear recibo, cuerpo, directriz y QR.

                const recibo = await this.recibos.crearRecibo(
                    manager,
                    {
                        venta_id: String(operacion.venta_id),
                        user_id: userId,
                        sucursal_id: sucursalId,
                        caja_id: cajaId,
                        total: this.dinero(monto),
                        observacion: datos.observacion,
                        saldo_anterior: this.dinero(
                            saldoAnterior,
                        ),
                        saldo_nuevo: this.dinero(
                            saldoNuevo,
                        ),
                        movimientos,
                    },
                );

                // 12. Registrar estado de cuenta.

                await this.estadosCuenta.registrarAbono(
                    manager,
                    {
                        venta_id: String(operacion.venta_id),
                        recibo_codigo: recibo.codigo,
                        monto: this.dinero(monto),
                        saldo_actual: this.dinero(
                            saldoNuevo,
                        ),
                    },
                );

                // 13. Registrar historial de caja.
                // El servicio existente incrementa
                // cajas.total cuando es efectivo.

                const historial =
                    await this.historialCaja.registrar(
                        manager,
                        {
                            caja_id: cajaId,
                            forma_pago_id: formaPagoId,
                            recibo_id: recibo.recibo_id,
                            total: this.dinero(monto),
                            tipo: 0,
                            historial: datos.historial,
                        },
                    );

                // 14. Actualizar límite de crédito.

                await this.limitesCredito.actualizarPorAbono(
                    manager,
                    String(operacion.venta_id),
                    this.dinero(capitalAbonado),
                );

                // 15. Respuesta pública.
                // No exponer IDs internos.

                const respuesta = {
                    success: true,
                    message: 'Pago registrado correctamente.',
                    registrado: true,
                    estado_operacion: 'COMPLETADO',
                    operacion_id:
                        datos.operacion_id.toLowerCase(),
                    recibo: {
                        codigo: recibo.codigo,
                        total: recibo.total,
                        saldo_anterior: recibo.saldo_anterior,
                        saldo_nuevo: recibo.saldo_nuevo,

                        auth_documento_token: recibo.auth_documento_token,
                        auth_documento_expiracion: recibo.auth_documento_expiracion,

                        pdf_url: null as string | null,
                        verificacion_url: null as string | null,
                    },
                    caja: {
                        total_actualizado:
                        historial.caja_total_actualizado,
                        total_nuevo:
                        historial.caja_total_nuevo,
                    },
                    avisar_auditoria:
                    datos.avisar_auditoria,
                };

                // 16. Marcar operación completada.

                const guardado = await manager.query(
                    `
                    UPDATE caja_operaciones_pago
                    SET
                        estado = 'COMPLETADO',
                        recibo_id = ?,
                        respuesta = ?,
                        updated_at = NOW()
                    WHERE id = ?
                      AND estado = 'PENDIENTE'
                    `,
                    [
                        recibo.recibo_id,
                        JSON.stringify(respuesta),
                        operacion.id,
                    ],
                );

                if (guardado.affectedRows !== 1) {
                    throw new ConflictException(
                        'No se pudo completar la operación.',
                    );
                }

                this.logger.log(
                    `[POSTEO] Completado: ` +
                    `operación=${datos.operacion_id}, ` +
                    `recibo=${recibo.codigo}`,
                );

                return respuesta;
            },
        );
    }
}

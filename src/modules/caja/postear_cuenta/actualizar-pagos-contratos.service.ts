
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PagosContratos } from '../../../database/entities/index.js';

export type TipoAbonoContrato = 'MORA' | 'CAPITAL';

export interface AbonoContrato {
    pago_id: string;
    tipo: TipoAbonoContrato;
    monto: string | number;
}

@Injectable()
export class ActualizarPagosContratosService {
    private readonly logger = new Logger(ActualizarPagosContratosService.name);

    calcularDiasMora(fechaPago: Date | string | null, diasGracia: number | string | null, fechaActual: Date = new Date()): number {
        if (!fechaPago) throw new BadRequestException('La obligación no tiene fecha de pago.');

        const fecha = typeof fechaPago === 'string' ? fechaPago.substring(0, 10) : `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, '0')}-${String(fechaPago.getDate()).padStart(2, '0')}`;
        const gracia = Number(diasGracia ?? 0);

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new BadRequestException('La fecha de pago no es válida.');
        if (!Number.isInteger(gracia) || gracia < 0) throw new BadRequestException('Los días de gracia no son válidos.');

        const [anio, mes, dia] = fecha.split('-').map(Number);
        const vencimiento = Date.UTC(anio, mes - 1, dia);

        if (new Date(vencimiento).toISOString().substring(0, 10) !== fecha) throw new BadRequestException('La fecha de pago no es válida.');

        const hoy = Date.UTC(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
        const dias = Math.floor((hoy - vencimiento) / 86400000) - gracia;

        return Math.max(0, dias);
    }

    async actualizarDiasMoraVenta(manager: EntityManager, ventaId: string) {
        this.logger.log(`[MORA] Iniciando actualización de días de mora. Venta=${ventaId}`);

        try {
            const pagos = await manager.query(`
                SELECT id, estado, mora, fecha_pago, dias_gracia, dias_mora
                FROM pagos_contratos
                WHERE venta_id = ?
                ORDER BY fecha_pago ASC, id ASC
                FOR UPDATE
            `, [ventaId]);

            const resultados = [];

            for (const pago of pagos) {
                const tieneMora = Number(pago.estado) === 2 && Number(pago.mora) > 0;
                const diasMora = tieneMora ? this.calcularDiasMora(pago.fecha_pago, pago.dias_gracia) : 0;

                if (Number(pago.dias_mora ?? 0) !== diasMora) {
                    await manager.query('UPDATE pagos_contratos SET dias_mora = ? WHERE id = ?', [diasMora, pago.id]);
                    this.logger.debug(`[MORA] Pago=${pago.id}, anterior=${pago.dias_mora}, nuevo=${diasMora}`);
                }

                resultados.push({ pago_id: String(pago.id), dias_mora: diasMora, estado: Number(pago.estado) });
            }

            this.logger.log(`[MORA] Actualización finalizada. Venta=${ventaId}, obligaciones=${pagos.length}`);
            return resultados;
        } catch (error) {
            this.logger.error(`[MORA] Error actualizando días de mora. Venta=${ventaId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }

    async aplicarAbonos(manager: EntityManager, ventaId: string, abonos: AbonoContrato[]) {
        if (!abonos.length) throw new BadRequestException('No hay abonos para aplicar.');

        this.logger.log(`[ABONOS] Iniciando aplicación. Venta=${ventaId}, movimientos=${abonos.length}`);
        const repository = manager.getRepository(PagosContratos);
        const resultados = [];

        try {
            for (const abono of abonos) {
                const monto = Number(abono.monto);
                const abonado = Math.round(monto * 100);

                if (!Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - abonado) > 0.000001) {
                    throw new BadRequestException('El monto del abono no es válido.');
                }

                if (abono.tipo !== 'MORA' && abono.tipo !== 'CAPITAL') throw new BadRequestException('El tipo de abono no es válido.');

                this.logger.debug(`[ABONOS] Buscando obligación=${abono.pago_id}, tipo=${abono.tipo}, monto=${monto}`);

                const pago = await repository.createQueryBuilder('pago')
                    .setLock('pessimistic_write')
                    .where('pago.id = :pagoId', { pagoId: abono.pago_id })
                    .andWhere('pago.venta_id = :ventaId', { ventaId })
                    .getOne();

                if (!pago) throw new NotFoundException(`No se encontró la obligación ${abono.pago_id}.`);

                const saldoActual = Math.round(Number(pago.saldo_actual) * 100);
                const mora = Math.round(Number(pago.mora) * 100);
                const saldoCap = Math.round(Number(pago.saldo_cap) * 100);
                const totalAbonado = Math.round(Number(pago.total_abonado) * 100);

                if (![saldoActual, mora, saldoCap, totalAbonado].every(Number.isFinite)) {
                    throw new BadRequestException(`La obligación ${abono.pago_id} tiene saldos inválidos.`);
                }

                if (abonado > saldoActual) throw new BadRequestException('El abono supera el saldo de la obligación.');
                if (abono.tipo === 'MORA' && abonado > mora) throw new BadRequestException('El abono supera la mora pendiente.');
                if (abono.tipo === 'CAPITAL' && abonado > saldoCap) throw new BadRequestException('El abono supera el capital pendiente.');

                const nuevaMora = abono.tipo === 'MORA' ? mora - abonado : mora;
                const nuevoCapital = abono.tipo === 'CAPITAL' ? saldoCap - abonado : saldoCap;
                const nuevoSaldo = saldoActual - abonado;

                pago.mora = nuevaMora / 100;
                pago.saldo_cap = nuevoCapital / 100;
                pago.saldo_actual = nuevoSaldo / 100;
                pago.total_abonado = (totalAbonado + abonado) / 100;

                if (nuevaMora > 0) pago.estado = 2;
                else if (nuevoSaldo > 0 || nuevoCapital > 0) pago.estado = 1;
                else pago.estado = 3;

                const diasMora = pago.estado === 2 ? this.calcularDiasMora(pago.fecha_pago, pago.dias_gracia) : 0;
                pago.dias_mora = diasMora;

                await repository.save(pago);

                this.logger.log(`[ABONOS] Obligación=${pago.id}, estado=${pago.estado}, saldo=${pago.saldo_actual}, mora=${pago.mora}, dias_mora=${diasMora}`);

                resultados.push({
                    pago_id: String(pago.id),
                    tipo: abono.tipo,
                    monto: (abonado / 100).toFixed(2),
                    saldo_actual: pago.saldo_actual,
                    saldo_cap: pago.saldo_cap,
                    mora: pago.mora,
                    dias_mora: diasMora,
                    estado: pago.estado,
                });
            }

            await this.actualizarDiasMoraVenta(manager, ventaId);
            this.logger.log(`[ABONOS] Aplicación finalizada correctamente. Venta=${ventaId}`);

            return resultados;
        } catch (error) {
            this.logger.error(`[ABONOS] Error en venta=${ventaId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}

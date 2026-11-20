
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class PostearCuentaLimiteCreditoService {
    private readonly logger = new Logger(PostearCuentaLimiteCreditoService.name);

    async actualizarPorAbono(manager: EntityManager, ventaId: string, capitalAbonado: number | string) {
        this.logger.log(`[LIMITE_CREDITO] Iniciando. Venta=${ventaId}, capital=${capitalAbonado}`);

        try {
            if (!/^[1-9]\d*$/.test(String(ventaId))) throw new BadRequestException('La venta no es válida.');

            const capital = Number(capitalAbonado);
            const capitalCentavos = Math.round(capital * 100);

            if (!Number.isFinite(capital) || capital < 0 || Math.abs(capital * 100 - capitalCentavos) > 0.000001) throw new BadRequestException('El capital abonado no es válido.');

            if (capitalCentavos === 0) {
                this.logger.debug(`[LIMITE_CREDITO] No hay capital abonado. Venta=${ventaId}`);
                return { actualizado: false, motivo: 'SIN_ABONO_CAPITAL', capital_abonado: '0.00' };
            }

            const ventas = await manager.query('SELECT id, cliente_id FROM ventas WHERE id = ? LIMIT 1', [ventaId]);
            if (!ventas.length) throw new NotFoundException('No se encontró la venta.');

            const clienteId = String(ventas[0].cliente_id);

            const limites = await manager.query(`
                SELECT id, cliente_id, monto_aprobado, monto_disponible, monto_utilizado, estado
                FROM limite_credito_clientes
                WHERE cliente_id = ? AND estado = 'ACTIVO' AND es_actual = 1
                FOR UPDATE
            `, [clienteId]);

            if (!limites.length) {
                this.logger.log(`[LIMITE_CREDITO] Cliente=${clienteId} sin límite activo actual. Se omite.`);
                return { actualizado: false, motivo: 'SIN_LIMITE_ACTIVO', cliente_id: clienteId, capital_abonado: (capitalCentavos / 100).toFixed(2) };
            }

            if (limites.length > 1) throw new ConflictException('El clientes tiene más de un límite de crédito activo actual.');

            const limite = limites[0];
            const aprobado = Math.round(Number(limite.monto_aprobado) * 100);
            const disponible = Math.round(Number(limite.monto_disponible) * 100);
            const utilizado = Math.round(Number(limite.monto_utilizado) * 100);

            if (![aprobado, disponible, utilizado].every(Number.isSafeInteger)) throw new ConflictException('El límite de crédito contiene montos inválidos.');
            if (aprobado < 0 || disponible < 0 || utilizado < 0) throw new ConflictException('El límite de crédito contiene saldos negativos.');
            if (disponible + utilizado !== aprobado) throw new ConflictException('Los saldos del límite de crédito no coinciden con el monto aprobado.');
            if (capitalCentavos > utilizado) throw new ConflictException('El capital abonado supera el crédito utilizado.');

            const nuevoDisponible = disponible + capitalCentavos;
            const nuevoUtilizado = utilizado - capitalCentavos;

            if (nuevoDisponible + nuevoUtilizado !== aprobado) throw new ConflictException('El nuevo límite de crédito no está cuadrado.');

            const resultado = await manager.query(`
                UPDATE limite_credito_clientes
                SET monto_disponible = ?, monto_utilizado = ?
                WHERE id = ? AND estado = 'ACTIVO' AND es_actual = 1
            `, [nuevoDisponible / 100, nuevoUtilizado / 100, limite.id]);

            if (resultado.affectedRows !== 1) throw new ConflictException('No se pudo actualizar el límite de crédito.');

            this.logger.log(`[LIMITE_CREDITO] Actualizado. Cliente=${clienteId}, disponible=${(nuevoDisponible / 100).toFixed(2)}, utilizado=${(nuevoUtilizado / 100).toFixed(2)}`);

            return {
                actualizado: true,
                limite_id: String(limite.id),
                cliente_id: clienteId,
                capital_abonado: (capitalCentavos / 100).toFixed(2),
                monto_aprobado: (aprobado / 100).toFixed(2),
                monto_disponible: (nuevoDisponible / 100).toFixed(2),
                monto_utilizado: (nuevoUtilizado / 100).toFixed(2),
            };
        } catch (error) {
            this.logger.error(`[LIMITE_CREDITO] Error. Venta=${ventaId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}

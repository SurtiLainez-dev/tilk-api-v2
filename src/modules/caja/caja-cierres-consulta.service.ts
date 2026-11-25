import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface TotalesCierreCaja {
    total: number;
    ingreso: number;
    egreso: number;
    efectivo: number;
}

@Injectable()
export class CajaCierresConsultaService {

    private centavos(valor: unknown): number {
        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero < 0) {
            throw new InternalServerErrorException('Se encontró un importe inválido en el historial de caja.');
        }

        const centavos = Math.round(numero * 100);

        if (!Number.isSafeInteger(centavos)) {
            throw new InternalServerErrorException('Importe fuera del límite permitido.');
        }

        return centavos;
    }

    async calcular(manager: EntityManager, cajaId: string, fecha: string): Promise<TotalesCierreCaja> {

        const movimientos = await manager.query(`
            SELECT
                hc.tipo_documento,
                hc.tipo,
                hc.forma_pago_id,
                hc.total,
                fp.is_tarjeta
            FROM historial_cajas hc
            LEFT JOIN forma_pagos fp ON fp.id = hc.forma_pago_id
            WHERE hc.cajas_id = ?
              AND hc.fecha = ?
              AND hc.tipo_documento <> 7
            ORDER BY hc.id ASC
        `, [cajaId, fecha]);

        let total = 0;
        let ingreso = 0;
        let egreso = 0;

        for (const movimiento of movimientos) {

            const tipo = Number(movimiento.tipo);
            const documento = Number(movimiento.tipo_documento);
            const formaPago = Number(movimiento.forma_pago_id);
            const monto = this.centavos(movimiento.total);
            const esTarjeta = Number(movimiento.is_tarjeta) === 1;

            // Las notas de crédito no representan entrada de efectivo.
            if (formaPago === 12) continue;

            // INGRESOS
            if (tipo === 0) {

                // Efectivo
                if (formaPago === 3) {
                    total += monto;
                    ingreso += monto;
                    continue;
                }

                // Tarjetas
                if (esTarjeta) {
                    total += monto;
                    continue;
                }

                // No asumir que todo cierre de caja chica
                // representa una devolución de efectivo.
                if (documento === 6 && monto > 0) {
                    throw new BadRequestException(
                        'Existe un movimiento de caja chica pendiente de identificar como reversión o cierre neutro.',
                    );
                }

                if (monto > 0) {
                    throw new BadRequestException(
                        `Existe un ingreso pendiente de clasificar. Forma de pago: ${formaPago}.`,
                    );
                }

                continue;
            }

            // EGRESOS
            if (tipo === 1 && documento === 4) {
                egreso += monto;
                continue;
            }

            if (monto > 0) {
                throw new BadRequestException(
                    'Existe un movimiento pendiente de clasificar para el cierre.',
                );
            }
        }

        const efectivo = ingreso - egreso;

        return {
            total: total / 100,
            ingreso: ingreso / 100,
            egreso: egreso / 100,
            efectivo: efectivo / 100,
        };
    }
}
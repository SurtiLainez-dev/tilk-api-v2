
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

interface CobSegmento {
    id: string | number;
    nombre: string;
    inicio: number;
    final: number;
}

@Injectable()
export class PostearCuentaSegmentoService {
    private readonly logger = new Logger(PostearCuentaSegmentoService.name);

    async buscarSegmento(manager: EntityManager, diasMora: number, estadoVenta: number): Promise<CobSegmento> {
        if (!Number.isInteger(diasMora) || diasMora < 0) throw new BadRequestException('Los días de mora no son válidos.');

        if (estadoVenta === 3) {
            const segmentos = await manager.query('SELECT id, nombre, inicio, final FROM cob_segmentos WHERE inicio = -1 AND final = -1 LIMIT 1');
            if (!segmentos.length) throw new NotFoundException('No se encontró el segmento de cuentas canceladas.');
            return segmentos[0];
        }

        const segmentos = await manager.query(`
            SELECT id, nombre, inicio, final
            FROM cob_segmentos
            WHERE ? >= inicio AND ? <= final AND inicio >= 0
            ORDER BY inicio ASC, id ASC
        `, [diasMora, diasMora]);

        if (!segmentos.length) {
            this.logger.error(`[SEGMENTO] No existe un segmento para ${diasMora} días de mora.`);
            throw new NotFoundException(`No existe un segmento configurado para ${diasMora} días de mora.`);
        }

        if (segmentos.length > 1) {
            this.logger.error(`[SEGMENTO] Rangos superpuestos. Días=${diasMora}, segmentos=${segmentos.map((s: CobSegmento) => s.id).join(',')}`);
            throw new BadRequestException(`Hay varios segmentos configurados para ${diasMora} días de mora.`);
        }

        return segmentos[0];
    }

    async actualizarSegmentoVenta(manager: EntityManager, ventaId: string) {
        this.logger.log(`[SEGMENTO] Iniciando actualización. Venta=${ventaId}`);

        try {
            const ventas = await manager.query('SELECT id, estado, dias_mora, cob_segmento_id FROM ventas WHERE id = ? FOR UPDATE', [ventaId]);
            if (!ventas.length) throw new NotFoundException('No se encontró la venta.');

            const venta = ventas[0];
            const diasMora = Number(venta.dias_mora ?? 0);
            const estadoVenta = Number(venta.estado);

            this.logger.debug(`[SEGMENTO] Venta=${ventaId}, estado=${estadoVenta}, dias_mora=${diasMora}`);

            const segmento = await this.buscarSegmento(manager, diasMora, estadoVenta);
            const segmentoAnterior = venta.cob_segmento_id;

            if (Number(segmentoAnterior) !== Number(segmento.id)) {
                await manager.query('UPDATE ventas SET cob_segmento_id = ? WHERE id = ?', [segmento.id, ventaId]);
                this.logger.log(`[SEGMENTO] Venta=${ventaId}, anterior=${segmentoAnterior}, nuevo=${segmento.id}, nombre=${segmento.nombre}`);
            } else {
                this.logger.debug(`[SEGMENTO] Venta=${ventaId} ya pertenece al segmento=${segmento.id}`);
            }

            return {
                venta_id: ventaId,
                dias_mora: diasMora,
                estado: estadoVenta,
                cob_segmento_id: segmento.id,
                cob_segmento_nombre: segmento.nombre,
                segmento_anterior: segmentoAnterior,
                actualizado: Number(segmentoAnterior) !== Number(segmento.id),
            };
        } catch (error) {
            this.logger.error(`[SEGMENTO] Error actualizando venta=${ventaId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}

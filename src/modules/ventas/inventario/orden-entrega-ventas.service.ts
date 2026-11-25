import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface OrdenEntregaCreada { ordenEntregaId: string; codigo: string; }

@Injectable()
export class OrdenEntregaVentasService {
    private readonly logger = new Logger(OrdenEntregaVentasService.name);

    async crear(manager: EntityManager, ventaId: string): Promise<OrdenEntregaCreada> {
        if (!/^[1-9]\d*$/.test(String(ventaId))) throw new BadRequestException('El ID de la venta no es válido.');
        if (String(ventaId).length > 13) throw new BadRequestException('El ID de venta excede el tamaño permitido para el código de entrega.');

        const ventas: { id: string | number; colaborador_id: string | number | null }[] = await manager.query(
            'SELECT id, colaborador_id FROM ventas WHERE id = ? LIMIT 1 FOR UPDATE', [ventaId],
        );
        if (!ventas.length) throw new BadRequestException('No existe la venta para crear su orden de entrega.');
        if (!ventas[0].colaborador_id) throw new BadRequestException('La venta no tiene colaborador responsable.');

        const codigo = `OE${String(ventaId).padStart(13, '0')}`;
        const existentes: { id: string | number; cod: string }[] = await manager.query(
            'SELECT id, cod FROM orden_entregas WHERE venta_id = ? LIMIT 1 FOR UPDATE', [ventaId],
        );
        if (existentes.length) {
            this.logger.warn(`[ORDEN_EXISTENTE] ventaId=${ventaId} ordenId=${existentes[0].id} codigo=${existentes[0].cod}`);
            return { ordenEntregaId: String(existentes[0].id), codigo: existentes[0].cod };
        }

        this.logger.log(`[ORDEN_CREAR_INICIO] ventaId=${ventaId} colaboradorId=${ventas[0].colaborador_id} codigo=${codigo}`);
        const resultado: { insertId?: string | number } = await manager.query(`
            INSERT INTO orden_entregas (
                venta_id, colaborador_id, cod, estado, revisado_admin, es_digital, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())
        `, [ventaId, ventas[0].colaborador_id, codigo, 0]);

        if (!resultado?.insertId) throw new InternalServerErrorException('No se pudo crear la orden de entrega.');
        this.logger.log(`[ORDEN_CREAR_OK] ventaId=${ventaId} ordenId=${resultado.insertId} codigo=${codigo} revisado_admin=1`);
        return { ordenEntregaId: String(resultado.insertId), codigo };
    }
}

import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InventarioVentasService } from '../../inventario/inventario-ventas.service.js';

@Injectable()
export class CajaVentaContadoSeriesService {
    constructor(private readonly inventario: InventarioVentasService) {}

    async crearYVincular(manager: EntityManager, carritoId: string, lineaId: string, articuloId: string, sucursalId: string, serie: string, precio: string, estado: 1 | 2): Promise<string> {
        const lineas = await manager.query(`
            SELECT id, cantidad, remision_articulo_id, articulo_id
            FROM cuerpo_carrito_compras
            WHERE id = ?
              AND carrito_compra_id = ?
              AND estado = 1
            FOR UPDATE
        `, [lineaId, carritoId]);

        const linea = lineas[0];

        if (!linea || String(linea.articulo_id) !== articuloId) throw new BadRequestException('La línea no pertenece al carrito.');
        if (linea.remision_articulo_id !== null) throw new ConflictException('La línea ya tiene una remisión.');
        if (Number(linea.cantidad) !== 1) throw new BadRequestException('La línea con serie debe tener cantidad 1.');

        const remisionId = await this.inventario.crearRemisionParaVenta(manager, articuloId, sucursalId, serie, precio, estado);

        const resultado = await manager.query(`
            UPDATE cuerpo_carrito_compras
            SET remision_articulo_id = ?, updated_at = ?
            WHERE id = ?
              AND carrito_compra_id = ?
              AND estado = 1
              AND remision_articulo_id IS NULL
        `, [remisionId, new Date(), lineaId, carritoId]);

        if (resultado.affectedRows !== 1) throw new ConflictException('No se pudo vincular la remisión al carrito.');

        return remisionId;
    }
}
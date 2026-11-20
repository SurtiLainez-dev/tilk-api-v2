
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PrecioService } from './precios/precio.service.js';

interface StockFila {
    articulo_id: string;
    slug: string | null;
    nombre_articulo: string;
    modelo: string | null;
    codigo_sistema: string;
    codigo_barras: string | null;
    is_motocicleta: number;
    stock_actual: string | number;
}

@Injectable()
export class InventarioStockService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly precioService: PrecioService,
    ) {}

    async consultarPorSucursal(sucursalId: string) {
        const filas: StockFila[] = await this.dataSource.query(
            `
      SELECT
        a.id AS articulo_id,
        a.slug,
        a.nombre_articulo,
        a.modelo,
        a.codigo_sistema,
        a.codigo_barras,
        a.is_motocicleta,
        SUM(sa.stock_actual) AS stock_actual
      FROM stock_articulos sa
      INNER JOIN articulos a
        ON a.id = sa.articulo_id
      WHERE sa.sucursal_id = ?
        AND sa.stock_actual > 0
        AND a.slug IS NOT NULL
        AND a.slug <> ''
      GROUP BY
        a.id,
        a.slug,
        a.nombre_articulo,
        a.modelo,
        a.codigo_sistema,
        a.codigo_barras,
        a.is_motocicleta
      ORDER BY a.nombre_articulo ASC
      `,
            [sucursalId],
        );

        const ids = filas.map((fila) => String(fila.articulo_id));

        const [precios, promociones] = await Promise.all([
            this.precioService.obtenerPreciosContado(ids),
            this.precioService.obtenerPromocionesContado(
                ids,
                sucursalId,
            ),
        ]);

        return {
            success: true,
            data: filas.map((fila) => {
                const articuloId = String(fila.articulo_id);

                return {
                    slug: fila.slug,
                    nombre_articulo: fila.nombre_articulo,
                    modelo: fila.modelo,
                    codigo_sistema: fila.codigo_sistema,
                    codigo_barras: fila.codigo_barras,
                    stock_actual: Number(fila.stock_actual),
                    es_motocicleta:
                        Number(fila.is_motocicleta) === 1,
                    permite_venta_caja:
                        Number(fila.is_motocicleta) !== 1,
                    precio: precios.get(articuloId) ?? null,
                    promociones: promociones.get(articuloId) ?? [],
                };
            }),
        };
    }
}

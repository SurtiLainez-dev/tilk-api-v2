
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface SerieFila {
    articulo_slug: string | null;
    nombre_articulo: string;
    modelo: string | null;
    codigo_sistema: string;
    is_motocicleta: number;
    serie_sistema: string;
    serie_fabricante: string | null;
    color: string | null;
    estado_articulo_id: string | number;
    precio_actual: string | number | null;
}

@Injectable()
export class ArticulosSeriesService {
    constructor(private readonly dataSource: DataSource) {}

    async consultarDisponibles(sucursalId: string) {
        const filas: SerieFila[] = await this.dataSource.query(
            `
      SELECT
        a.slug AS articulo_slug,
        a.nombre_articulo,
        a.modelo,
        a.codigo_sistema,
        a.is_motocicleta,
        ra.serie_sistema,
        ra.serie_fabricante,
        ra.color,
        ra.estado_articulo_id,
        ra.precio_actual
      FROM remision_articulos ra
      INNER JOIN articulos a
        ON a.id = ra.articulo_id
      WHERE ra.sucursal_id = ?
        AND ra.estado_articulo_id IN (1, 3)
        AND a.slug IS NOT NULL
        AND a.slug <> ''
      ORDER BY
        a.nombre_articulo ASC,
        ra.serie_sistema ASC
      `,
            [sucursalId],
        );

        return {
            success: true,
            data: filas.map((fila) => ({
                articulo_slug: fila.articulo_slug,
                nombre_articulo: fila.nombre_articulo,
                modelo: fila.modelo,
                codigo_sistema: fila.codigo_sistema,
                serie_sistema: fila.serie_sistema,
                serie_fabricante: fila.serie_fabricante,
                color: fila.color,
                estado: Number(fila.estado_articulo_id) === 1
                    ? 'NUEVO'
                    : 'REINGRESO',
                precio_actual:
                    fila.precio_actual === null
                        ? null
                        : Number(fila.precio_actual),
                aplica_impuesto_adicional: false,
                es_motocicleta:
                    Number(fila.is_motocicleta) === 1,
                permite_venta_caja:
                    Number(fila.is_motocicleta) !== 1,
            })),
        };
    }
}


import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

interface FiltrosMotocicletas {
    articuloSlug: string;
    sucursalId?: string | null;
}

@Injectable()
export class InventarioMotocicletasService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}


    async consultar(filtros: FiltrosMotocicletas) {
        const articuloSlug = filtros.articuloSlug?.trim();
        const sucursalId = filtros.sucursalId
            ? String(filtros.sucursalId).trim()
            : null;

        if (!articuloSlug) {
            throw new BadRequestException('Debes indicar el artículo.');
        }

        if (sucursalId !== null && !/^[1-9]\d*$/.test(sucursalId)) {
            throw new BadRequestException('La sucursal no es válida.');
        }

        const articulos = await this.dataSource.query(
            `
        SELECT
            a.id,
            a.slug,
            a.nombre_articulo,
            a.modelo,
            a.codigo_sistema,
            a.is_motocicleta
        FROM articulos a
        WHERE a.slug = ?
        LIMIT 1
        `,
            [articuloSlug],
        );

        if (!articulos.length) {
            throw new NotFoundException('No se encontró el artículo.');
        }

        const articulo = articulos[0];

        if (Number(articulo.is_motocicleta) !== 1) {
            throw new BadRequestException(
                'El artículo no está registrado como motocicleta.',
            );
        }

        const parametros: unknown[] = [articulo.id];
        let filtroSucursal = '';

        if (sucursalId !== null) {
            filtroSucursal = 'AND ra.sucursal_id = ?';
            parametros.push(sucursalId);
        }

        const filas = await this.dataSource.query(
            `
        SELECT
            ra.id AS remision_articulo_id,
            ra.articulo_id,
            ra.sucursal_id,
            ra.serie_sistema,
            ra.serie_fabricante,
            ra.estado_articulo_id,
            ea.nombre AS estado_articulo,

            m.motor,
            m.chasis,
            m.cilindraje,
            m.anio,
            m.color,
            m.placa,
            m.facturado,

            COALESCE(st.stock_actual, 0) AS stock_actual,
            COALESCE(st.stock_consignado, 0) AS stock_consignado

        FROM remision_articulos ra

        INNER JOIN estado_articulos ea
            ON ea.id = ra.estado_articulo_id

        INNER JOIN motocicletas m
            ON m.remision_articulo_id = ra.id

        LEFT JOIN (
            SELECT
                articulo_id,
                sucursal_id,
                SUM(COALESCE(stock_actual, 0)) AS stock_actual,
                SUM(COALESCE(stock_consignado, 0)) AS stock_consignado
            FROM stock_articulos
            GROUP BY articulo_id, sucursal_id
        ) st
            ON st.articulo_id = ra.articulo_id
            AND st.sucursal_id = ra.sucursal_id

        WHERE ra.articulo_id = ?
            AND ra.estado_articulo_id IN (1, 2)
            ${filtroSucursal}

        ORDER BY
            ra.sucursal_id ASC,
            ra.estado_articulo_id ASC,
            ra.id ASC
        `,
            parametros,
        );

        const inventarioPorSucursal = new Map<
            string,
            {
                sucursal_id: string;
                stock_actual: number;
                stock_consignado: number;
                unidades_nuevas: number;
                unidades_consignadas: number;
            }
            >();

        for (const fila of filas) {
            const clave = String(fila.sucursal_id);

            if (!inventarioPorSucursal.has(clave)) {
                inventarioPorSucursal.set(clave, {
                    sucursal_id: clave,
                    stock_actual: Number(fila.stock_actual) || 0,
                    stock_consignado: Number(fila.stock_consignado) || 0,
                    unidades_nuevas: 0,
                    unidades_consignadas: 0,
                });
            }

            const resumen = inventarioPorSucursal.get(clave)!;

            if (Number(fila.estado_articulo_id) === 1) {
                resumen.unidades_nuevas++;
            }

            if (Number(fila.estado_articulo_id) === 2) {
                resumen.unidades_consignadas++;
            }
        }

        const advertencias: Array<{
            sucursal_id: string;
            tipo: string;
            message: string;
        }> = [];

        for (const resumen of inventarioPorSucursal.values()) {
            if (resumen.unidades_nuevas > resumen.stock_actual) {
                advertencias.push({
                    sucursal_id: resumen.sucursal_id,
                    tipo: 'STOCK_NUEVO_INSUFICIENTE',
                    message:
                        `Hay ${resumen.unidades_nuevas} motocicletas ` +
                        `nuevas registradas, pero stock_actual ` +
                        `es ${resumen.stock_actual}. ` +
                        'Revisa el inventario de la sucursal.',
                });
            }

            if (resumen.unidades_consignadas > resumen.stock_consignado) {
                advertencias.push({
                    sucursal_id: resumen.sucursal_id,
                    tipo: 'STOCK_CONSIGNADO_INSUFICIENTE',
                    message:
                        `Hay ${resumen.unidades_consignadas} motocicletas ` +
                        `consignadas registradas, pero ` +
                        `stock_consignado es ${resumen.stock_consignado}. ` +
                        'Revisa el inventario de la sucursal.',
                });
            }
        }

        const motocicletas = filas.map((fila: any) => {
            const resumen = inventarioPorSucursal.get(
                String(fila.sucursal_id),
            )!;

            const esNueva = Number(fila.estado_articulo_id) === 1;

            const stockCorrespondiente = esNueva
                ? resumen.stock_actual
                : resumen.stock_consignado;

            const unidadesRegistradas = esNueva
                ? resumen.unidades_nuevas
                : resumen.unidades_consignadas;

            const stockCoherente =
                stockCorrespondiente >= unidadesRegistradas;

            const facturado = Number(fila.facturado) === 1;

            return {
                // Identificador requerido para vincular la unidad al carrito.
                remision_articulo_id: String(fila.remision_articulo_id),

                remision_articulo: {
                    serie_sistema: fila.serie_sistema,
                    serie_fabricante: fila.serie_fabricante,
                    sucursal_id: String(fila.sucursal_id),
                    estado: {
                        id: Number(fila.estado_articulo_id),
                        nombre: fila.estado_articulo,
                    },
                },

                motocicleta: {
                    chasis: fila.chasis,
                    motor: fila.motor,
                    cilindraje: fila.cilindraje,
                    anio: fila.anio,
                    color: fila.color,
                    placa: fila.placa,
                    marca: null,
                    modelo: articulo.modelo,
                },

                inventario: {
                    tipo: esNueva ? 'NUEVO' : 'CONSIGNADO',
                    stock_correspondiente: stockCorrespondiente,
                    unidades_registradas: unidadesRegistradas,
                    stock_coherente: stockCoherente,
                },

                disponible_para_vincular:
                    stockCoherente &&
                    stockCorrespondiente > 0 &&
                    !facturado,

                advertencia: !stockCoherente
                    ? 'El inventario presenta inconsistencias.'
                    : facturado
                        ? 'Esta motocicleta ya figura como facturada.'
                        : null,
            };
        });

        return {
            success: true,
            data: {
                articulo: {
                    slug: articulo.slug,
                    nombre_articulo: articulo.nombre_articulo,
                    modelo: articulo.modelo,
                    codigo_sistema: articulo.codigo_sistema,
                },
                sucursal_id: sucursalId,
                total_motocicletas: motocicletas.length,
                inventario: Array.from(inventarioPorSucursal.values()),
                requiere_revision_inventario: advertencias.length > 0,
                advertencias,
                motocicletas,
            },
        };
    }

}

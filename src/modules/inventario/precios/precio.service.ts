
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface PrecioContado {
    tk2_precio_id: string;
    precio_contado: number;
    maximo_descuento: number;
    porcentaje_descuento: number;
    tiene_impuesto: boolean;
}

export interface PromocionContado {
    slug: string;
    nombre: string;
    precio_final: number;
    descuento_monto: number;
    descuento_porcentaje: number;
    aplica_tipo_cliente: string;
    prioridad: number;
    orden: number;
}

export interface ConsultaPrecioContado {
    articulo_slug: string;
    precio: PrecioContado;
    promociones: PromocionContado[];
}

@Injectable()
export class PrecioService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    async obtenerPreciosContado(
        articuloIds: string[],
    ): Promise<Map<string, PrecioContado>> {
        const resultado = new Map<string, PrecioContado>();

        if (!articuloIds.length) {
            return resultado;
        }

        const placeholders = articuloIds.map(() => '?').join(',');

        const filas = await this.dataSource.query(
            `
            SELECT
                p.id,
                p.articulo_id,
                p.precio_contado,
                p.maximo_descuento,
                p.procentaje_descuento,
                p.impuesto_id
            FROM tk2_precios p
            WHERE p.articulo_id IN (${placeholders})
              AND p.estado = 1
            ORDER BY
                p.articulo_id,
                p.id DESC
            `,
            articuloIds,
        );

        for (const fila of filas) {
            const articuloId = String(fila.articulo_id);

            if (resultado.has(articuloId)) {
                continue;
            }

            resultado.set(articuloId, {
                tk2_precio_id: String(fila.id),
                precio_contado: Number(fila.precio_contado),
                maximo_descuento: Number(
                    fila.maximo_descuento ?? 0,
                ),
                porcentaje_descuento: Number(
                    fila.procentaje_descuento ?? 0,
                ),
                tiene_impuesto: fila.impuesto_id !== null,
            });
        }

        return resultado;
    }

    async obtenerPromocionesContado(
        articuloIds: string[],
        sucursalId: string,
    ): Promise<Map<string, PromocionContado[]>> {
        const resultado = new Map<string, PromocionContado[]>();

        if (!articuloIds.length) {
            return resultado;
        }

        const placeholders = articuloIds.map(() => '?').join(',');

        const filas = await this.dataSource.query(
            `
            SELECT
                p.articulo_id,
                pp.id AS plan_id,
                pp.nombre,
                pp.precio_final,
                pp.descuento_monto,
                pp.descuento_porcentaje,
                pp.prioridad,
                pp.orden,
                pp.aplica_tipo_cliente,
                pp.sucursales
            FROM tk2_precio_planes pp
            INNER JOIN tk2_precios p
                ON p.id = pp.tk2_precio_id
            WHERE p.articulo_id IN (${placeholders})
              AND p.estado = 1
              AND pp.estado = 1
              AND pp.tipo_venta = 'CONTADO'
              AND pp.tipo_calculo = 'PROMOCION_CONTADO'
              AND (
                  pp.fecha_fin IS NULL
                  OR pp.fecha_fin >= NOW()
              )
            ORDER BY
                pp.prioridad DESC,
                pp.orden ASC,
                pp.id DESC
            `,
            articuloIds,
        );

        for (const fila of filas) {
            const sucursales = this.normalizarSucursales(
                fila.sucursales,
            );

            // NULL o [] significa todas las sucursales.
            if (
                sucursales !== null &&
                sucursales.length > 0 &&
                !sucursales.includes(String(sucursalId))
            ) {
                continue;
            }

            const articuloId = String(fila.articulo_id);
            const promociones = resultado.get(articuloId) ?? [];

            promociones.push({
                // Se utiliza el ID real de la tabla.
                // Se conserva "slug" por compatibilidad con el frontend.
                slug: String(fila.plan_id),
                nombre: String(fila.nombre),
                precio_final: Number(fila.precio_final ?? 0),
                descuento_monto: Number(
                    fila.descuento_monto ?? 0,
                ),
                descuento_porcentaje: Number(
                    fila.descuento_porcentaje ?? 0,
                ),
                aplica_tipo_cliente: String(
                    fila.aplica_tipo_cliente ?? '',
                ),
                prioridad: Number(fila.prioridad ?? 0),
                orden: Number(fila.orden ?? 0),
            });

            resultado.set(articuloId, promociones);
        }

        return resultado;
    }

    async consultarPorArticuloSlug(
        articuloSlug: string,
        sucursalId: string,
    ): Promise<ConsultaPrecioContado> {
        if (!articuloSlug?.trim() || !sucursalId?.trim()) {
            throw new BadRequestException(
                'Se requiere el artículo y la sucursal.',
            );
        }

        const articulos = await this.dataSource.query(
            `
            SELECT
                id,
                slug
            FROM articulos
            WHERE slug = ?
            LIMIT 1
            `,
            [articuloSlug],
        );

        if (!articulos.length) {
            throw new NotFoundException(
                'No se encontró el artículo.',
            );
        }

        const articuloId = String(articulos[0].id);

        const [precios, promociones] = await Promise.all([
            this.obtenerPreciosContado([articuloId]),
            this.obtenerPromocionesContado(
                [articuloId],
                sucursalId,
            ),
        ]);

        const precio = precios.get(articuloId);

        if (!precio) {
            throw new NotFoundException(
                'El artículo no tiene precio de contado activo.',
            );
        }

        return {
            articulo_slug: articuloSlug,
            precio,
            promociones: promociones.get(articuloId) ?? [],
        };
    }

    async resolverPlanInterno(
        articuloId: string,
        planSlug: string,
        sucursalId: string,
    ): Promise<string> {
        if (!articuloId?.trim() || !planSlug?.trim()) {
            throw new BadRequestException(
                'Se requiere el artículo y la promoción.',
            );
        }

        // El identificador recibido corresponde al ID
        // existente en tk2_precio_planes.
        if (!/^[1-9]\d*$/.test(planSlug)) {
            throw new BadRequestException(
                'El identificador de la promoción no es válido.',
            );
        }

        const promociones = await this.dataSource.query(
            `
            SELECT
                pp.id,
                pp.sucursales
            FROM tk2_precio_planes pp
            INNER JOIN tk2_precios p
                ON p.id = pp.tk2_precio_id
            WHERE p.articulo_id = ?
              AND pp.id = ?
              AND p.estado = 1
              AND pp.estado = 1
              AND pp.tipo_venta = 'CONTADO'
              AND pp.tipo_calculo = 'PROMOCION_CONTADO'
              AND (
                  pp.fecha_fin IS NULL
                  OR pp.fecha_fin >= NOW()
              )
            LIMIT 1
            `,
            [articuloId, planSlug],
        );

        if (!promociones.length) {
            throw new BadRequestException(
                'La promoción seleccionada no está disponible.',
            );
        }

        const plan = promociones[0];

        const sucursales = this.normalizarSucursales(
            plan.sucursales,
        );

        // NULL o [] permite todas las sucursales.
        if (
            sucursales !== null &&
            sucursales.length > 0 &&
            !sucursales.includes(String(sucursalId))
        ) {
            throw new BadRequestException(
                'La promoción no está disponible en esta sucursal.',
            );
        }

        return String(plan.id);
    }

    private normalizarSucursales(
        valor: unknown,
    ): string[] | null {
        if (valor === null || valor === undefined) {
            return null;
        }

        let datos: unknown = valor;

        if (typeof datos === 'string') {
            try {
                datos = JSON.parse(datos);
            } catch {
                return [];
            }
        }

        if (!Array.isArray(datos)) {
            return [];
        }

        return datos
            .filter(
                (item): item is string | number =>
                    typeof item === 'string' ||
                    typeof item === 'number',
            )
            .map(String);
    }
}

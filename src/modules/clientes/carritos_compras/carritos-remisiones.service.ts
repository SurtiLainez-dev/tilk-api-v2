
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface VincularRemisionCarritoDto {
    articulo_slug: string;
    remision_articulo_id: string | number;
}

@Injectable()
export class CarritosRemisionesService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    async vincular(
        carritoSlug: string,
        dto: VincularRemisionCarritoDto,
        sucursalId: string | number,
    ) {
        const slug = String(carritoSlug ?? '').trim();
        const articuloSlug = String(dto?.articulo_slug ?? '').trim();
        const remisionId = String(
            dto?.remision_articulo_id ?? '',
        ).trim();
        const sucursal = String(sucursalId ?? '').trim();

        if (!slug || !articuloSlug) {
            throw new BadRequestException(
                'El carrito y el artículo son obligatorios.',
            );
        }

        if (
            !/^[1-9]\d*$/.test(remisionId) ||
            !/^[1-9]\d*$/.test(sucursal)
        ) {
            throw new BadRequestException(
                'La remisión o sucursal no es válida.',
            );
        }

        return this.dataSource.transaction(async (manager) => {
            // Bloqueamos el carrito para serializar modificaciones.
            const carritos = await manager.query(
                `
        SELECT id, slug, sucursal_id, estado
        FROM carrito_compras
        WHERE slug = ?
        LIMIT 1
        FOR UPDATE
        `,
                [slug],
            );

            const carrito = carritos[0];

            if (!carrito) {
                throw new NotFoundException(
                    'No se encontró el carrito.',
                );
            }

            if (carrito.estado !== 'ABIERTO') {
                throw new ConflictException(
                    'Solo pueden modificarse carritos abiertos.',
                );
            }

            if (String(carrito.sucursal_id) !== sucursal) {
                throw new BadRequestException(
                    'El carrito pertenece a otra sucursal.',
                );
            }

            const articulos = await manager.query(
                `
        SELECT id, slug, is_motocicleta
        FROM articulos
        WHERE slug = ?
        LIMIT 1
        `,
                [articuloSlug],
            );

            const articulo = articulos[0];

            if (!articulo) {
                throw new NotFoundException(
                    'No se encontró el artículo.',
                );
            }

            // La remisión se bloquea antes de comprobar su uso.
            const remisiones = await manager.query(
                `
        SELECT
          id,
          articulo_id,
          sucursal_id,
          estado_articulo_id
        FROM remision_articulos
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
        `,
                [remisionId],
            );

            const remision = remisiones[0];

            if (!remision) {
                throw new NotFoundException(
                    'No se encontró la unidad física.',
                );
            }

            if (
                String(remision.articulo_id) !==
                String(articulo.id)
            ) {
                throw new BadRequestException(
                    'La remisión no corresponde al artículo.',
                );
            }

            if (String(remision.sucursal_id) !== sucursal) {
                throw new BadRequestException(
                    'La unidad pertenece a otra sucursal.',
                );
            }

            const estado = Number(
                remision.estado_articulo_id,
            );

            // 1 = Nuevo; 2 = Consignado.
            if (![1, 2].includes(estado)) {
                throw new ConflictException(
                    'La unidad no está disponible para venta.',
                );
            }

            // Comprobación del stock según el estado físico.
            const stocks = await manager.query(
                `
        SELECT stock_actual, stock_consignado
        FROM stock_articulos
        WHERE articulo_id = ?
          AND sucursal_id = ?
        FOR UPDATE
        `,
                [articulo.id, sucursal],
            );

            const disponible = stocks.reduce(
                (total: number, fila: any) => {
                    const cantidad =
                        estado === 1
                            ? Number(fila.stock_actual)
                            : Number(fila.stock_consignado);

                    return total + (Number.isFinite(cantidad)
                        ? Math.max(0, cantidad)
                        : 0);
                },
                0,
            );

            if (disponible < 1) {
                throw new ConflictException(
                    estado === 1
                        ? 'La unidad figura como nueva, pero stock_actual es 0. Corrige el inventario antes de vincularla.'
                        : 'La unidad figura como consignada, pero stock_consignado es 0. Corrige el inventario antes de vincularla.',
                );
            }

            const lineas = await manager.query(
                `
        SELECT
          id,
          cantidad,
          remision_articulo_id
        FROM cuerpo_carrito_compras
        WHERE carrito_compra_id = ?
          AND articulo_id = ?
          AND estado = 1
        ORDER BY id ASC
        FOR UPDATE
        `,
                [carrito.id, articulo.id],
            );

            if (!lineas.length) {
                throw new NotFoundException(
                    'El artículo no está agregado al carrito.',
                );
            }

            if (lineas.length !== 1) {
                throw new ConflictException(
                    'Hay varias líneas del mismo artículo. Debes identificar la línea exacta antes de vincular la unidad.',
                );
            }

            const linea = lineas[0];

            if (Number(linea.cantidad) !== 1) {
                throw new ConflictException(
                    'Para vincular una remisión individual, la línea debe tener cantidad 1.',
                );
            }

            // Evita utilizar una unidad ya reservada
            // en otro carrito abierto.
            const vinculaciones = await manager.query(
                `
        SELECT
          ccc.id,
          ccc.carrito_compra_id
        FROM cuerpo_carrito_compras ccc
        INNER JOIN carrito_compras cc
          ON cc.id = ccc.carrito_compra_id
        WHERE ccc.remision_articulo_id = ?
          AND ccc.estado = 1
          AND cc.estado = 'ABIERTO'
        FOR UPDATE
        `,
                [remisionId],
            );

            const usadaEnOtroCarrito = vinculaciones.some(
                (v: any) =>
                    String(v.carrito_compra_id) !==
                    String(carrito.id),
            );

            if (usadaEnOtroCarrito) {
                throw new ConflictException(
                    'Esta unidad ya está vinculada a otro carrito abierto.',
                );
            }

            // También evita duplicarla en el mismo carrito.
            const usadaEnOtraLinea = vinculaciones.some(
                (v: any) =>
                    String(v.id) !== String(linea.id),
            );

            if (usadaEnOtraLinea) {
                throw new ConflictException(
                    'Esta unidad ya está vinculada a otra línea.',
                );
            }

            const yaVinculada =
                String(linea.remision_articulo_id ?? '') ===
                remisionId;

            if (!yaVinculada) {
                const actualizado = await manager.query(
                    `
          UPDATE cuerpo_carrito_compras
          SET
            remision_articulo_id = ?,
            updated_at = NOW()
          WHERE id = ?
            AND carrito_compra_id = ?
            AND estado = 1
          `,
                    [remisionId, linea.id, carrito.id],
                );

                if (actualizado.affectedRows !== 1) {
                    throw new ConflictException(
                        'No fue posible vincular la unidad.',
                    );
                }
            }

            return {
                success: true,
                message: yaVinculada
                    ? 'La unidad ya estaba vinculada.'
                    : 'Unidad vinculada correctamente.',
                data: {
                    carrito_slug: carrito.slug,
                    articulo_slug: articulo.slug,
                    es_motocicleta:
                        Number(articulo.is_motocicleta) === 1,
                    vinculada: true,
                    estado_articulo_id: estado,
                },
            };
        });
    }
}

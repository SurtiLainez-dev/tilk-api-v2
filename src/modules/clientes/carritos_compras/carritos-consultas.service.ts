
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    DataSource,
    QueryRunner,
} from 'typeorm';

@Injectable()
export class CarritosConsultasService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    async buscarAbiertos(
        clienteSlug: string,
        sucursalId: string,
    ) {
        if (!clienteSlug?.trim() || !sucursalId?.trim()) {
            throw new BadRequestException(
                'Se requiere el cliente y la sucursal.',
            );
        }

        const carritos = await this.dataSource.query(
            `
      SELECT
        cc.slug,
        cc.nombre,
        cc.estado,
        cc.tipo,
        cc.subtotal,
        cc.descuento,
        cc.total_neto,
        cc.created_at,
        cc.updated_at,
        (
          SELECT COUNT(*)
          FROM cuerpo_carrito_compras ccc
          WHERE ccc.carrito_compra_id = cc.id
            AND ccc.estado = 1
        ) AS cantidad_lineas
      FROM carrito_compras cc
      INNER JOIN clientes c
        ON c.id = cc.cliente_id
      WHERE c.slug = ?
        AND cc.sucursal_id = ?
        AND cc.estado = 'ABIERTO'
        AND cc.tipo = 'CONTADO'
        AND cc.estado_visible = 1
      ORDER BY cc.updated_at DESC, cc.id DESC
      LIMIT 50
      `,
            [clienteSlug, sucursalId],
        );

        return {
            success: true,
            tiene_carritos_abiertos: carritos.length > 0,
            requiere_confirmacion: carritos.length > 0,
            message: carritos.length
                ? 'El cliente tiene carritos abiertos. ¿Deseas utilizar uno?'
                : 'El cliente no tiene carritos abiertos.',
            data: carritos.map((carrito: any) => ({
                slug: carrito.slug,
                nombre: carrito.nombre,
                estado: carrito.estado,
                tipo: carrito.tipo,
                subtotal: Number(carrito.subtotal),
                descuento: Number(carrito.descuento),
                total_neto: Number(carrito.total_neto),
                cantidad_lineas: Number(carrito.cantidad_lineas),
                created_at: carrito.created_at,
                updated_at: carrito.updated_at,
            })),
        };
    }

    async obtenerDetalle(
        carritoSlug: string,
        sucursalId: string,
        queryRunner?: QueryRunner,
    ) {
        if (!carritoSlug?.trim() || !sucursalId?.trim()) {
            throw new BadRequestException(
                'Se requiere el carrito y la sucursal.',
            );
        }

        const consultar = (
            sql: string,
            parametros: unknown[],
        ) => {
            return queryRunner
                ? queryRunner.query(sql, parametros)
                : this.dataSource.query(sql, parametros);
        };

        const carritos = await consultar(
            `
      SELECT
        cc.id,
        cc.slug,
        cc.nombre,
        cc.estado,
        cc.tipo,
        cc.subtotal,
        cc.descuento,
        cc.total_neto,
        c.slug AS cliente_slug,
        c.nombres,
        c.apellidos
      FROM carrito_compras cc
      INNER JOIN clientes c
        ON c.id = cc.cliente_id
      WHERE cc.slug = ?
        AND cc.sucursal_id = ?
        AND cc.estado = 'ABIERTO'
        AND cc.tipo = 'CONTADO'
        AND cc.estado_visible = 1
      LIMIT 1
      `,
            [carritoSlug, sucursalId],
        );

        if (!carritos.length) {
            throw new NotFoundException(
                'No se encontró un carrito abierto disponible.',
            );
        }

        const carrito = carritos[0];

        const lineas = await consultar(
            `
      SELECT
        ccc.id AS linea_id,
        ccc.tk2_precio_id,
        ccc.tk2_precio_plan_id,
        a.slug AS articulo_slug,
        a.nombre_articulo,
        a.modelo,
        a.codigo_sistema,
        a.is_motocicleta,
        ccc.cantidad,
        ccc.precio_contado,
        ccc.precio_final,
        ccc.subtotal,
        ccc.descuento_monto,
        ccc.descuento_porcentaje,
        ccc.total,
        ccc.tipo_linea,
        ccc.comentario
      FROM cuerpo_carrito_compras ccc
      INNER JOIN articulos a
        ON a.id = ccc.articulo_id
      WHERE ccc.carrito_compra_id = ?
        AND ccc.estado = 1
      ORDER BY ccc.id ASC
      `,
            [carrito.id],
        );

        const articulos = lineas.map((linea: any) => ({
            linea_id: Number(linea.linea_id),
            articulo_slug: linea.articulo_slug,
            nombre_articulo: linea.nombre_articulo,
            modelo: linea.modelo,
            codigo_sistema: linea.codigo_sistema,
            es_motocicleta:
                Number(linea.is_motocicleta) === 1,
            tk2_precio_id:
                linea.tk2_precio_id === null
                    ? null
                    : Number(linea.tk2_precio_id),
            tk2_precio_plan_id:
                linea.tk2_precio_plan_id === null
                    ? null
                    : Number(linea.tk2_precio_plan_id),
            cantidad: Number(linea.cantidad),
            precio_contado: Number(linea.precio_contado),
            precio_final: Number(linea.precio_final),
            subtotal: Number(linea.subtotal),
            descuento: Number(linea.descuento_monto),
            descuento_monto: Number(linea.descuento_monto),
            descuento_porcentaje:
                Number(linea.descuento_porcentaje),
            total: Number(linea.total),
            tipo_linea: linea.tipo_linea,
            comentario: linea.comentario,
        }));

        const cantidadArticulos = articulos.reduce(
            (total: number, articulo: any) =>
                total + articulo.cantidad,
            0,
        );

        return {
            success: true,
            data: {
                slug: carrito.slug,
                nombre: carrito.nombre,
                estado: carrito.estado,
                tipo: carrito.tipo,
                cliente: {
                    slug: carrito.cliente_slug,
                    nombre_completo: [
                        carrito.nombres,
                        carrito.apellidos,
                    ]
                        .filter(Boolean)
                        .join(' '),
                },
                subtotal: Number(carrito.subtotal),
                descuento: Number(carrito.descuento),
                total_neto: Number(carrito.total_neto),
                cantidad_lineas: articulos.length,
                cantidad_articulos: cantidadArticulos,
                articulos,
            },
        };
    }
}


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CarritosFacturacionService {
    constructor(private readonly dataSource: DataSource) {}

    async buscarAbiertos(clienteSlug: string) {
        if (!clienteSlug?.trim()) throw new BadRequestException('Se requiere el cliente.');

        const filas = await this.dataSource.query(`
            SELECT cc.slug, cc.nombre, cc.estado, cc.tipo,
                   cc.sucursal_id,
                   cc.subtotal, cc.descuento, cc.total_neto,
                   cc.created_at, cc.updated_at,
                   (SELECT COUNT(*) FROM cuerpo_carrito_compras ccc
                    WHERE ccc.carrito_compra_id = cc.id
                      AND ccc.estado = 1
                      AND COALESCE(ccc.es_regalia, 0) = 0) AS cantidad_lineas,
                   (SELECT COALESCE(SUM(ccc.cantidad), 0)
                    FROM cuerpo_carrito_compras ccc
                    WHERE ccc.carrito_compra_id = cc.id
                      AND ccc.estado = 1
                      AND COALESCE(ccc.es_regalia, 0) = 0) AS cantidad_articulos,
                   (SELECT COUNT(*) FROM carrito_compra_regalias cr
                    WHERE cr.carrito_compra_id = cc.id) AS cantidad_regalias
            FROM carrito_compras cc
            INNER JOIN clientes c ON c.id = cc.cliente_id
            WHERE c.slug = ?
              AND cc.estado = 'ABIERTO'
              AND cc.tipo = 'CONTADO'
              AND cc.estado_visible = 1
            ORDER BY cc.updated_at DESC, cc.id DESC
            LIMIT 100
        `, [clienteSlug]);

        return {
            success: true,
            message: 'Carritos consultados correctamente.',
            data: filas.map((fila: any) => ({
                ...fila,
                subtotal: Number(fila.subtotal),
                descuento: Number(fila.descuento),
                total_neto: Number(fila.total_neto),
                cantidad_lineas: Number(fila.cantidad_lineas),
                cantidad_articulos: Number(fila.cantidad_articulos),
                cantidad_regalias: Number(fila.cantidad_regalias),
            })),
        };
    }

    async obtenerDetalle(carritoSlug: string) {
        if (!carritoSlug?.trim()) throw new BadRequestException('Se requiere el carrito.');

        const carritos = await this.dataSource.query(`
            SELECT cc.id, cc.slug, cc.nombre, cc.estado, cc.tipo,
                   cc.sucursal_id,
                   cc.subtotal, cc.descuento, cc.total_neto,
                   cc.created_at, cc.updated_at,
                   c.slug AS cliente_slug, c.nombres, c.apellidos
            FROM carrito_compras cc
            INNER JOIN clientes c ON c.id = cc.cliente_id
            WHERE cc.slug = ?
              AND cc.estado = 'ABIERTO'
              AND cc.tipo = 'CONTADO'
              AND cc.estado_visible = 1
            LIMIT 1
        `, [carritoSlug]);

        if (!carritos.length) throw new NotFoundException('No se encontró un carrito abierto.');
        const carrito = carritos[0];

        const filas = await this.dataSource.query(`
            SELECT ccc.id AS linea_id, ccc.tk2_precio_id,
                   ccc.tk2_precio_plan_id,
                   a.slug AS articulo_slug, a.nombre_articulo,
                   a.modelo, a.codigo_sistema, a.is_motocicleta,
                   ccc.cantidad, ccc.precio_contado, ccc.precio_final,
                   ccc.subtotal, ccc.descuento_monto,
                   ccc.descuento_porcentaje, ccc.total,
                   ccc.tipo_linea, ccc.comentario,
                   ra.serie_fabricante,
                   m.motor AS moto_motor, m.chasis AS moto_chasis,
                   m.cilindraje AS moto_cilindraje, m.anio AS moto_anio,
                   m.color AS moto_color, m.placa AS moto_placa,
                   m.facturado AS moto_facturado
            FROM cuerpo_carrito_compras ccc
            INNER JOIN articulos a ON a.id = ccc.articulo_id
            LEFT JOIN remision_articulos ra ON ra.id = ccc.remision_articulo_id
            LEFT JOIN motocicletas m ON m.remision_articulo_id = ra.id
            WHERE ccc.carrito_compra_id = ?
              AND ccc.estado = 1
              AND COALESCE(ccc.es_regalia, 0) = 0
            ORDER BY ccc.id ASC
        `, [carrito.id]);

        const articulos = filas.map((fila: any) => ({
            linea_id: Number(fila.linea_id),
            articulo_slug: fila.articulo_slug,
            nombre_articulo: fila.nombre_articulo,
            modelo: fila.modelo,
            codigo_sistema: fila.codigo_sistema,
            es_motocicleta: Number(fila.is_motocicleta) === 1,
            tk2_precio_id: fila.tk2_precio_id === null ? null : Number(fila.tk2_precio_id),
            tk2_precio_plan_id: fila.tk2_precio_plan_id === null ? null : Number(fila.tk2_precio_plan_id),
            cantidad: Number(fila.cantidad),
            precio_contado: Number(fila.precio_contado),
            precio_final: Number(fila.precio_final),
            subtotal: Number(fila.subtotal),
            descuento: Number(fila.descuento_monto),
            descuento_monto: Number(fila.descuento_monto),
            descuento_porcentaje: Number(fila.descuento_porcentaje),
            total: Number(fila.total),
            tipo_linea: fila.tipo_linea,
            comentario: fila.comentario,
            remision_articulo: fila.serie_fabricante !== null || fila.moto_chasis !== null ? {
                serie_fabricante: fila.serie_fabricante,
                motocicleta: fila.moto_chasis !== null ? {
                    motor: fila.moto_motor,
                    chasis: fila.moto_chasis,
                    cilindraje: fila.moto_cilindraje,
                    anio: fila.moto_anio,
                    color: fila.moto_color,
                    placa: fila.moto_placa,
                    facturado: fila.moto_facturado === null ? null : Number(fila.moto_facturado),
                } : null,
            } : null,
        }));

        const filasRegalias = await this.dataSource.query(`
            SELECT cr.cuerpo_carrito_compra_id AS linea_principal_id,
                   cr.cuerpo_carrito_regalia_id AS linea_regalia_id,
                   cr.user_id,
                   a.slug AS articulo_slug, a.nombre_articulo,
                   a.modelo, a.codigo_sistema,
                   ccc.cantidad, ccc.estado_regalia,
                   ccc.estado, cr.created_at, cr.updated_at
            FROM carrito_compra_regalias cr
            INNER JOIN cuerpo_carrito_compras ccc
                ON ccc.id = cr.cuerpo_carrito_regalia_id
               AND ccc.carrito_compra_id = cr.carrito_compra_id
            INNER JOIN articulos a ON a.id = ccc.articulo_id
            WHERE cr.carrito_compra_id = ?
            ORDER BY cr.id ASC
        `, [carrito.id]);

        const regalias = filasRegalias.map((fila: any) => ({
            linea_principal_id: Number(fila.linea_principal_id),
            linea_regalia_id: Number(fila.linea_regalia_id),
            articulo_slug: fila.articulo_slug,
            nombre_articulo: fila.nombre_articulo,
            modelo: fila.modelo,
            codigo_sistema: fila.codigo_sistema,
            cantidad: Number(fila.cantidad),
            estado_regalia: fila.estado_regalia,
            estado: Number(fila.estado),
            responsable: { user_id: fila.user_id },
            created_at: fila.created_at,
            updated_at: fila.updated_at,
        }));

        const articulosConRegalias = articulos.map((articulo: any) => ({
            ...articulo,
            regalias: regalias.filter((regalia: any) => regalia.linea_principal_id === articulo.linea_id),
        }));

        return {
            success: true,
            message: 'Detalle del carrito consultado correctamente.',
            data: {
                slug: carrito.slug,
                nombre: carrito.nombre,
                estado: carrito.estado,
                tipo: carrito.tipo,
                sucursal_id: carrito.sucursal_id === null ? null : Number(carrito.sucursal_id),
                cliente: {
                    slug: carrito.cliente_slug,
                    nombre_completo: [carrito.nombres, carrito.apellidos].filter(Boolean).join(' '),
                },
                subtotal: Number(carrito.subtotal),
                descuento: Number(carrito.descuento),
                total_neto: Number(carrito.total_neto),
                cantidad_lineas: articulosConRegalias.length,
                cantidad_articulos: articulosConRegalias.reduce((total: number, articulo: any) => total + articulo.cantidad, 0),
                articulos: articulosConRegalias,
                regalias,
            },
        };
    }
}

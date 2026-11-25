import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class CarritosConsultasService {
    constructor(private readonly dataSource: DataSource) {}

    async buscarAbiertos(clienteSlug: string, sucursalId: string) {
        if (!clienteSlug?.trim() || !sucursalId?.trim()) {
            throw new BadRequestException('Se requiere el cliente y la sucursal.');
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
            INNER JOIN clientes c ON c.id = cc.cliente_id
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

    async obtenerDetalle(carritoSlug: string, sucursalId: string, queryRunner?: QueryRunner) {
        if (!carritoSlug?.trim() || !sucursalId?.trim()) {
            throw new BadRequestException('Se requiere el carrito y la sucursal.');
        }

        const consultar = (sql: string, parametros: unknown[]) => {
            return queryRunner
                ? queryRunner.query(sql, parametros)
                : this.dataSource.query(sql, parametros);
        };

        // ==========================================
        // 1. CONSULTAR CARRITO
        // ==========================================

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
            INNER JOIN clientes c ON c.id = cc.cliente_id
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
            throw new NotFoundException('No se encontró un carrito abierto disponible.');
        }

        const carrito = carritos[0];

        // ==========================================
        // 2. ARTÍCULOS + PLAN + REMISIÓN + MOTOCICLETA
        // ==========================================

        const lineas = await consultar(
            `
            SELECT
                ccc.id AS linea_id,
                ccc.tk2_precio_id,
                ccc.tk2_precio_plan_id,

                pp.id AS plan_id,
                pp.nombre AS plan_nombre,
                pp.tipo_venta AS plan_tipo_venta,
                pp.tipo_calculo AS plan_tipo_calculo,
                pp.precio_final AS plan_precio_final,

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
                ccc.comentario,

                ccc.remision_articulo_id,

                ra.serie_fabricante,

                m.motor AS moto_motor,
                m.chasis AS moto_chasis,
                m.cilindraje AS moto_cilindraje,
                m.anio AS moto_anio,
                m.color AS moto_color,
                m.placa AS moto_placa,
                m.facturado AS moto_facturado

            FROM cuerpo_carrito_compras ccc

            INNER JOIN articulos a
                ON a.id = ccc.articulo_id

            LEFT JOIN tk2_precio_planes pp
                ON pp.id = ccc.tk2_precio_plan_id
               AND pp.tk2_precio_id = ccc.tk2_precio_id

            LEFT JOIN remision_articulos ra
                ON ra.id = ccc.remision_articulo_id

            LEFT JOIN motocicletas m
                ON m.remision_articulo_id = ra.id

            WHERE ccc.carrito_compra_id = ?
              AND ccc.estado = 1

            ORDER BY ccc.id ASC
            `,
            [carrito.id],
        );

        const articulos = lineas.map((linea: any) => {
            const esMotocicleta = Number(linea.is_motocicleta) === 1;
            const tieneRemision = linea.remision_articulo_id != null;
            const tieneMotocicleta = linea.moto_chasis != null;
            const tienePlan = linea.plan_id != null;

            return {
                linea_id: Number(linea.linea_id),
                articulo_slug: linea.articulo_slug,
                nombre_articulo: linea.nombre_articulo,
                modelo: linea.modelo,
                codigo_sistema: linea.codigo_sistema,

                es_motocicleta: esMotocicleta,

                tk2_precio_id: linea.tk2_precio_id == null
                    ? null
                    : Number(linea.tk2_precio_id),

                tk2_precio_plan_id: linea.tk2_precio_plan_id == null
                    ? null
                    : Number(linea.tk2_precio_plan_id),

                // Identificador compatible con guardar-contado.
                plan_slug: linea.tk2_precio_plan_id == null
                    ? null
                    : String(linea.tk2_precio_plan_id),

                // Información de la promoción vinculada.
                plan: tienePlan
                    ? {
                        slug: String(linea.plan_id),
                        nombre: linea.plan_nombre ?? null,
                        tipo_venta: linea.plan_tipo_venta ?? null,
                        tipo_calculo: linea.plan_tipo_calculo ?? null,
                        precio_final: Number(linea.plan_precio_final),
                    }
                    : null,

                // Importes originales almacenados en el carrito.
                cantidad: Number(linea.cantidad),
                precio_contado: Number(linea.precio_contado),
                precio_final: Number(linea.precio_final),
                subtotal: Number(linea.subtotal),
                descuento: Number(linea.descuento_monto),
                descuento_monto: Number(linea.descuento_monto),
                descuento_porcentaje: Number(linea.descuento_porcentaje),
                total: Number(linea.total),
                tipo_linea: linea.tipo_linea,
                comentario: linea.comentario,

                // Serie obligatoria para motocicletas.
                tiene_serie: esMotocicleta || tieneRemision,

                requiere_vinculacion: esMotocicleta && (!tieneRemision || !tieneMotocicleta),

                remision_articulo: tieneRemision
                    ? {
                        serie_fabricante: linea.serie_fabricante ?? null,

                        motocicleta: tieneMotocicleta
                            ? {
                                motor: linea.moto_motor,
                                chasis: linea.moto_chasis,
                                cilindraje: linea.moto_cilindraje,
                                anio: linea.moto_anio,
                                color: linea.moto_color,
                                placa: linea.moto_placa,
                                facturado: linea.moto_facturado == null
                                    ? null
                                    : Number(linea.moto_facturado),
                            }
                            : null,
                    }
                    : null,
            };
        });

        // ==========================================
        // 3. REGALÍAS DEL CARRITO
        // ==========================================

        const filasRegalias = await consultar(
            `
            SELECT
                cr.cuerpo_carrito_compra_id AS linea_principal_id,
                cr.cuerpo_carrito_regalia_id AS linea_regalia_id,

                a.slug AS articulo_slug,
                a.nombre_articulo,
                a.modelo,
                a.codigo_sistema,

                ccc.cantidad,
                ccc.precio_contado,
                ccc.precio_final,
                ccc.subtotal,
                ccc.descuento_monto,
                ccc.total,
                ccc.tipo_linea,
                ccc.estado

            FROM carrito_compra_regalias cr

            INNER JOIN cuerpo_carrito_compras ccc
                ON ccc.id = cr.cuerpo_carrito_regalia_id
               AND ccc.carrito_compra_id = cr.carrito_compra_id

            INNER JOIN articulos a
                ON a.id = ccc.articulo_id

            WHERE cr.carrito_compra_id = ?

            ORDER BY cr.id ASC
            `,
            [carrito.id],
        );

        const regalias = filasRegalias.map((fila: any) => ({
            linea_principal_id: Number(fila.linea_principal_id),
            linea_regalia_id: Number(fila.linea_regalia_id),

            articulo_slug: fila.articulo_slug,
            nombre_articulo: fila.nombre_articulo,
            modelo: fila.modelo,
            codigo_sistema: fila.codigo_sistema,

            cantidad: Number(fila.cantidad),
            precio_contado: Number(fila.precio_contado),
            precio_final: Number(fila.precio_final),
            subtotal: Number(fila.subtotal),
            descuento_monto: Number(fila.descuento_monto),
            total: Number(fila.total),
            tipo_linea: fila.tipo_linea,
            estado: Number(fila.estado),
        }));

        // ==========================================
        // 4. VINCULAR REGALÍAS A SUS ARTÍCULOS
        // ==========================================

        const articulosConRegalias = articulos.map((articulo: any) => ({
            ...articulo,
            regalias: regalias.filter((regalia: any) => regalia.linea_principal_id === articulo.linea_id),
        }));

        const cantidadArticulos = articulosConRegalias.reduce(
            (total: number, articulo: any) => total + articulo.cantidad,
            0,
        );

        // ==========================================
        // 5. RESPUESTA
        // ==========================================

        return {
            success: true,
            data: {
                slug: carrito.slug,
                nombre: carrito.nombre,
                estado: carrito.estado,
                tipo: carrito.tipo,

                cliente: {
                    slug: carrito.cliente_slug,
                    nombre_completo: [carrito.nombres, carrito.apellidos].filter(Boolean).join(' '),
                },

                subtotal: Number(carrito.subtotal),
                descuento: Number(carrito.descuento),
                total_neto: Number(carrito.total_neto),

                cantidad_lineas: articulosConRegalias.length,
                cantidad_articulos: cantidadArticulos,

                articulos: articulosConRegalias,
                regalias,
            },
        };
    }
}
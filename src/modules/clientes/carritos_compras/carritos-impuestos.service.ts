import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import {
    DataSource,
    EntityManager,
} from 'typeorm';

interface FilaCarrito {
    id: string | number;
    slug: string;
}

interface FilaImpuesto {
    linea_id: string | number;
    articulo_slug: string;
    articulo_nombre: string;
    cantidad: string | number;
    subtotal: string | number;
    descuento_monto: string | number;
    total: string | number;
    precio_contado: string | number;
    impuesto_id: string | number | null;
    impuesto_nombre: string | null;
    impuesto_porcentaje: string | number | null;
    impuesto_activo: string | number | null;
}

export interface ResultadoImpuestosCarrito {
    carrito_slug: string;
    moneda: 'HNL';
    cantidad_lineas: number;
    cantidad_articulos: number;
    subtotal: number;
    descuento: number;
    subtotal_neto: number;
    impuestos: number;
    total_factura: number;
    detalle_impuestos: Array<{
        nombre: string;
        porcentaje: number;
        base_gravada: number;
        impuesto: number;
    }>;
    articulos: Array<{
        articulo_slug: string;
        nombre: string;
        cantidad: number;
        subtotal: number;
        descuento: number;
        subtotal_neto: number;
        base_gravada: number;
        impuesto_nombre: string | null;
        impuesto_porcentaje: number;
        impuesto: number;
        total: number;
    }>;
}

@Injectable()
export class CarritosImpuestosService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    private dinero(valor: number): number {
        return Math.round(
            (valor + Number.EPSILON) * 100,
        ) / 100;
    }

    private numero(
        valor: string | number | null,
        campo: string,
    ): number {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            throw new BadRequestException(
                `El campo ${campo} contiene un valor inválido.`,
            );
        }

        return numero;
    }

    /**
     * Consulta pública para el módulo Caja.
     */
    async consultar(
        carritoSlug: string,
        sucursalId: string,
    ) {
        const data = await this.calcular(
            carritoSlug,
            sucursalId,
        );

        return {
            success: true,
            message: 'Impuestos calculados correctamente.',
            data,
        };
    }

    /**
     * Método reutilizable.
     *
     * Puede recibir un EntityManager existente
     * para ejecutarse dentro de la transacción
     * que posteriormente registre la factura.
     */
    async calcular(
        carritoSlug: string,
        sucursalId: string,
        manager: EntityManager = this.dataSource.manager,
    ): Promise<ResultadoImpuestosCarrito> {
        const carritos: FilaCarrito[] =
            await manager.query(
                `
                SELECT
                    id,
                    slug
                FROM carrito_compras
                WHERE slug = ?
                  AND sucursal_id = ?
                  AND tipo = 'CONTADO'
                  AND estado = 'ABIERTO'
                  AND estado_visible = 1
                LIMIT 1
                `,
                [carritoSlug, sucursalId],
            );

        if (!carritos.length) {
            throw new NotFoundException(
                'No se encontró un carrito de contado abierto.',
            );
        }

        const carrito = carritos[0];

        const filas: FilaImpuesto[] =
            await manager.query(
                `
                SELECT
                    ccc.id AS linea_id,
                    a.slug AS articulo_slug,
                    a.nombre_articulo AS articulo_nombre,

                    ccc.cantidad,
                    ccc.subtotal,
                    ccc.descuento_monto,
                    ccc.total,
                    ccc.precio_contado,

                    p.impuesto_id,

                    i.nombre AS impuesto_nombre,
                    i.porcentaje AS impuesto_porcentaje,
                    i.is_activo AS impuesto_activo

                FROM cuerpo_carrito_compras ccc

                INNER JOIN articulos a
                    ON a.id = ccc.articulo_id

                LEFT JOIN tk2_precios p
                    ON p.id = ccc.tk2_precio_id
                   AND p.articulo_id = ccc.articulo_id

                LEFT JOIN impuestos i
                    ON i.id = p.impuesto_id

                WHERE ccc.carrito_compra_id = ?
                  AND ccc.estado = 1

                ORDER BY ccc.id ASC
                `,
                [carrito.id],
            );

        if (!filas.length) {
            throw new BadRequestException(
                'El carrito no contiene artículos activos.',
            );
        }

        let subtotal = 0;
        let descuento = 0;
        let subtotalNeto = 0;
        let totalImpuestos = 0;
        let cantidadArticulos = 0;

        const articulos:
            ResultadoImpuestosCarrito['articulos'] = [];

        const gruposImpuestos = new Map<
            string,
            {
                nombre: string;
                porcentaje: number;
                base_gravada: number;
                impuesto: number;
            }
            >();

        for (const fila of filas) {
            const cantidad = this.numero(
                fila.cantidad,
                'cantidad',
            );

            const subtotalLinea = this.dinero(
                this.numero(fila.subtotal, 'subtotal'),
            );

            const descuentoLinea = this.dinero(
                this.numero(
                    fila.descuento_monto,
                    'descuento_monto',
                ),
            );

            const netoLinea = this.dinero(
                this.numero(fila.total, 'total'),
            );

            const precioContado = this.numero(
                fila.precio_contado,
                'precio_contado',
            );

            if (
                !Number.isSafeInteger(cantidad) ||
                cantidad <= 0 ||
                subtotalLinea < 0 ||
                descuentoLinea < 0 ||
                netoLinea < 0 ||
                precioContado < 0
            ) {
                throw new BadRequestException(
                    `Los importes del artículo ${fila.articulo_slug} no son válidos.`,
                );
            }

            if (
                Math.abs(
                    this.dinero(
                        subtotalLinea - descuentoLinea,
                    ) - netoLinea,
                ) > 0.01
            ) {
                throw new ConflictException(
                    `Los totales del artículo ${fila.articulo_slug} no coinciden.`,
                );
            }

            let porcentaje = 0;
            let nombreImpuesto: string | null = null;

            if (fila.impuesto_id !== null) {
                if (
                    fila.impuesto_porcentaje === null ||
                    fila.impuesto_activo === null
                ) {
                    throw new ConflictException(
                        `No se encontró la configuración de impuesto del artículo ${fila.articulo_slug}.`,
                    );
                }

                if (Number(fila.impuesto_activo) !== 1) {
                    throw new ConflictException(
                        `El impuesto del artículo ${fila.articulo_slug} está inactivo.`,
                    );
                }

                porcentaje = this.numero(
                    fila.impuesto_porcentaje,
                    'impuesto_porcentaje',
                );

                nombreImpuesto =
                    fila.impuesto_nombre ?? 'Impuesto';
            }

            if (porcentaje < 0 || porcentaje > 1) {
                throw new ConflictException(
                    `El porcentaje de impuesto del artículo ${fila.articulo_slug} es inválido.`,
                );
            }

            // En impuestos.porcentaje, 0.15 representa 15%.
            // El precio de contado y ccc.total YA incluyen el impuesto.
            // ccc.total contiene cantidad y descuentos aplicados.
            // El impuesto se DESGLOSA, nunca se suma al total del carrito.
            const impuestoLinea = this.dinero(
                netoLinea * porcentaje / (1 + porcentaje),
            );
            const baseGravada = this.dinero(netoLinea - impuestoLinea);
            const totalLinea = netoLinea;

            subtotal += subtotalLinea;
            descuento += descuentoLinea;
            subtotalNeto += netoLinea;
            totalImpuestos += impuestoLinea;
            cantidadArticulos += cantidad;

            articulos.push({
                articulo_slug: fila.articulo_slug,
                nombre: fila.articulo_nombre,
                cantidad,
                subtotal: subtotalLinea,
                descuento: descuentoLinea,
                subtotal_neto: netoLinea,
                base_gravada: baseGravada,
                impuesto_nombre: nombreImpuesto,
                impuesto_porcentaje: porcentaje,
                impuesto: impuestoLinea,
                total: totalLinea,
            });

            if (porcentaje > 0 && nombreImpuesto) {
                const clave = String(
                    fila.impuesto_id,
                );

                const grupo = gruposImpuestos.get(clave);

                if (grupo) {
                    grupo.base_gravada = this.dinero(
                        grupo.base_gravada + baseGravada,
                    );

                    grupo.impuesto = this.dinero(
                        grupo.impuesto + impuestoLinea,
                    );
                } else {
                    gruposImpuestos.set(clave, {
                        nombre: nombreImpuesto,
                        porcentaje,
                        base_gravada: baseGravada,
                        impuesto: impuestoLinea,
                    });
                }
            }
        }

        subtotal = this.dinero(subtotal);
        descuento = this.dinero(descuento);
        subtotalNeto = this.dinero(subtotalNeto);
        totalImpuestos = this.dinero(totalImpuestos);

        return {
            carrito_slug: String(carrito.slug),
            moneda: 'HNL',
            cantidad_lineas: filas.length,
            cantidad_articulos: cantidadArticulos,
            subtotal,
            descuento,
            subtotal_neto: subtotalNeto,
            impuestos: totalImpuestos,
            total_factura: subtotalNeto,
            detalle_impuestos: Array.from(
                gruposImpuestos.values(),
            ),
            articulos,
        };
    }
}


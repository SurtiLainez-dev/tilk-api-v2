import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AgregarArticuloCarritoDto } from './dto/gregar-articulo-carrito.dto.js';

type Fila = Record<string, any>;

@Injectable()
export class CarritosArticulosService {
    constructor(private readonly dataSource: DataSource) {}

    private numero(valor: unknown): number {
        const resultado = Number(valor);
        return Number.isFinite(resultado) ? resultado : 0;
    }

    private dinero(valor: unknown): number {
        return Math.round((this.numero(valor) + Number.EPSILON) * 100) / 100;
    }

    private async obtenerCarritoBloqueado(manager: EntityManager, slug: string, sucursalId?: string): Promise<Fila> {
        if (!slug?.trim()) {
            throw new BadRequestException('Se requiere el slug del carrito.');
        }

        const parametros: unknown[] = [slug];
        let filtroSucursal = '';

        if (sucursalId) {
            filtroSucursal = 'AND sucursal_id = ?';
            parametros.push(sucursalId);
        }

        const filas: Fila[] = await manager.query(`
            SELECT *
            FROM carrito_compras
            WHERE slug = ?
              ${filtroSucursal}
            LIMIT 1
            FOR UPDATE
        `, parametros);

        const carrito = filas[0];

        if (!carrito) {
            throw new NotFoundException('No se encontró el carrito solicitado.');
        }

        if (carrito.estado !== 'ABIERTO') {
            throw new ConflictException('El carrito no está abierto y no puede modificarse.');
        }

        if (this.numero(carrito.estado_visible) !== 1) {
            throw new ConflictException('El carrito no está disponible para modificaciones.');
        }

        return carrito;
    }

    private async obtenerArticulo(manager: EntityManager, slug: string, validarMotocicleta = true): Promise<Fila> {
        if (!slug?.trim()) {
            throw new BadRequestException('Se requiere el slug del artículo.');
        }

        const filas: Fila[] = await manager.query(`
            SELECT
                id,
                slug,
                nombre_articulo,
                modelo,
                codigo_sistema,
                is_motocicleta
            FROM articulos
            WHERE slug = ?
            LIMIT 1
        `, [slug]);

        const articulo = filas[0];

        if (!articulo) {
            throw new NotFoundException('El artículo solicitado no existe.');
        }

        return articulo;
    }

    private async obtenerPrecio(manager: EntityManager, precioId: string | number, articuloId: string | number): Promise<Fila> {
        if (!/^[1-9]\d*$/.test(String(precioId))) {
            throw new BadRequestException('El identificador del precio no es válido.');
        }

        const filas: Fila[] = await manager.query(`
            SELECT *
            FROM tk2_precios
            WHERE id = ?
              AND articulo_id = ?
              AND estado = 1
            LIMIT 1
        `, [precioId, articuloId]);

        const precio = filas[0];

        if (!precio) {
            throw new NotFoundException('El precio base no existe, está inactivo o no pertenece al artículo.');
        }

        if (this.dinero(precio.precio_contado) <= 0) {
            throw new BadRequestException('El artículo no tiene un precio de contado válido.');
        }

        if (!Number.isFinite(Number(precio.precio_costo)) || Number(precio.precio_costo) < 0) {
            throw new BadRequestException('El precio de costo del artículo no es válido.');
        }

        return precio;
    }

    private async obtenerLineasBloqueadas(manager: EntityManager, carritoId: string | number, articuloId: string | number): Promise<Fila[]> {
        return manager.query(`
            SELECT *
            FROM cuerpo_carrito_compras
            WHERE carrito_compra_id = ?
              AND articulo_id = ?
            ORDER BY id ASC
            FOR UPDATE
        `, [carritoId, articuloId]);
    }

    private async actualizarTotalesCarrito(manager: EntityManager, carritoId: string | number): Promise<void> {
        const filas: Fila[] = await manager.query(`
            SELECT
                COALESCE(ROUND(SUM(subtotal), 2), 0) AS subtotal,
                COALESCE(ROUND(SUM(descuento_monto), 2), 0) AS descuento,
                COALESCE(ROUND(SUM(total), 2), 0) AS total_neto
            FROM cuerpo_carrito_compras
            WHERE carrito_compra_id = ?
              AND estado = 1
        `, [carritoId]);

        const totales = filas[0];

        await manager.query(`
            UPDATE carrito_compras
            SET
                subtotal = ?,
                descuento = ?,
                total_neto = ?,
                updated_at = ?
            WHERE id = ?
        `, [
            this.dinero(totales.subtotal),
            this.dinero(totales.descuento),
            this.dinero(totales.total_neto),
            new Date(),
            carritoId,
        ]);
    }

    private async obtenerCarritoActualizado(manager: EntityManager, carritoId: string | number): Promise<object> {
        const carritos: Fila[] = await manager.query(`
            SELECT
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
            WHERE cc.id = ?
            LIMIT 1
        `, [carritoId]);

        const carrito = carritos[0];

        if (!carrito) {
            throw new NotFoundException('No se encontró el carrito actualizado.');
        }

        const lineas: Fila[] = await manager.query(`
            SELECT
                ccc.tk2_precio_id,
                ccc.tk2_precio_plan_id,
                ccc.cantidad,
                ccc.precio_contado,
                ccc.precio_final,
                ccc.subtotal,
                ccc.descuento_monto,
                ccc.descuento_porcentaje,
                ccc.total,
                ccc.tipo_linea,
                ccc.comentario,
                a.slug AS articulo_slug,
                a.nombre_articulo,
                a.modelo,
                a.codigo_sistema,
                a.is_motocicleta
            FROM cuerpo_carrito_compras ccc
            INNER JOIN articulos a
                ON a.id = ccc.articulo_id
            WHERE ccc.carrito_compra_id = ?
              AND ccc.estado = 1
            ORDER BY ccc.id ASC
        `, [carritoId]);

        return {
            slug: carrito.slug,
            nombre: carrito.nombre,
            estado: carrito.estado,
            tipo: carrito.tipo,

            cliente: {
                slug: carrito.cliente_slug,
                nombre_completo: [carrito.nombres, carrito.apellidos].filter(Boolean).join(' '),
            },

            subtotal: this.dinero(carrito.subtotal),
            descuento: this.dinero(carrito.descuento),
            total_neto: this.dinero(carrito.total_neto),

            cantidad_articulos: lineas.reduce(
                (total, linea) => total + this.numero(linea.cantidad), 0,
            ),

            articulos: lineas.map((linea) => ({
                articulo_slug: linea.articulo_slug,
                tk2_precio_id: linea.tk2_precio_id === null ? null : String(linea.tk2_precio_id),
                tk2_precio_plan_id: linea.tk2_precio_plan_id === null ? null : String(linea.tk2_precio_plan_id),
                nombre_articulo: linea.nombre_articulo,
                modelo: linea.modelo,
                codigo_sistema: linea.codigo_sistema,
                es_motocicleta: this.numero(linea.is_motocicleta) === 1,
                cantidad: this.numero(linea.cantidad),
                precio_contado: this.dinero(linea.precio_contado),
                precio_final: this.dinero(linea.precio_final),
                subtotal: this.dinero(linea.subtotal),
                descuento: this.dinero(linea.descuento_monto),
                descuento_porcentaje: this.dinero(linea.descuento_porcentaje),
                total: this.dinero(linea.total),
                tipo_linea: linea.tipo_linea,
                comentario: linea.comentario,
            })),
        };
    }

    async agregarArticulo(carritoSlug: string, dto: AgregarArticuloCarritoDto, sucursalId?: string): Promise<object> {
        return this.dataSource.transaction(async (manager) => {
            const carrito = await this.obtenerCarritoBloqueado(manager, carritoSlug, sucursalId);

            if (carrito.tipo !== 'CONTADO') {
                throw new BadRequestException('Esta operación requiere un carrito de contado.');
            }

            const articulo = await this.obtenerArticulo(manager, dto.articulo_slug);
            const precio = await this.obtenerPrecio(manager, dto.tk2_precio_id, articulo.id);
            const lineas = await this.obtenerLineasBloqueadas(manager, carrito.id, articulo.id);

            const activas = lineas.filter((linea) => this.numero(linea.estado) === 1);

            const precioDiferente = activas.some(
                (linea) => String(linea.tk2_precio_id) !== String(precio.id),
            );

            if (precioDiferente) {
                throw new ConflictException('No se puede aumentar la cantidad porque este artículo ya existe con un precio base diferente.');
            }

            const lineaConOtraConfiguracion = activas.some(
                (linea) =>
                    linea.tk2_precio_plan_id !== null ||
                    linea.tipo_linea !== 'NORMAL' ||
                    this.numero(linea.es_regalia) !== 0,
            );

            if (lineaConOtraConfiguracion) {
                throw new ConflictException('El artículo ya tiene un plan o configuración diferente en el carrito.');
            }

            if (activas.length > 1) {
                throw new ConflictException('El artículo tiene varias líneas activas y debe revisarse antes de aumentar la cantidad.');
            }

            const lineaExistente = activas[0] ?? null;
            const precioContado = this.dinero(precio.precio_contado);
            const precioCosto = this.dinero(precio.precio_costo);

            const detallePrecio = JSON.stringify({
                precio_costo: precioCosto,
                precio_contado: precioContado,
            });

            const ahora = new Date();

            if (lineaExistente) {
                const cantidadNueva = this.numero(lineaExistente.cantidad) + 1;

                if (!Number.isFinite(cantidadNueva) || cantidadNueva <= 0 || cantidadNueva > 9999999) {
                    throw new BadRequestException('La cantidad resultante no es válida.');
                }

                const subtotal = this.dinero(cantidadNueva * precioContado);

                await manager.query(`
                    UPDATE cuerpo_carrito_compras
                    SET
                        cantidad = ?,
                        precio_costo = ?,
                        precio_contado = ?,
                        precio_final = ?,
                        subtotal = ?,
                        descuento_monto = 0,
                        descuento_porcentaje = 0,
                        total = ?,
                        detalle_precio = ?,
                        detalle_plan = NULL,
                        es_regalia = 0,
                        estado_regalia = 'NO_APLICA',
                        tipo_linea = 'NORMAL',
                        unidad_numero = NULL,
                        estado_credito = 'NO_APLICA',
                        frecuencia_pago_aplicada = NULL,
                        plazo_meses_aplicado = 0,
                        cantidad_cuotas_aplicada = 0,
                        tasa_interes_aplicada = 0,
                        prima_aplicada = 0,
                        monto_financiado = 0,
                        cuota_calculada = 0,
                        total_credito_linea = 0,
                        preview_cuotas = NULL,
                        updated_at = ?
                    WHERE id = ?
                      AND carrito_compra_id = ?
                      AND estado = 1
                `, [
                    cantidadNueva,
                    precioCosto,
                    precioContado,
                    precioContado,
                    subtotal,
                    subtotal,
                    detallePrecio,
                    ahora,
                    lineaExistente.id,
                    carrito.id,
                ]);
            } else {
                const lineaInactiva = lineas.find(
                    (linea) =>
                        this.numero(linea.estado) === 0 &&
                        String(linea.tk2_precio_id) === String(precio.id) &&
                        linea.tk2_precio_plan_id === null &&
                        linea.tipo_linea === 'NORMAL',
                );

                if (lineaInactiva) {
                    await manager.query(`
                        UPDATE cuerpo_carrito_compras
                        SET
                            cantidad = 1,
                            precio_costo = ?,
                            precio_contado = ?,
                            precio_final = ?,
                            subtotal = ?,
                            descuento_monto = 0,
                            descuento_porcentaje = 0,
                            total = ?,
                            detalle_precio = ?,
                            detalle_plan = NULL,
                            es_regalia = 0,
                            estado_regalia = 'NO_APLICA',
                            tipo_linea = 'NORMAL',
                            unidad_numero = NULL,
                            estado_credito = 'NO_APLICA',
                            frecuencia_pago_aplicada = NULL,
                            plazo_meses_aplicado = 0,
                            cantidad_cuotas_aplicada = 0,
                            tasa_interes_aplicada = 0,
                            prima_aplicada = 0,
                            monto_financiado = 0,
                            cuota_calculada = 0,
                            total_credito_linea = 0,
                            preview_cuotas = NULL,
                            comentario = NULL,
                            estado = 1,
                            updated_at = ?
                        WHERE id = ?
                          AND carrito_compra_id = ?
                    `, [
                        precioCosto,
                        precioContado,
                        precioContado,
                        precioContado,
                        precioContado,
                        detallePrecio,
                        ahora,
                        lineaInactiva.id,
                        carrito.id,
                    ]);
                } else {
                    await manager.query(`
                        INSERT INTO cuerpo_carrito_compras (
                            carrito_compra_id,
                            articulo_id,
                            tk2_precio_id,
                            tk2_precio_plan_id,
                            cantidad,
                            precio_costo,
                            precio_contado,
                            precio_final,
                            subtotal,
                            descuento_monto,
                            descuento_porcentaje,
                            total,
                            detalle_precio,
                            detalle_plan,
                            es_regalia,
                            estado_regalia,
                            tipo_linea,
                            unidad_numero,
                            estado_credito,
                            frecuencia_pago_aplicada,
                            plazo_meses_aplicado,
                            cantidad_cuotas_aplicada,
                            tasa_interes_aplicada,
                            prima_aplicada,
                            monto_financiado,
                            cuota_calculada,
                            total_credito_linea,
                            preview_cuotas,
                            comentario,
                            estado,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            ?, ?, ?, NULL,
                            1, ?, ?, ?, ?,
                            0, 0, ?,
                            ?, NULL,
                            0, 'NO_APLICA',
                            'NORMAL', NULL,
                            'NO_APLICA', NULL,
                            0, 0, 0, 0,
                            0, 0, 0,
                            NULL, NULL,
                            1,
                            ?, ?
                        )
                    `, [
                        carrito.id,
                        articulo.id,
                        precio.id,
                        precioCosto,
                        precioContado,
                        precioContado,
                        precioContado,
                        precioContado,
                        detallePrecio,
                        ahora,
                        ahora,
                    ]);
                }
            }

            await this.actualizarTotalesCarrito(manager, carrito.id);

            return {
                success: true,
                message: 'Artículo agregado correctamente.',
                data: await this.obtenerCarritoActualizado(manager, carrito.id),
            };
        });
    }

    async eliminarArticulo(carritoSlug: string, articuloSlug: string, precioId: string | number, sucursalId?: string): Promise<object> {
        if (!/^[1-9]\d*$/.test(String(precioId))) {
            throw new BadRequestException('El identificador del precio no es válido.');
        }

        return this.dataSource.transaction(async (manager) => {
            const carrito = await this.obtenerCarritoBloqueado(manager, carritoSlug, sucursalId);

            if (carrito.tipo !== 'CONTADO') {
                throw new BadRequestException('Esta operación requiere un carrito de contado.');
            }

            const articulo = await this.obtenerArticulo(manager, articuloSlug, false);

            const lineas: Fila[] = await manager.query(`
                SELECT id
                FROM cuerpo_carrito_compras
                WHERE carrito_compra_id = ?
                  AND articulo_id = ?
                  AND tk2_precio_id = ?
                  AND tk2_precio_plan_id IS NULL
                  AND estado = 1
                FOR UPDATE
            `, [carrito.id, articulo.id, precioId]);

            if (!lineas.length) {
                throw new NotFoundException('No existe una línea activa con ese artículo y precio base.');
            }

            if (lineas.length > 1) {
                throw new ConflictException('Existen varias líneas con el mismo artículo y precio. No se puede determinar cuál eliminar.');
            }

            await manager.query(`
                UPDATE cuerpo_carrito_compras
                SET
                    estado = 0,
                    updated_at = ?
                WHERE id = ?
                  AND carrito_compra_id = ?
                  AND estado = 1
            `, [new Date(), lineas[0].id, carrito.id]);

            await this.actualizarTotalesCarrito(manager, carrito.id);

            return {
                success: true,
                message: 'Artículo eliminado correctamente.',
                data: await this.obtenerCarritoActualizado(manager, carrito.id),
            };
        });
    }
}
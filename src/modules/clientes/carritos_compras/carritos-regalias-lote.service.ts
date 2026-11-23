
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface CambioRegaliaLote {
    linea_regalia_id?: number;
    linea_principal_id?: number;
    articulo_slug?: string;
    cantidad: number;
}

@Injectable()
export class CarritosRegaliasLoteService {
    constructor(private readonly dataSource: DataSource) {}

    async guardar(carritoSlug: string, cambios: CambioRegaliaLote[], userId: string) {
        if (!carritoSlug?.trim()) throw new BadRequestException('Se requiere el carrito.');
        if (!userId?.trim()) throw new BadRequestException('Se requiere el usuario responsable.');
        if (!Array.isArray(cambios) || !cambios.length) throw new BadRequestException('No hay regalías para guardar.');
        if (cambios.length > 100) throw new BadRequestException('Demasiadas regalías en una solicitud.');

        const runner = this.dataSource.createQueryRunner();
        await runner.connect();

        try {
            await runner.startTransaction();

            const carritos = await runner.query(`
                SELECT id, sucursal_id
                FROM carrito_compras
                WHERE slug = ?
                  AND estado = 'ABIERTO'
                  AND tipo = 'CONTADO'
                  AND estado_visible = 1
                LIMIT 1
                FOR UPDATE
            `, [carritoSlug]);

            if (!carritos.length) throw new NotFoundException('Carrito abierto no encontrado.');

            const carritoId = String(carritos[0].id);
            const sucursalId = String(carritos[0].sucursal_id);
            const modificados = new Set<number>();
            const nuevos = new Set<string>();
            const requeridos = new Map<string, number>();

            // Bloquear las existencias de la sucursal durante la validación.
            const stockFilas = await runner.query(`
                SELECT sa.articulo_id, sa.stock_actual
                FROM stock_articulos sa
                WHERE sa.sucursal_id = ?
                ORDER BY sa.articulo_id, sa.id
                FOR UPDATE
            `, [sucursalId]);

            const stockDisponible = new Map<string, number>();

            for (const fila of stockFilas) {
                const id = String(fila.articulo_id);
                stockDisponible.set(id, (stockDisponible.get(id) ?? 0) + Number(fila.stock_actual));
            }

            // Contar las regalías activas existentes para no exceder el stock.
            const existentes = await runner.query(`
                SELECT ccc.id, ccc.articulo_id, ccc.cantidad,
                       ccc.estado_regalia
                FROM carrito_compra_regalias cr
                INNER JOIN cuerpo_carrito_compras ccc
                    ON ccc.id = cr.cuerpo_carrito_regalia_id
                WHERE cr.carrito_compra_id = ?
                  AND ccc.carrito_compra_id = ?
                  AND ccc.estado = 1
                  AND ccc.es_regalia = 1
                FOR UPDATE
            `, [carritoId, carritoId]);

            const existentesPorId = new Map<string, any>();

            for (const fila of existentes) {
                existentesPorId.set(String(fila.id), fila);
                if (fila.estado_regalia === 'RECHAZADA') continue;

                const id = String(fila.articulo_id);
                requeridos.set(id, (requeridos.get(id) ?? 0) + Number(fila.cantidad));
            }

            // Validar y preparar todos los cambios antes de escribir.
            const operaciones: Array<{
                tipo: 'ACTUALIZAR' | 'AGREGAR';
                lineaRegaliaId?: string;
                lineaPrincipalId?: string;
                articuloId: string;
                cantidad: number;
            }> = [];

            for (const cambio of cambios) {
                const cantidad = Number(cambio?.cantidad);

                if (!Number.isInteger(cantidad) || cantidad < 0) {
                    throw new BadRequestException('La cantidad debe ser un entero no negativo.');
                }

                if (cambio.linea_regalia_id != null) {
                    const id = Number(cambio.linea_regalia_id);

                    if (!Number.isSafeInteger(id) || id <= 0 || modificados.has(id)) {
                        throw new BadRequestException('Regalía repetida o inválida.');
                    }

                    modificados.add(id);

                    const anterior = existentesPorId.get(String(id));

                    if (!anterior) {
                        throw new NotFoundException('La regalía no pertenece al carrito o no está activa.');
                    }

                    if (anterior.estado_regalia === 'APROBADA') {
                        throw new ConflictException('No se puede modificar una regalía aprobada.');
                    }

                    const articuloId = String(anterior.articulo_id);

                    if (anterior.estado_regalia !== 'RECHAZADA') {
                        requeridos.set(
                            articuloId,
                            (requeridos.get(articuloId) ?? 0) - Number(anterior.cantidad),
                        );
                    }

                    // Una regalía rechazada no se reactiva automáticamente.
                    if (anterior.estado_regalia === 'RECHAZADA' && cantidad > 0) {
                        throw new ConflictException('No se puede reactivar una regalía rechazada.');
                    }

                    if (anterior.estado_regalia !== 'RECHAZADA') {
                        requeridos.set(articuloId, (requeridos.get(articuloId) ?? 0) + cantidad);
                    }

                    operaciones.push({
                        tipo: 'ACTUALIZAR',
                        lineaRegaliaId: String(id),
                        articuloId,
                        cantidad,
                    });

                    continue;
                }

                const principal = Number(cambio.linea_principal_id);
                const articuloSlug = cambio.articulo_slug?.trim();

                if (!Number.isSafeInteger(principal) || principal <= 0 || !articuloSlug) {
                    throw new BadRequestException('Falta el artículo principal o el slug de la regalía.');
                }

                if (cantidad === 0) continue;

                const principales = await runner.query(`
                    SELECT id
                    FROM cuerpo_carrito_compras
                    WHERE id = ?
                      AND carrito_compra_id = ?
                      AND estado = 1
                      AND COALESCE(es_regalia, 0) = 0
                    LIMIT 1
                    FOR UPDATE
                `, [principal, carritoId]);

                if (!principales.length) {
                    throw new NotFoundException('El artículo principal no pertenece al carrito.');
                }

                const articulos = await runner.query(`
                    SELECT id
                    FROM articulos
                    WHERE slug = ?
                    LIMIT 1
                `, [articuloSlug]);

                if (!articulos.length) {
                    throw new NotFoundException('Artículo de regalía no encontrado.');
                }

                const articuloId = String(articulos[0].id);
                const clave = `${principal}:${articuloId}`;

                if (nuevos.has(clave)) {
                    throw new BadRequestException('La misma regalía aparece repetida para el artículo principal.');
                }

                nuevos.add(clave);

                const duplicados = await runner.query(`
                    SELECT cr.id
                    FROM carrito_compra_regalias cr
                    INNER JOIN cuerpo_carrito_compras ccc
                        ON ccc.id = cr.cuerpo_carrito_regalia_id
                    WHERE cr.carrito_compra_id = ?
                      AND cr.cuerpo_carrito_compra_id = ?
                      AND ccc.articulo_id = ?
                      AND ccc.estado = 1
                    LIMIT 1
                `, [carritoId, principal, articuloId]);

                if (duplicados.length) {
                    throw new ConflictException(
                        'Esta regalía ya existe para el artículo principal. Actualiza su cantidad.',
                    );
                }

                requeridos.set(articuloId, (requeridos.get(articuloId) ?? 0) + cantidad);

                operaciones.push({
                    tipo: 'AGREGAR',
                    lineaPrincipalId: String(principal),
                    articuloId,
                    cantidad,
                });
            }

            // Validación acumulada de stock.
            for (const [articuloId, cantidad] of requeridos) {
                if (cantidad <= 0) continue;

                const disponible = stockDisponible.get(articuloId) ?? 0;

                if (cantidad > disponible) {
                    throw new BadRequestException(
                        `Existencias insuficientes para la regalía. Artículo ID ${articuloId}: disponibles ${disponible}, requeridas ${cantidad}.`,
                    );
                }
            }

            let agregadas = 0;
            let actualizadas = 0;

            for (const operacion of operaciones) {
                if (operacion.tipo === 'ACTUALIZAR') {
                    await runner.query(`
                        UPDATE cuerpo_carrito_compras
                        SET cantidad = ?, updated_at = NOW()
                        WHERE id = ?
                          AND carrito_compra_id = ?
                          AND es_regalia = 1
                    `, [operacion.cantidad, operacion.lineaRegaliaId, carritoId]);

                    await runner.query(`
                        UPDATE carrito_compra_regalias
                        SET user_id = ?, updated_at = NOW()
                        WHERE carrito_compra_id = ?
                          AND cuerpo_carrito_regalia_id = ?
                    `, [userId, carritoId, operacion.lineaRegaliaId]);

                    actualizadas++;
                    continue;
                }

                const insertado = await runner.query(`
                    INSERT INTO cuerpo_carrito_compras (
                        carrito_compra_id,
                        articulo_id,
                        cantidad,
                        precio_costo,
                        precio_contado,
                        precio_final,
                        subtotal,
                        descuento_monto,
                        descuento_porcentaje,
                        total,
                        es_regalia,
                        estado_regalia,
                        tipo_linea,
                        estado,
                        user_id,
                        created_at,
                        updated_at
                    ) VALUES (
                        ?, ?, ?,
                        0, 0, 0, 0, 0, 0, 0,
                        1, 'PENDIENTE_APROBACION',
                        'REGALIA', 1, ?,
                        NOW(), NOW()
                    )
                `, [carritoId, operacion.articuloId, operacion.cantidad, userId]);

                const lineaRegaliaId = String(insertado.insertId);

                await runner.query(`
                    INSERT INTO carrito_compra_regalias (
                        carrito_compra_id,
                        cuerpo_carrito_compra_id,
                        cuerpo_carrito_regalia_id,
                        user_id,
                        created_at,
                        updated_at
                    ) VALUES (?, ?, ?, ?, NOW(), NOW())
                `, [
                    carritoId,
                    operacion.lineaPrincipalId,
                    lineaRegaliaId,
                    userId,
                ]);

                agregadas++;
            }

            await runner.commitTransaction();

            return {
                success: true,
                message: 'Regalías guardadas correctamente.',
                data: {
                    carrito_slug: carritoSlug,
                    cambios_aplicados: operaciones.length,
                    regalias_agregadas: agregadas,
                    regalias_actualizadas: actualizadas,
                },
            };
        } catch (error) {
            if (runner.isTransactionActive) await runner.rollbackTransaction();
            throw error;
        } finally {
            await runner.release();
        }
    }
}

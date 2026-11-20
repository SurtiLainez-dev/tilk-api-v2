
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

import { GuardarCarritoContadoDto } from './dto/guardar-carrito-contado.dto.js';
import { CarritosConsultasService } from './carritos-consultas.service.js';

interface LineaNormalizada {
    slug: string;
    precioId: string;
    planSlug: string | null;
    cantidad: number;
}

interface LineaCalculada {
    articuloId: string;
    precioId: string;
    planId: string | null;
    nombrePlan: string | null;
    cantidad: number;
    precioContado: number;
    precioFinal: number;
    subtotal: number;
    descuento: number;
    descuentoPorcentaje: number;
    total: number;
}

interface LineaExistente {
    id: string | number;
    articulo_id: string | number;
    estado: number;
}

interface PlanExistente {
    id: string | number;
    cuerpo_carrito_compra_id: string | number;
    estado: number;
}

@Injectable()
export class CarritosGuardarService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly consultas: CarritosConsultasService,
    ) {}

    private dinero(valor: number): number {
        return Math.round(
            (valor + Number.EPSILON) * 100,
        ) / 100;
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
                // Un JSON inválido no autoriza ninguna sucursal.
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

    private normalizarLineas(
        dto: GuardarCarritoContadoDto,
    ): LineaNormalizada[] {
        if (!dto.articulos?.length) {
            throw new BadRequestException(
                'El carrito debe contener al menos un artículo.',
            );
        }

        const cantidades = new Map<string, LineaNormalizada>();

        for (const linea of dto.articulos) {
            const slug = String(linea.articulo_slug ?? '').trim();
            const precioId = String(linea.tk2_precio_id ?? '').trim();
            const planSlug = linea.plan_slug
                ? String(linea.plan_slug).trim()
                : null;
            const cantidad = Number(linea.cantidad);

            if (!slug) {
                throw new BadRequestException(
                    'El artículo no tiene un identificador válido.',
                );
            }

            if (!/^[1-9]\d*$/.test(precioId)) {
                throw new BadRequestException(
                    `El precio del artículo ${slug} no es válido.`,
                );
            }

            if (
                planSlug &&
                !/^[1-9]\d*$/.test(planSlug)
            ) {
                throw new BadRequestException(
                    `El plan del artículo ${slug} no es válido.`,
                );
            }

            if (
                !Number.isSafeInteger(cantidad) ||
                cantidad < 1 ||
                cantidad > 100000
            ) {
                throw new BadRequestException(
                    `La cantidad del artículo ${slug} no es válida.`,
                );
            }

            const existente = cantidades.get(slug);

            if (existente) {
                if (
                    existente.precioId !== precioId ||
                    existente.planSlug !== planSlug
                ) {
                    throw new BadRequestException(
                        `El artículo ${slug} tiene precios o promociones diferentes.`,
                    );
                }

                existente.cantidad += cantidad;

                if (existente.cantidad > 100000) {
                    throw new BadRequestException(
                        `La cantidad del artículo ${slug} supera el máximo permitido.`,
                    );
                }
            } else {
                cantidades.set(slug, {
                    slug,
                    precioId,
                    planSlug,
                    cantidad,
                });
            }
        }

        return Array.from(cantidades.values());
    }

    private async calcularLinea(
        manager: EntityManager,
        linea: LineaNormalizada,
        sucursalId: string,
    ): Promise<LineaCalculada> {
        const articulos = await manager.query(
            `
            SELECT
                id,
                is_motocicleta
            FROM articulos
            WHERE slug = ?
            LIMIT 1
            `,
            [linea.slug],
        );

        if (!articulos.length) {
            throw new NotFoundException(
                `No existe el artículo ${linea.slug}.`,
            );
        }

        const articulo = articulos[0];
        const articuloId = String(articulo.id);

        if (Number(articulo.is_motocicleta) === 1) {
            throw new BadRequestException(
                'Las motocicletas no están habilitadas para esta venta.',
            );
        }

        const precios = await manager.query(
            `
            SELECT
                id,
                precio_contado
            FROM tk2_precios
            WHERE id = ?
              AND articulo_id = ?
              AND estado = 1
            LIMIT 1
            `,
            [linea.precioId, articuloId],
        );

        if (!precios.length) {
            throw new BadRequestException(
                `El artículo ${linea.slug} no tiene el precio solicitado activo.`,
            );
        }

        const precioContado = Number(
            precios[0].precio_contado,
        );

        if (
            !Number.isFinite(precioContado) ||
            precioContado < 0
        ) {
            throw new BadRequestException(
                `El precio del artículo ${linea.slug} no es válido.`,
            );
        }

        // Bloqueamos las filas de stock durante la transacción.
        const stock = await manager.query(
            `
            SELECT
                id,
                stock_actual
            FROM stock_articulos
            WHERE sucursal_id = ?
              AND articulo_id = ?
            FOR UPDATE
            `,
            [sucursalId, articuloId],
        );

        const disponible = stock.reduce(
            (
                total: number,
                fila: { stock_actual: string | number },
            ) => {
                const cantidad = Number(fila.stock_actual);

                return total + (
                    Number.isFinite(cantidad)
                        ? Math.max(0, cantidad)
                        : 0
                );
            },
            0,
        );

        if (linea.cantidad > disponible) {
            throw new ConflictException(
                `Stock insuficiente para ${linea.slug}. ` +
                `Disponible: ${disponible}. ` +
                `Solicitado: ${linea.cantidad}.`,
            );
        }

        let planId: string | null = null;
        let nombrePlan: string | null = null;
        let precioFinal = precioContado;

        if (linea.planSlug) {
            const promociones = await manager.query(
                `
                SELECT
                    pp.id,
                    pp.nombre,
                    pp.precio_final,
                    pp.sucursales
                FROM tk2_precio_planes pp
                INNER JOIN tk2_precios p
                    ON p.id = pp.tk2_precio_id
                WHERE pp.id = ?
                  AND pp.tk2_precio_id = ?
                  AND p.articulo_id = ?
                  AND p.estado = 1
                  AND pp.estado = 1
                  AND pp.tipo_venta = 'CONTADO'
                  AND pp.tipo_calculo = 'PROMOCION_CONTADO'
                  AND (
                      pp.fecha_fin IS NULL
                      OR pp.fecha_fin > NOW()
                  )
                LIMIT 1
                `,
                [
                    linea.planSlug,
                    linea.precioId,
                    articuloId,
                ],
            );

            if (!promociones.length) {
                throw new BadRequestException(
                    `La promoción del artículo ${linea.slug} no está disponible.`,
                );
            }

            const promocion = promociones[0];

            const sucursales = this.normalizarSucursales(
                promocion.sucursales,
            );

            // NULL o [] permite todas las sucursales.
            if (
                sucursales !== null &&
                sucursales.length > 0 &&
                !sucursales.includes(String(sucursalId))
            ) {
                throw new BadRequestException(
                    `La promoción del artículo ${linea.slug} no está disponible en esta sucursal.`,
                );
            }

            planId = String(promocion.id);
            nombrePlan = String(promocion.nombre);
            precioFinal = Number(promocion.precio_final);

            if (
                !Number.isFinite(precioFinal) ||
                precioFinal < 0 ||
                precioFinal > precioContado
            ) {
                throw new BadRequestException(
                    `El precio promocional del artículo ${linea.slug} no es válido.`,
                );
            }
        }

        // Todos los importes se calculan desde la cantidad.
        const subtotal = this.dinero(
            precioContado * linea.cantidad,
        );

        const total = this.dinero(
            precioFinal * linea.cantidad,
        );

        const descuento = this.dinero(
            subtotal - total,
        );

        const descuentoPorcentaje = precioContado > 0
            ? this.dinero(
                (
                    (precioContado - precioFinal) /
                    precioContado
                ) * 100,
            )
            : 0;

        return {
            articuloId,
            precioId: linea.precioId,
            planId,
            nombrePlan,
            cantidad: linea.cantidad,
            precioContado: this.dinero(precioContado),
            precioFinal: this.dinero(precioFinal),
            subtotal,
            descuento,
            descuentoPorcentaje,
            total,
        };
    }

    private async guardarLinea(
        manager: EntityManager,
        carritoId: string,
        linea: LineaCalculada,
        existentes: LineaExistente[],
    ): Promise<string> {
        // Reutilizamos primero una línea activa.
        // Si no existe, podemos reactivar una inactiva.
        const coincidencias = existentes.filter(
            item =>
                String(item.articulo_id) === linea.articuloId,
        );

        const existente =
            coincidencias.find(
                item => Number(item.estado) === 1,
            ) ??
            coincidencias[0];

        if (existente) {
            const cuerpoCarritoId = String(existente.id);

            await manager.query(
                `
                UPDATE cuerpo_carrito_compras
                SET
                    tk2_precio_id = ?,
                    tk2_precio_plan_id = ?,
                    cantidad = ?,
                    precio_contado = ?,
                    precio_final = ?,
                    subtotal = ?,
                    descuento_monto = ?,
                    descuento_porcentaje = ?,
                    total = ?,
                    estado = 1,
                    updated_at = NOW()
                WHERE id = ?
                  AND carrito_compra_id = ?
                `,
                [
                    linea.precioId,
                    linea.planId,
                    linea.cantidad,
                    linea.precioContado,
                    linea.precioFinal,
                    linea.subtotal,
                    linea.descuento,
                    linea.descuentoPorcentaje,
                    linea.total,
                    cuerpoCarritoId,
                    carritoId,
                ],
            );

            // Si existen líneas duplicadas históricas,
            // conservamos solamente la seleccionada.
            await manager.query(
                `
                UPDATE cuerpo_carrito_compras
                SET
                    estado = 0,
                    updated_at = NOW()
                WHERE carrito_compra_id = ?
                  AND articulo_id = ?
                  AND id <> ?
                  AND estado = 1
                `,
                [
                    carritoId,
                    linea.articuloId,
                    cuerpoCarritoId,
                ],
            );

            return cuerpoCarritoId;
        }

        const resultado = await manager.query(
            `
            INSERT INTO cuerpo_carrito_compras (
                carrito_compra_id,
                articulo_id,
                tk2_precio_id,
                tk2_precio_plan_id,
                cantidad,
                precio_contado,
                precio_final,
                subtotal,
                descuento_monto,
                descuento_porcentaje,
                total,
                estado,
                created_at,
                updated_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                1, NOW(), NOW()
            )
            `,
            [
                carritoId,
                linea.articuloId,
                linea.precioId,
                linea.planId,
                linea.cantidad,
                linea.precioContado,
                linea.precioFinal,
                linea.subtotal,
                linea.descuento,
                linea.descuentoPorcentaje,
                linea.total,
            ],
        );

        return String(resultado.insertId);
    }

    private async guardarPlan(
        manager: EntityManager,
        carritoId: string,
        cuerpoCarritoId: string,
        linea: LineaCalculada,
        userId: string,
        planesExistentes: PlanExistente[],
    ): Promise<void> {
        // Se quita la promoción: desactivar los planes
        // asociados a esta línea y dejar el precio normal.
        if (!linea.planId) {
            await manager.query(
                `
                UPDATE carrito_compra_planes
                SET
                    estado = 0,
                    fecha_desactivado = NOW(),
                    updated_at = NOW()
                WHERE carrito_compra_id = ?
                  AND cuerpo_carrito_compra_id = ?
                  AND estado = 1
                `,
                [carritoId, cuerpoCarritoId],
            );

            return;
        }

        const coincidencias = planesExistentes.filter(
            plan =>
                String(plan.cuerpo_carrito_compra_id) ===
                cuerpoCarritoId,
        );

        const existente =
            coincidencias.find(
                plan => Number(plan.estado) === 1,
            ) ??
            coincidencias[0];

        if (existente) {
            // UPDATE del plan existente: conserva su ID.
            await manager.query(
                `
                UPDATE carrito_compra_planes
                SET
                    articulo_id = ?,
                    tk2_precio_plan_id = ?,
                    nombre_plan = ?,
                    tipo_venta = 'CONTADO',
                    tipo_calculo = 'PROMOCION_CONTADO',
                    prima_sugerida = 0,
                    prima_cliente = 0,
                    saldo_financiar = 0,
                    plazo_meses = 0,
                    cant_meses = 0,
                    periodo_pago = 'CONTADO',
                    cantidad_cuotas = 0,
                    cuota = ?,
                    interes_total = 0,
                    tasa_interes_anual = 0,
                    total_credito = ?,
                    user_id = ?,
                    estado = 1,
                    fecha_desactivado = NULL,
                    updated_at = NOW()
                WHERE id = ?
                  AND carrito_compra_id = ?
                `,
                [
                    linea.articuloId,
                    linea.planId,
                    linea.nombrePlan,
                    linea.total, // cuota
                    linea.total, // total_credito
                    userId,
                    String(existente.id),
                    carritoId,
                ],
            );

            // Evitar varios planes activos en la misma línea.
            await manager.query(
                `
                UPDATE carrito_compra_planes
                SET
                    estado = 0,
                    fecha_desactivado = NOW(),
                    updated_at = NOW()
                WHERE carrito_compra_id = ?
                  AND cuerpo_carrito_compra_id = ?
                  AND id <> ?
                  AND estado = 1
                `,
                [
                    carritoId,
                    cuerpoCarritoId,
                    String(existente.id),
                ],
            );

            return;
        }

        // No hay un plan previo: crear solamente uno.
        await manager.query(
            `
            INSERT INTO carrito_compra_planes (
                carrito_compra_id,
                cuerpo_carrito_compra_id,
                articulo_id,
                tk2_precio_plan_id,
                nombre_plan,
                tipo_venta,
                tipo_calculo,
                prima_sugerida,
                prima_cliente,
                saldo_financiar,
                plazo_meses,
                cant_meses,
                periodo_pago,
                cantidad_cuotas,
                cuota,
                interes_total,
                tasa_interes_anual,
                total_credito,
                user_id,
                estado,
                created_at,
                updated_at
            )
            VALUES (
                       ?, ?, ?, ?, ?,
                       'CONTADO',
                       'PROMOCION_CONTADO',
                       0, 0, 0, 0, 0,
                       'CONTADO',
                       0, ?, 0, 0, ?,
                       ?, 1, NOW(), NOW()
                   )
            `,
            [
                carritoId,
                cuerpoCarritoId,
                linea.articuloId,
                linea.planId,
                linea.nombrePlan,
                linea.total, // cuota
                linea.total, // total_credito
                userId,
            ]
        );
    }

    async guardar(
        dto: GuardarCarritoContadoDto,
        sucursalId: string,
        userId: string,
    ) {
        const lineasNormalizadas = this.normalizarLineas(dto);

        const slugGuardado = await this.dataSource.transaction(
            async (manager: EntityManager) => {
                const clientes = await manager.query(
                    `
                    SELECT id
                    FROM clientes
                    WHERE slug = ?
                    LIMIT 1
                    `,
                    [dto.cliente_slug],
                );

                if (!clientes.length) {
                    throw new NotFoundException(
                        'No se encontró el cliente.',
                    );
                }

                const clienteId = String(clientes[0].id);

                let carritoId: string;
                let carritoSlug: string;

                if (dto.carrito_slug) {
                    const carritos = await manager.query(
                        `
                        SELECT
                            id,
                            slug,
                            cliente_id
                        FROM carrito_compras
                        WHERE slug = ?
                          AND sucursal_id = ?
                          AND estado = 'ABIERTO'
                          AND tipo = 'CONTADO'
                          AND estado_visible = 1
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [dto.carrito_slug, sucursalId],
                    );

                    if (!carritos.length) {
                        throw new NotFoundException(
                            'No se encontró un carrito de contado abierto.',
                        );
                    }

                    if (
                        String(carritos[0].cliente_id) !== clienteId
                    ) {
                        throw new ConflictException(
                            'El carrito pertenece a otro cliente.',
                        );
                    }

                    carritoId = String(carritos[0].id);
                    carritoSlug = String(carritos[0].slug);
                } else {
                    carritoSlug = randomUUID();

                    const resultado = await manager.query(
                        `
                        INSERT INTO carrito_compras (
                            slug,
                            user_id,
                            cliente_id,
                            sucursal_id,
                            nombre,
                            estado,
                            tipo,
                            origen,
                            subtotal,
                            descuento,
                            total_neto,
                            estado_visible,
                            created_at,
                            updated_at
                        )
                        VALUES (
                            ?, ?, ?, ?, ?,
                            'ABIERTO',
                            'CONTADO',
                            'VENDEDOR',
                            0, 0, 0, 1,
                            NOW(), NOW()
                        )
                        `,
                        [
                            carritoSlug,
                            userId,
                            clienteId,
                            sucursalId,
                            dto.nombre?.trim() ||
                            `Carrito contado ${new Date()
                                .toISOString()
                                .slice(0, 10)}`,
                        ],
                    );

                    carritoId = String(resultado.insertId);
                }

                // Bloqueamos las líneas del carrito existente.
                const existentes: LineaExistente[] =
                    await manager.query(
                        `
                        SELECT
                            id,
                            articulo_id,
                            estado
                        FROM cuerpo_carrito_compras
                        WHERE carrito_compra_id = ?
                        ORDER BY id ASC
                        FOR UPDATE
                        `,
                        [carritoId],
                    );

                // Bloqueamos los planes del carrito.
                const planesExistentes: PlanExistente[] =
                    await manager.query(
                        `
                        SELECT
                            id,
                            cuerpo_carrito_compra_id,
                            estado
                        FROM carrito_compra_planes
                        WHERE carrito_compra_id = ?
                        ORDER BY id ASC
                        FOR UPDATE
                        `,
                        [carritoId],
                    );

                // Primero validamos y calculamos TODO.
                // Si algo falla, no modificamos las líneas.
                const nuevasLineas: LineaCalculada[] = [];

                for (const linea of lineasNormalizadas) {
                    const calculada = await this.calcularLinea(
                        manager,
                        linea,
                        sucursalId,
                    );

                    nuevasLineas.push(calculada);
                }

                const articulosEnviados = new Set(
                    nuevasLineas.map(linea => linea.articuloId),
                );

                // Los artículos que ya no vienen en el payload
                // se consideran eliminados del carrito.
                for (const existente of existentes) {
                    const articuloId = String(
                        existente.articulo_id,
                    );

                    if (
                        Number(existente.estado) !== 1 ||
                        articulosEnviados.has(articuloId)
                    ) {
                        continue;
                    }

                    const cuerpoCarritoId = String(existente.id);

                    await manager.query(
                        `
                        UPDATE carrito_compra_planes
                        SET
                            estado = 0,
                            fecha_desactivado = NOW(),
                            updated_at = NOW()
                        WHERE carrito_compra_id = ?
                          AND cuerpo_carrito_compra_id = ?
                          AND estado = 1
                        `,
                        [carritoId, cuerpoCarritoId],
                    );

                    await manager.query(
                        `
                        UPDATE cuerpo_carrito_compras
                        SET
                            estado = 0,
                            updated_at = NOW()
                        WHERE id = ?
                          AND carrito_compra_id = ?
                        `,
                        [cuerpoCarritoId, carritoId],
                    );
                }

                // Crear o actualizar las líneas y sus planes.
                for (const linea of nuevasLineas) {
                    const cuerpoCarritoId =
                        await this.guardarLinea(
                            manager,
                            carritoId,
                            linea,
                            existentes,
                        );

                    await this.guardarPlan(
                        manager,
                        carritoId,
                        cuerpoCarritoId,
                        linea,
                        userId,
                        planesExistentes,
                    );
                }

                // Desactivar planes de líneas que ya no
                // estén activas, incluyendo duplicados antiguos.
                await manager.query(
                    `
                    UPDATE carrito_compra_planes ccp
                    INNER JOIN cuerpo_carrito_compras ccc
                        ON ccc.id = ccp.cuerpo_carrito_compra_id
                    SET
                        ccp.estado = 0,
                        ccp.fecha_desactivado = NOW(),
                        ccp.updated_at = NOW()
                    WHERE ccp.carrito_compra_id = ?
                      AND ccc.estado = 0
                      AND ccp.estado = 1
                    `,
                    [carritoId],
                );

                // Recalcular los totales usando únicamente
                // las líneas activas realmente guardadas.
                const totales = await manager.query(
                    `
                    SELECT
                        COALESCE(SUM(subtotal), 0) AS subtotal,
                        COALESCE(SUM(descuento_monto), 0) AS descuento,
                        COALESCE(SUM(total), 0) AS total_neto
                    FROM cuerpo_carrito_compras
                    WHERE carrito_compra_id = ?
                      AND estado = 1
                    `,
                    [carritoId],
                );

                const subtotal = this.dinero(
                    Number(totales[0]?.subtotal ?? 0),
                );

                const descuento = this.dinero(
                    Number(totales[0]?.descuento ?? 0),
                );

                const totalNeto = this.dinero(
                    Number(totales[0]?.total_neto ?? 0),
                );

                await manager.query(
                    `
                    UPDATE carrito_compras
                    SET
                        subtotal = ?,
                        descuento = ?,
                        total_neto = ?,
                        updated_at = NOW()
                    WHERE id = ?
                    `,
                    [
                        subtotal,
                        descuento,
                        totalNeto,
                        carritoId,
                    ],
                );

                return carritoSlug;
            },
        );

        const detalle = await this.consultas.obtenerDetalle(
            slugGuardado,
            sucursalId,
        );

        return {
            success: true,
            message: 'Carrito guardado correctamente.',
            data: detalle.data,
        };
    }
}

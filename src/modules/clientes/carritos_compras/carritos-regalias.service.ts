
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CarritosConsultasService } from './carritos-consultas.service.js';

export interface GuardarRegaliaDto {
    linea_principal_id: number;
    articulo_slug: string;
    cantidad: number;
}

export interface ActualizarRegaliaDto {
    cantidad: number;
}

@Injectable()
export class CarritosRegaliasService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly consultas: CarritosConsultasService,
    ) {}

    private validarCantidad(valor: unknown): number {
        const cantidad = Number(valor);
        if (!Number.isInteger(cantidad) || cantidad < 0) {
            throw new BadRequestException('La cantidad debe ser un número entero mayor o igual a cero.');
        }
        return cantidad;
    }

    private async obtenerCarrito(manager: EntityManager, carritoSlug: string, sucursalId: string) {
        const filas = await manager.query(`
            SELECT id, slug, estado, tipo
            FROM carrito_compras
            WHERE slug = ? AND sucursal_id = ?
            LIMIT 1
            FOR UPDATE
        `, [carritoSlug, sucursalId]);

        if (!filas.length) throw new NotFoundException('No se encontró el carrito en esta sucursal.');
        if (filas[0].estado !== 'ABIERTO') throw new ConflictException('El carrito ya no está abierto.');
        if (filas[0].tipo !== 'CONTADO') throw new BadRequestException('El carrito no corresponde a una venta de contado.');

        return filas[0];
    }

    private async obtenerPrincipal(manager: EntityManager, carritoId: number, lineaId: number) {
        const filas = await manager.query(`
            SELECT ccc.id
            FROM cuerpo_carrito_compras ccc
            WHERE ccc.id = ?
              AND ccc.carrito_compra_id = ?
              AND ccc.estado = 1
              AND COALESCE(ccc.es_regalia, 0) = 0
            LIMIT 1
        `, [lineaId, carritoId]);

        if (!filas.length) throw new NotFoundException('No se encontró la línea principal activa.');
        return filas[0];
    }

    async consultar(carritoSlug: string, sucursalId: string) {
        const detalle = await this.consultas.obtenerDetalle(carritoSlug, sucursalId);
        return {
            success: true,
            message: 'Regalías consultadas correctamente.',
            data: {
                carrito_slug: detalle.data.slug,
                regalias: detalle.data.regalias ?? [],
            },
        };
    }

    async agregar(carritoSlug: string, dto: GuardarRegaliaDto, sucursalId: string, userId: string) {
        if (!dto.articulo_slug?.trim()) throw new BadRequestException('Se requiere el artículo.');
        const cantidad = this.validarCantidad(dto.cantidad);
        if (cantidad === 0) throw new BadRequestException('Una regalía nueva debe tener cantidad mayor que cero.');

        await this.dataSource.transaction(async manager => {
            const carrito = await this.obtenerCarrito(manager, carritoSlug, sucursalId);
            await this.obtenerPrincipal(manager, carrito.id, Number(dto.linea_principal_id));

            const articulos = await manager.query(`
                SELECT id
                FROM articulos
                WHERE slug = ?
                LIMIT 1
            `, [dto.articulo_slug]);

            if (!articulos.length) throw new NotFoundException('No se encontró el artículo de regalía.');

            const articuloId = articulos[0].id;

            const existentes = await manager.query(`
                SELECT cr.id
                FROM carrito_compra_regalias cr
                INNER JOIN cuerpo_carrito_compras ccc
                    ON ccc.id = cr.cuerpo_carrito_regalia_id
                WHERE cr.carrito_compra_id = ?
                  AND cr.cuerpo_carrito_compra_id = ?
                  AND ccc.articulo_id = ?
                LIMIT 1
            `, [carrito.id, dto.linea_principal_id, articuloId]);

            if (existentes.length) {
                throw new ConflictException('Esta regalía ya está registrada para el artículo principal. Actualiza su cantidad.');
            }

            const resultado = await manager.query(`
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
                    created_at,
                    updated_at
                ) VALUES (
                    ?, ?, ?, 0, 0, 0, 0, 0, 0, 0,
                    1, 'PENDIENTE_APROBACION', 'REGALIA', 1,
                    NOW(), NOW()
                )
            `, [carrito.id, articuloId, cantidad]);

            const lineaRegaliaId = resultado.insertId;

            await manager.query(`
                INSERT INTO carrito_compra_regalias (
                    carrito_compra_id,
                    cuerpo_carrito_compra_id,
                    cuerpo_carrito_regalia_id,
                    user_id,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, NOW(), NOW())
            `, [carrito.id, dto.linea_principal_id, lineaRegaliaId, userId]);
        });

        const detalle = await this.consultas.obtenerDetalle(carritoSlug, sucursalId);

        return {
            success: true,
            message: 'Regalía agregada correctamente.',
            data: detalle.data,
        };
    }

    async actualizar(
        carritoSlug: string,
        lineaRegaliaId: number,
        dto: ActualizarRegaliaDto,
        sucursalId: string,
        userId: string,
    ) {
        const cantidad = this.validarCantidad(dto.cantidad);

        await this.dataSource.transaction(async manager => {
            const carrito = await this.obtenerCarrito(manager, carritoSlug, sucursalId);

            const filas = await manager.query(`
                SELECT cr.id, ccc.estado_regalia
                FROM carrito_compra_regalias cr
                INNER JOIN cuerpo_carrito_compras ccc
                    ON ccc.id = cr.cuerpo_carrito_regalia_id
                WHERE cr.carrito_compra_id = ?
                  AND cr.cuerpo_carrito_regalia_id = ?
                LIMIT 1
                FOR UPDATE
            `, [carrito.id, lineaRegaliaId]);

            if (!filas.length) throw new NotFoundException('No se encontró la regalía.');

            if (filas[0].estado_regalia === 'APROBADA') {
                throw new ConflictException('No se puede modificar una regalía aprobada.');
            }

            await manager.query(`
                UPDATE cuerpo_carrito_compras
                SET cantidad = ?, updated_at = NOW()
                WHERE id = ? AND carrito_compra_id = ?
            `, [cantidad, lineaRegaliaId, carrito.id]);

            await manager.query(`
                UPDATE carrito_compra_regalias
                SET user_id = ?, updated_at = NOW()
                WHERE id = ?
            `, [userId, filas[0].id]);
        });

        const detalle = await this.consultas.obtenerDetalle(carritoSlug, sucursalId);

        return {
            success: true,
            message: 'Cantidad de regalía actualizada correctamente.',
            data: detalle.data,
        };
    }
}

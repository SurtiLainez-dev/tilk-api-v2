
import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EntityManager } from 'typeorm';

export interface ArticuloInventarioVenta {
    articulo_id: string | number;
    cantidad: number;
    estado_articulo_id: string | number;
    remision_articulo_id?: string | number | null;
    serie_fabricante?: string | null;
    precio?: string | number | null;
    es_regalia?: boolean;
}

export interface DatosMovimientoInventario {
    sucursal_id: string | number;
    user_id: string | number;
    factura_cod: string;
    documento_id?: string | number | null;
}

export interface RemisionVentaCreada {
    articulo_id: string;
    remision_articulo_id: string;
    serie_sistema: string;
    serie_fabricante: string;
    estado_articulo_id: 5;
    es_regalia: boolean;
}

interface StockArticulo {
    id: string | number;
    stock_actual: number;
    stock_consignado: number;
    stock_reingreso: number;
}

interface RemisionExistente {
    id: string | number;
    articulo_id: string | number;
    sucursal_id: string | number;
    estado_articulo_id: string | number;
    serie_sistema: string;
    serie_fabricante: string | null;
}

@Injectable()
export class InventarioVentasService {
    private validarId(valor: unknown, campo: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${campo} no es válido.`);
        return id;
    }

    private validarCantidad(valor: unknown): number {
        const cantidad = Number(valor);
        if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
            throw new BadRequestException('La cantidad del artículo debe ser un entero mayor que cero.');
        }
        return cantidad;
    }

    private validarPrecio(valor: unknown): number | null {
        if (valor === undefined || valor === null || valor === '') return null;

        const precio = Number(valor);
        if (!Number.isFinite(precio) || precio < 0 || !/^\d+(?:\.\d{1,2})?$/.test(String(valor))) {
            throw new BadRequestException('El precio del artículo no es válido.');
        }
        return precio;
    }

    private generarSerieSistema(): string {
        const fecha = new Date();
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const aleatorio = randomBytes(4).toString('hex').toUpperCase();
        return `${anio}${mes}${dia}${aleatorio}`;
    }

    private async crearRemision(
        manager: EntityManager,
        articuloId: string,
        sucursalId: string,
        serieFabricante: string | null,
        precio: number | null,
    ): Promise<RemisionVentaCreada> {
        const serieSistema = this.generarSerieSistema();
        const serieFinal = serieFabricante?.trim() || serieSistema;

        const resultado = await manager.query(
            `INSERT INTO remision_articulos (
                estado_articulo_id, precio_inicial, precio_actual,
                serie_sistema, serie_fabricante, sucursal_id, articulo_id,
                created_at, updated_at
            ) VALUES (5, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [precio, precio, serieSistema, serieFinal, sucursalId, articuloId],
        );

        if (!resultado.insertId) {
            throw new InternalServerErrorException('No se pudo crear la remisión del artículo.');
        }

        return {
            articulo_id: articuloId,
            remision_articulo_id: String(resultado.insertId),
            serie_sistema: serieSistema,
            serie_fabricante: serieFinal,
            estado_articulo_id: 5,
            es_regalia: false,
        };
    }

    private async obtenerRemisionBloqueada(
        manager: EntityManager,
        remisionId: string,
        articuloId: string,
        sucursalId: string,
        estadoArticuloId: number,
    ): Promise<RemisionExistente> {
        const registros: RemisionExistente[] = await manager.query(
            `SELECT id, articulo_id, sucursal_id, estado_articulo_id,
                    serie_sistema, serie_fabricante
             FROM remision_articulos
             WHERE id = ?
             FOR UPDATE`,
            [remisionId],
        );

        if (registros.length !== 1) {
            throw new ConflictException(`La remisión ${remisionId} no existe.`);
        }

        const remision = registros[0];

        if (String(remision.articulo_id) !== articuloId) {
            throw new ConflictException(
                `La remisión ${remisionId} no corresponde al artículo ${articuloId}.`,
            );
        }

        if (String(remision.sucursal_id) !== sucursalId) {
            throw new ConflictException(
                `La remisión ${remisionId} no pertenece a la sucursal de la venta.`,
            );
        }

        const estadoActual = Number(remision.estado_articulo_id);

        if (![1, 2, 3].includes(estadoActual)) {
            throw new ConflictException(
                `La remisión ${remisionId} no está disponible para venta. Estado actual: ${estadoActual}.`,
            );
        }

        if (estadoActual !== estadoArticuloId) {
            throw new ConflictException(
                `El estado de la remisión ${remisionId} no coincide con el estado del artículo enviado.`,
            );
        }

        return remision;
    }

    private async venderRemisionExistente(
        manager: EntityManager,
        remision: RemisionExistente,
        esRegalia: boolean,
    ): Promise<RemisionVentaCreada> {
        const resultado = await manager.query(
            `UPDATE remision_articulos
             SET estado_articulo_id = 5, updated_at = NOW()
             WHERE id = ? AND estado_articulo_id IN (1, 2, 3)`,
            [remision.id],
        );

        if (resultado.affectedRows !== 1) {
            throw new ConflictException(
                `No fue posible marcar como vendida la remisión ${remision.id}.`,
            );
        }

        return {
            articulo_id: String(remision.articulo_id),
            remision_articulo_id: String(remision.id),
            serie_sistema: remision.serie_sistema,
            serie_fabricante: remision.serie_fabricante || remision.serie_sistema,
            estado_articulo_id: 5,
            es_regalia: esRegalia,
        };
    }

    private async obtenerStockBloqueado(
        manager: EntityManager,
        articuloId: string,
        sucursalId: string,
    ): Promise<StockArticulo> {
        const registros: StockArticulo[] = await manager.query(
            `SELECT id, stock_actual, stock_consignado, stock_reingreso
             FROM stock_articulos
             WHERE articulo_id = ? AND sucursal_id = ?
             FOR UPDATE`,
            [articuloId, sucursalId],
        );

        if (registros.length !== 1) {
            throw new ConflictException(
                registros.length === 0
                    ? `El artículo ${articuloId} no tiene inventario en esta sucursal.`
                    : `El artículo ${articuloId} tiene registros de inventario duplicados en esta sucursal.`,
            );
        }

        return registros[0];
    }

    private async descontarStock(
        manager: EntityManager,
        stock: StockArticulo,
        estadoArticuloId: number,
        cantidad: number,
        articuloId: string,
    ): Promise<{ anterior: number; posterior: number }> {
        const columna: 'stock_actual' | 'stock_consignado' =
            estadoArticuloId === 2 ? 'stock_consignado' : 'stock_actual';

        const anterior = Number(stock[columna]);
        const posterior = anterior - cantidad;

        if (!Number.isSafeInteger(anterior) || anterior < cantidad) {
            throw new ConflictException(
                `Existencias insuficientes para el artículo ${articuloId}. Disponible: ${anterior}, solicitado: ${cantidad}.`,
            );
        }

        const resultado = await manager.query(
            `UPDATE stock_articulos
             SET ${columna} = ${columna} - ?, updated_at = NOW()
             WHERE id = ? AND ${columna} >= ?`,
            [cantidad, stock.id, cantidad],
        );

        if (resultado.affectedRows !== 1) {
            throw new ConflictException(
                `No fue posible descontar el inventario del artículo ${articuloId}.`,
            );
        }

        return { anterior, posterior };
    }

    private async registrarKardex(
        manager: EntityManager,
        datos: DatosMovimientoInventario,
        articuloId: string,
        remisionId: string,
        anterior: number,
        posterior: number,
        esRegalia: boolean,
    ): Promise<void> {
        await manager.query(
            `INSERT INTO kardex_articulos (
                referencia, articulo_id, remision_articulo_id,
                movimiento, concepto, documento_tipo, documento_id,
                documento_cod, sucursal_id, sucursal_destino_id,
                cantidad, stock_anterior, stock_posterior, user_id,
                observacion, fecha_movimiento, created_at, updated_at
            ) VALUES (
                ?, ?, ?, 'SALIDA', ?, 'FACTURA_CONTADO',
                ?, ?, ?, NULL, 1, ?, ?, ?, ?, NOW(), NOW(), NOW()
            )`,
            [
                datos.factura_cod,
                articuloId,
                remisionId,
                esRegalia ? 'REGALIA' : 'VENTA',
                datos.documento_id ?? null,
                datos.factura_cod,
                datos.sucursal_id,
                anterior,
                posterior,
                datos.user_id,
                esRegalia
                    ? `Regalía registrada en factura ${datos.factura_cod}`
                    : `Venta registrada en factura ${datos.factura_cod}`,
            ],
        );
    }

    private async registrarHistorial(
        manager: EntityManager,
        articuloId: string,
        userId: string,
        facturaCod: string,
        esRegalia: boolean,
    ): Promise<void> {
        const operacion = esRegalia
            ? `Se ha registrado en la factura ${facturaCod} como regalía.`
            : `Se ha registrado en la factura ${facturaCod} como venta.`;

        await manager.query(
            `INSERT INTO historial_articulos (
                articulo_id, operacion, user_id, referencia,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [articuloId, operacion, userId, facturaCod],
        );
    }

    async procesarArticulo(
        manager: EntityManager,
        articulo: ArticuloInventarioVenta,
        datos: DatosMovimientoInventario,
    ): Promise<RemisionVentaCreada[]> {
        const articuloId = this.validarId(articulo.articulo_id, 'El artículo');
        const sucursalId = this.validarId(datos.sucursal_id, 'La sucursal');
        const userId = this.validarId(datos.user_id, 'El usuario');
        const cantidad = this.validarCantidad(articulo.cantidad);
        const estadoArticuloId = Number(articulo.estado_articulo_id);
        const precio = this.validarPrecio(articulo.precio);
        const facturaCod = String(datos.factura_cod ?? '').trim();
        const esRegalia = articulo.es_regalia === true;

        if (![1, 2, 3].includes(estadoArticuloId)) {
            throw new BadRequestException(
                `El estado del artículo ${articuloId} no permite realizar la venta.`,
            );
        }

        if (!facturaCod || facturaCod.length > 50) {
            throw new BadRequestException('El código de factura no es válido.');
        }

        if (
            articulo.serie_fabricante !== undefined &&
            articulo.serie_fabricante !== null &&
            typeof articulo.serie_fabricante !== 'string'
        ) {
            throw new BadRequestException('La serie del fabricante no es válida.');
        }

        const serieFabricante = articulo.serie_fabricante?.trim() || null;

        if (serieFabricante && serieFabricante.length > 100) {
            throw new BadRequestException('La serie del fabricante supera los 100 caracteres.');
        }

        const remisionId = articulo.remision_articulo_id === undefined ||
        articulo.remision_articulo_id === null ||
        articulo.remision_articulo_id === ''
            ? null
            : this.validarId(articulo.remision_articulo_id, 'La remisión');

        if ((remisionId || serieFabricante) && cantidad !== 1) {
            throw new BadRequestException(
                'Cuando se proporciona una remisión o serie del fabricante, la cantidad debe ser 1. Envía cada unidad por separado.',
            );
        }

        const stock = await this.obtenerStockBloqueado(manager, articuloId, sucursalId);

        let remisionExistente: RemisionExistente | null = null;

        if (remisionId) {
            remisionExistente = await this.obtenerRemisionBloqueada(
                manager,
                remisionId,
                articuloId,
                sucursalId,
                estadoArticuloId,
            );

            if (
                serieFabricante &&
                remisionExistente.serie_fabricante &&
                serieFabricante !== remisionExistente.serie_fabricante
            ) {
                throw new ConflictException(
                    `La serie del fabricante no coincide con la remisión ${remisionId}.`,
                );
            }
        }

        const movimiento = await this.descontarStock(
            manager,
            stock,
            estadoArticuloId,
            cantidad,
            articuloId,
        );

        const remisiones: RemisionVentaCreada[] = [];

        for (let i = 0; i < cantidad; i++) {
            const remision = remisionExistente
                ? await this.venderRemisionExistente(manager, remisionExistente, esRegalia)
                : await this.crearRemision(
                    manager,
                    articuloId,
                    sucursalId,
                    serieFabricante,
                    precio,
                );

            remision.es_regalia = esRegalia;

            await this.registrarKardex(
                manager,
                {
                    ...datos,
                    sucursal_id: sucursalId,
                    user_id: userId,
                    factura_cod: facturaCod,
                },
                articuloId,
                remision.remision_articulo_id,
                movimiento.anterior - i,
                movimiento.anterior - i - 1,
                esRegalia,
            );

            await this.registrarHistorial(
                manager,
                articuloId,
                userId,
                facturaCod,
                esRegalia,
            );

            remisiones.push(remision);
        }

        return remisiones;
    }

    async procesarArticulos(
        manager: EntityManager,
        articulos: ArticuloInventarioVenta[],
        datos: DatosMovimientoInventario,
    ): Promise<RemisionVentaCreada[]> {
        if (!Array.isArray(articulos) || articulos.length === 0) {
            throw new BadRequestException('No se proporcionaron artículos para procesar.');
        }

        const remisiones: RemisionVentaCreada[] = [];

        const ordenados = [...articulos].sort((a, b) => {
            const diferencia = Number(a.articulo_id) - Number(b.articulo_id);
            if (diferencia !== 0) return diferencia;

            const remisionA = Number(a.remision_articulo_id ?? 0);
            const remisionB = Number(b.remision_articulo_id ?? 0);
            return remisionA - remisionB;
        });

        for (const articulo of ordenados) {
            const creadas = await this.procesarArticulo(manager, articulo, datos);
            remisiones.push(...creadas);
        }

        return remisiones;
    }
}

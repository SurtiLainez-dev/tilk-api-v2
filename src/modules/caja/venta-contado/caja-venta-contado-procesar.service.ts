import { NotasCreditoAplicacionesService, type AplicacionNotaPreparada } from '../../notas-credito-clientes/notas-credito-aplicaciones.service.js';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CajaVentaContadoSeriesService } from './caja-venta-contado-series.service.js';

import {
    CajaVentaContadoValidacionService,
    CrearVentaContadoDto,
    VentaContadoValidada,
    ArticuloVentaContadoDto,
    SolicitudVentaContadoValidada,
} from './caja-venta-contado-validacion.service.js';

import {
    InventarioVentasService,
    RemisionVentaCreada,
} from '../../inventario/inventario-ventas.service.js';

import {
    PostearCuentaDirectrizService,
    CodigoDirectriz,
} from '../postear_cuenta/postear-cuenta-directriz.service.js';

import { CarritosImpuestosService} from "../../clientes/carritos_compras/carritos-impuestos.service.js";

export interface ContextoProcesarVentaContado {
    cajaId: string;
    sucursalId: string;
    userId: string;
}

export interface VentaContadoRegistrada {
    ventaId: string;
    codigoVenta: string;
}

export interface FacturaContadoRegistrada {
    facturaId: string;
    codigoFactura: string;
}

export interface IntegracionVentaContado {
    crearVenta(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
    ): Promise<VentaContadoRegistrada>;

    crearContrato(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        ventaRegistrada: VentaContadoRegistrada,
    ): Promise<void>;

    crearFactura(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        ventaRegistrada: VentaContadoRegistrada,
        numeracion: CodigoDirectriz,
    ): Promise<FacturaContadoRegistrada>;

    registrarDetalles(
        manager: EntityManager,
        venta: VentaContadoValidada,
        ventaRegistrada: VentaContadoRegistrada,
        facturaRegistrada: FacturaContadoRegistrada,
        remisiones: RemisionVentaCreada[],
    ): Promise<void>;

    crearOrdenEntrega(
        manager: EntityManager,
        ventaRegistrada: VentaContadoRegistrada,
    ): Promise<void>;

    registrarPago(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        ventaRegistrada: VentaContadoRegistrada,
        facturaRegistrada: FacturaContadoRegistrada,
    ): Promise<void>;

    actualizarMotocicletas(
        manager: EntityManager,
        remisiones: RemisionVentaCreada[],
        facturaRegistrada: FacturaContadoRegistrada,
    ): Promise<void>;
}

export interface ResultadoProcesarVentaContado {
    success: true;
    message: string;
    data: {
        codigo_venta: string;
        codigo_factura: string;
        total: string;
        cantidad_articulos: number;
        cantidad_remisiones: number;
    };
}

interface CarritoFacturacion {
    id: string | number;
    slug: string;
    cliente_slug: string;
    total_neto: string | number;
}

interface LineaCarritoFacturacion {
    linea_id: string | number;
    articulo_id: string | number;
    nombre_articulo: string;
    cantidad: string | number;
    precio_final: string | number;
    total: string | number;
    tipo_linea: string | null;
    remision_articulo_id: string | number | null;
    is_motocicleta: string | number;
}

interface RemisionCarrito {
    id: string | number;
    articulo_id: string | number;
    sucursal_id: string | number;
    estado_articulo_id: string | number;
    serie_fabricante: string | null;
}

interface StockCarrito {
    id: string | number;
    stock_actual: string | number;
    stock_consignado: string | number;
}

@Injectable()
export class CajaVentaContadoProcesarService {
    private readonly logger = new Logger(CajaVentaContadoProcesarService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly validacion: CajaVentaContadoValidacionService,
        private readonly inventario: InventarioVentasService,
        private readonly directriz: PostearCuentaDirectrizService,
        private readonly impuestos: CarritosImpuestosService,
        private readonly seriesService: CajaVentaContadoSeriesService,
        private readonly notasCredito: NotasCreditoAplicacionesService,
    ) {}

    private validarContexto(contexto: ContextoProcesarVentaContado): void {
        if (
            !contexto ||
            !/^[1-9]\d*$/.test(String(contexto.cajaId ?? '')) ||
            !/^[1-9]\d*$/.test(String(contexto.sucursalId ?? '')) ||
            !/^[1-9]\d*$/.test(String(contexto.userId ?? ''))
        ) {
            throw new BadRequestException('El contexto de caja, sucursal o usuario no es válido.');
        }
    }

    private validarIntegracion(integracion: IntegracionVentaContado): void {
        const metodos: (keyof IntegracionVentaContado)[] = [
            'crearVenta',
            'crearContrato',
            'crearFactura',
            'registrarDetalles',
            'crearOrdenEntrega',
            'registrarPago',
            'actualizarMotocicletas',
        ];

        if (!integracion || metodos.some(metodo => typeof integracion[metodo] !== 'function')) {
            throw new InternalServerErrorException('Los servicios de procesamiento de venta de contado no están completamente conectados.');
        }
    }

    private dinero(valor: unknown): string {
        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero < 0) {
            throw new BadRequestException('Se detectó un importe inválido en el carrito.');
        }

        return numero.toFixed(2);
    }

    // ==========================================
    // BLOQUEAR CARRITO
    // ==========================================

    private async obtenerCarrito(
        manager: EntityManager,
        solicitud: SolicitudVentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
    ): Promise<CarritoFacturacion> {
        const registros: CarritoFacturacion[] = await manager.query(
            `
                SELECT
                    cc.id,
                    cc.slug,
                    cc.total_neto,
                    c.slug AS cliente_slug
                FROM carrito_compras cc
                         INNER JOIN clientes c
                                    ON c.id = cc.cliente_id
                WHERE cc.slug = ?
                  AND cc.sucursal_id = ?
                  AND cc.tipo = 'CONTADO'
                  AND cc.estado = 'ABIERTO'
                  AND cc.estado_visible = 1
                    LIMIT 1
            FOR UPDATE
            `,
            [solicitud.carrito_slug, contexto.sucursalId],
        );

        if (!registros.length) {
            throw new NotFoundException('El carrito no existe, no está abierto o ya fue procesado.');
        }

        const carrito = registros[0];

        if (carrito.cliente_slug !== solicitud.cliente_slug) {
            throw new BadRequestException('El carrito no corresponde al cliente seleccionado.');
        }

        return carrito;
    }

    // ==========================================
    // OBTENER ARTÍCULOS INTERNOS
    // ==========================================

    private async obtenerLineas(
        manager: EntityManager,
        carritoId: string | number,
    ): Promise<LineaCarritoFacturacion[]> {
        const lineas: LineaCarritoFacturacion[] = await manager.query(
            `
                SELECT
                    ccc.id AS linea_id,
                    ccc.articulo_id,
                    ccc.cantidad,
                    ccc.precio_final,
                    ccc.total,
                    ccc.tipo_linea,
                    ccc.remision_articulo_id,
                    a.nombre_articulo,
                    a.is_motocicleta
                FROM cuerpo_carrito_compras ccc
                         INNER JOIN articulos a
                                    ON a.id = ccc.articulo_id
                WHERE ccc.carrito_compra_id = ?
                  AND ccc.estado = 1
                ORDER BY ccc.id ASC
                    FOR UPDATE
            `,
            [carritoId],
        );

        if (!lineas.length) {
            throw new BadRequestException('El carrito no contiene artículos activos.');
        }

        return lineas;
    }

    // ==========================================
    // VALIDAR REMISIONES EXISTENTES
    // ==========================================

    private async obtenerRemision(
        manager: EntityManager,
        linea: LineaCarritoFacturacion,
        contexto: ContextoProcesarVentaContado,
    ): Promise<RemisionCarrito> {
        const registros: RemisionCarrito[] = await manager.query(
            `
                SELECT
                    id,
                    articulo_id,
                    sucursal_id,
                    estado_articulo_id,
                    serie_fabricante
                FROM remision_articulos
                WHERE id = ?
                    LIMIT 1
            FOR UPDATE
            `,
            [linea.remision_articulo_id],
        );

        if (!registros.length) {
            throw new ConflictException(`No se encontró la remisión de ${linea.nombre_articulo}.`);
        }

        const remision = registros[0];

        if (String(remision.articulo_id) !== String(linea.articulo_id)) {
            throw new ConflictException(`La remisión no corresponde a ${linea.nombre_articulo}.`);
        }

        if (String(remision.sucursal_id) !== contexto.sucursalId) {
            throw new ConflictException(`La remisión de ${linea.nombre_articulo} pertenece a otra sucursal.`);
        }

        if (![1, 2, 3].includes(Number(remision.estado_articulo_id))) {
            throw new ConflictException(`La remisión de ${linea.nombre_articulo} no está disponible para venta.`);
        }

        if (Number(linea.cantidad) !== 1) {
            throw new BadRequestException(`La remisión de ${linea.nombre_articulo} debe corresponder a una sola unidad.`);
        }

        return remision;
    }

    // ==========================================
    // OBTENER INVENTARIO DISPONIBLE
    // ==========================================

    private async obtenerStock(
        manager: EntityManager,
        articuloId: string,
        sucursalId: string,
    ): Promise<StockCarrito> {
        const registros: StockCarrito[] = await manager.query(
            `
                SELECT
                    id,
                    stock_actual,
                    stock_consignado
                FROM stock_articulos
                WHERE articulo_id = ?
                  AND sucursal_id = ?
                    FOR UPDATE
            `,
            [articuloId, sucursalId],
        );

        if (registros.length !== 1) {
            throw new ConflictException(
                registros.length === 0
                    ? `El artículo ${articuloId} no tiene inventario en esta sucursal.`
                    : `El artículo ${articuloId} tiene inventario duplicado.`,
            );
        }

        return registros[0];
    }

    // ==========================================
    // PREPARAR ARTÍCULOS PARA FACTURACIÓN
    // ==========================================

    private async prepararArticulos(
        manager: EntityManager,
        lineas: LineaCarritoFacturacion[],
        contexto: ContextoProcesarVentaContado,
        carritoId: string,
        series: SolicitudVentaContadoValidada['series'],
    ): Promise<ArticuloVentaContadoDto[]> {
        const resultado: ArticuloVentaContadoDto[] = [];
        const seriesPorLinea = new Map(series.map(item => [item.cuerpo_carrito_id, item.serie_fabricante]));
        for (const item of series) {
            const linea = lineas.find(l => String(l.linea_id) === item.cuerpo_carrito_id);
            if (!linea) throw new BadRequestException('La línea de la serie no pertenece al carrito activo.');
            if (linea.remision_articulo_id) continue;
            if (Number(linea.cantidad) !== 1) throw new BadRequestException(`La línea de ${linea.nombre_articulo} debe tener cantidad 1 para registrar una serie.`);
            if (Number(linea.is_motocicleta) === 1) throw new BadRequestException('Debes vincular una motocicleta existente.');
        }

        const disponibles = new Map<string, {
            normal: number;
            consignado: number;
        }>();

        const remisiones = new Map<string, RemisionCarrito>();
        const remisionesUtilizadas = new Set<string>();

        const articulosIds = [...new Set(
            lineas.map(linea => String(linea.articulo_id)),
        )].sort((a, b) => Number(a) - Number(b));

        // Bloquear existencias de manera ordenada.
        for (const articuloId of articulosIds) {
            const stock = await this.obtenerStock(
                manager,
                articuloId,
                contexto.sucursalId,
            );

            const normal = Number(stock.stock_actual);
            const consignado = Number(stock.stock_consignado);

            if (
                !Number.isSafeInteger(normal) ||
                !Number.isSafeInteger(consignado) ||
                normal < 0 ||
                consignado < 0
            ) {
                throw new ConflictException(`El inventario del artículo ${articuloId} contiene cantidades inválidas.`);
            }

            disponibles.set(articuloId, {
                normal,
                consignado,
            });
        }

        // Reservar primero las unidades con remisión existente.
        for (const linea of lineas) {
            if (!linea.remision_articulo_id) continue;

            const remisionId = String(linea.remision_articulo_id);

            if (remisionesUtilizadas.has(remisionId)) {
                throw new ConflictException('Existe una remisión repetida en el carrito.');
            }

            const remision = await this.obtenerRemision(
                manager,
                linea,
                contexto,
            );

            remisionesUtilizadas.add(remisionId);
            remisiones.set(String(linea.linea_id), remision);

            const stock = disponibles.get(String(linea.articulo_id))!;

            if (Number(remision.estado_articulo_id) === 2) {
                if (stock.consignado < 1) {
                    throw new ConflictException(`No existe stock consignado disponible para ${linea.nombre_articulo}.`);
                }

                stock.consignado -= 1;
            } else {
                if (stock.normal < 1) {
                    throw new ConflictException(`No existe stock disponible para ${linea.nombre_articulo}.`);
                }

                stock.normal -= 1;
            }
        }

        // Preparar las líneas en su orden original.
        for (const linea of lineas) {
            const articuloId = String(linea.articulo_id);
            const cantidad = Number(linea.cantidad);
            const precio = this.dinero(linea.precio_final);
            const total = this.dinero(linea.total);

            const esRegalia = String(linea.tipo_linea ?? '').toUpperCase() === 'REGALIA';

            if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
                throw new BadRequestException(`La cantidad de ${linea.nombre_articulo} no es válida.`);
            }

            if (
                Math.round(Number(precio) * 100) * cantidad !==
                Math.round(Number(total) * 100)
            ) {
                throw new BadRequestException(`El total de ${linea.nombre_articulo} no coincide con su precio y cantidad.`);
            }

            const remision = remisiones.get(String(linea.linea_id));

            if (remision) {
                resultado.push({
                    articulo_id: articuloId,
                    cantidad: 1,
                    precio,
                    total,
                    remision_articulo_id: String(remision.id),
                    serie_fabricante: remision.serie_fabricante,
                    estado_articulo_id: String(remision.estado_articulo_id),
                    combo_id: null,
                    is_remision: 1,
                    es_regalia: esRegalia,
                });

                continue;
            }

            if (Number(linea.is_motocicleta) === 1) {
                throw new BadRequestException(`Debes vincular una motocicleta a ${linea.nombre_articulo} antes de facturar.`);
            }

            const stock = disponibles.get(articuloId)!;

            // Para artículos sin remisión, utilizar primero
            // las existencias normales.
            const cantidadNormal = Math.min(
                cantidad,
                stock.normal,
            );

            const cantidadConsignada = cantidad - cantidadNormal;

            if (cantidadConsignada > stock.consignado) {
                throw new ConflictException(`Existencias insuficientes para ${linea.nombre_articulo}.`);
            }

            if (cantidadNormal > 0) {
                const serie = seriesPorLinea.get(String(linea.linea_id)) ?? null;
                const remisionId = serie ? await this.seriesService.crearYVincular(manager, carritoId, String(linea.linea_id), articuloId, contexto.sucursalId, serie, precio, 1) : null;
                resultado.push({
                    articulo_id: articuloId,
                    cantidad: cantidadNormal,
                    precio,
                    total: this.dinero(Number(precio) * cantidadNormal),
                    remision_articulo_id: remisionId,
                    serie_fabricante: serie,
                    estado_articulo_id: '1',
                    combo_id: null,
                    is_remision: 1,
                    es_regalia: esRegalia,
                });

                stock.normal -= cantidadNormal;
            }

            if (cantidadConsignada > 0) {
                const serie = seriesPorLinea.get(String(linea.linea_id)) ?? null;
                const remisionId = serie ? await this.seriesService.crearYVincular(manager, carritoId, String(linea.linea_id), articuloId, contexto.sucursalId, serie, precio, 2) : null;
                resultado.push({
                    articulo_id: articuloId,
                    cantidad: cantidadConsignada,
                    precio,
                    total: this.dinero(Number(precio) * cantidadConsignada),
                    remision_articulo_id: remisionId,
                    serie_fabricante: serie,
                    estado_articulo_id: '2',
                    combo_id: null,
                    is_remision: 1,
                    es_regalia: esRegalia,
                });

                stock.consignado -= cantidadConsignada;
            }
        }

        return resultado;
    }

    // ==========================================
    // PREPARAR VENTA DEFINITIVA
    // ==========================================

    private async prepararVenta(
        manager: EntityManager,
        solicitud: SolicitudVentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        carrito: CarritoFacturacion,
        aplicaciones: AplicacionNotaPreparada[],
    ): Promise<VentaContadoValidada> {
        const lineas = await this.obtenerLineas(manager, carrito.id);

        const calculo = await this.impuestos.calcular(
            solicitud.carrito_slug,
            contexto.sucursalId,
            manager,
        );

        const total = Number(calculo.total_factura);
        const impuesto = Number(calculo.impuestos);

        if (
            !Number.isFinite(total) ||
            !Number.isFinite(impuesto) ||
            total <= 0 ||
            impuesto < 0 ||
            impuesto > total
        ) {
            throw new BadRequestException('El cálculo de impuestos del carrito no es válido.');
        }

        if (
            Math.round(total * 100) !==
            Math.round(Number(carrito.total_neto) * 100)
        ) {
            throw new ConflictException('El total calculado no coincide con el total guardado del carrito.');
        }

        if (solicitud.forma_pago_id === '12') {
            aplicaciones.push(...await this.notasCredito.preparar(manager, solicitud.cliente_slug, solicitud.notas_credito, this.dinero(total), solicitud.operacion_id));
        }

        const articulos = await this.prepararArticulos(
            manager,
            lineas,
            contexto,
            String(carrito.id),
            solicitud.series,
        );

        const observacion = [
            solicitud.observacion,
            solicitud.referencia_pos
                ? `Referencia POS: ${solicitud.referencia_pos}`
                : '',
        ].filter(Boolean).join(' | ');

        return this.validacion.validar({
            operacion_id: solicitud.operacion_id,
            cliente_slug: solicitud.cliente_slug,
            forma_pago_id: solicitud.forma_pago_id,
            observacion,
            sub_total: this.dinero(total - impuesto),
            impuesto: this.dinero(impuesto),
            total: this.dinero(total),
            monto_recibido: solicitud.monto_recibido,
            articulos,
        });
    }

    // ==========================================
    // CERRAR CARRITO FACTURADO
    // ==========================================

    private async finalizarCarrito(
        manager: EntityManager,
        carritoId: string | number,
    ): Promise<void> {
        const resultado = await manager.query(
            `
                UPDATE carrito_compras
                SET
                    estado_visible = 0,
                    updated_at = ?
                WHERE id = ?
                  AND estado = 'ABIERTO'
                  AND estado_visible = 1
            `,
            [new Date(), carritoId],
        );

        if (resultado.affectedRows !== 1) {
            throw new ConflictException('No fue posible finalizar el carrito facturado.');
        }
    }

    // ==========================================
    // PROCESAR VENTA DE CONTADO
    // ==========================================

    async procesar(
        datos: CrearVentaContadoDto,
        contexto: ContextoProcesarVentaContado,
        integracion: IntegracionVentaContado,
    ): Promise<ResultadoProcesarVentaContado> {
        const inicio = Date.now();

        this.logger.log('[INICIO] Procesamiento de venta de contado');

        try {
            const solicitud = this.validacion.validarSolicitud(datos);

            this.validarContexto(contexto);
            this.validarIntegracion(integracion);

            const resultado = await this.dataSource.transaction(
                'READ COMMITTED',
                async manager => {
                    this.logger.log('[TX] Iniciada transacción MySQL');

                    // ==========================================
                    // 1. BLOQUEAR CARRITO
                    // ==========================================

                    const carrito = await this.obtenerCarrito(
                        manager,
                        solicitud,
                        contexto,
                    );

                    this.logger.log(`[CARRITO_OK] ${carrito.slug}`);

                    // ==========================================
                    // 2. PREPARAR VENTA
                    // ==========================================

                    const aplicaciones: AplicacionNotaPreparada[] = [];
                    const venta = await this.prepararVenta(
                        manager,
                        solicitud,
                        contexto,
                        carrito,
                        aplicaciones,
                    );

                    this.logger.log(
                        `[VALIDADO] Caja=${contexto.cajaId}, Sucursal=${contexto.sucursalId}, Usuario=${contexto.userId}, Lineas=${venta.articulos.length}, Total=${venta.total}`,
                    );

                    // ==========================================
                    // 3. REGISTRAR VENTA
                    // ==========================================

                    const ventaRegistrada = await integracion.crearVenta(
                        manager,
                        venta,
                        contexto,
                    );

                    if (!ventaRegistrada?.ventaId || !ventaRegistrada?.codigoVenta) {
                        throw new InternalServerErrorException('No se pudo registrar correctamente la venta.');
                    }

                    this.logger.log(`[VENTA_OK] ${ventaRegistrada.codigoVenta}`);

                    // ==========================================
                    // 4. REGISTRAR CONTRATO
                    // ==========================================

                    await integracion.crearContrato(
                        manager,
                        venta,
                        contexto,
                        ventaRegistrada,
                    );

                    this.logger.log('[CONTRATO_OK]');

                    // ==========================================
                    // 5. PREPARAR NUMERACIÓN
                    // ==========================================

                    const numeracion = await this.directriz.prepararCodigo(
                        manager,
                        contexto.sucursalId,
                        4,
                    );

                    this.logger.log(`[DIRECTRIZ_OK] ${numeracion.codigo}`);

                    // ==========================================
                    // 6. REGISTRAR FACTURA
                    // ==========================================

                    const facturaRegistrada = await integracion.crearFactura(
                        manager,
                        venta,
                        contexto,
                        ventaRegistrada,
                        numeracion,
                    );

                    if (!facturaRegistrada?.facturaId || !facturaRegistrada?.codigoFactura) {
                        throw new InternalServerErrorException('No se pudo registrar correctamente la factura.');
                    }

                    if (facturaRegistrada.codigoFactura !== numeracion.codigo) {
                        throw new InternalServerErrorException('El código de la factura no coincide con la numeración autorizada.');
                    }

                    this.logger.log(`[FACTURA_OK] ${facturaRegistrada.codigoFactura}`);

                    // ==========================================
                    // 7. PROCESAR INVENTARIO
                    // ==========================================

                    const lineasOrdenadas = venta.articulos
                        .map((articulo, indice) => ({
                            articulo,
                            indice,
                        }))
                        .sort((a, b) => {
                            const dArticulo =
                                Number(a.articulo.articulo_id) -
                                Number(b.articulo.articulo_id);

                            if (dArticulo !== 0) return dArticulo;

                            const dRemision =
                                Number(a.articulo.remision_articulo_id ?? 0) -
                                Number(b.articulo.remision_articulo_id ?? 0);

                            return dRemision || a.indice - b.indice;
                        });

                    const remisionesPorLinea: RemisionVentaCreada[][] =
                        Array.from(
                            { length: venta.articulos.length },
                            () => [],
                        );

                    for (const { articulo, indice } of lineasOrdenadas) {
                        this.logger.log(
                            `[INVENTARIO_INICIO] Articulo=${articulo.articulo_id}, Cantidad=${articulo.cantidad}, Regalia=${articulo.es_regalia}`,
                        );

                        const creadas = await this.inventario.procesarArticulo(
                            manager,
                            {
                                articulo_id: articulo.articulo_id,
                                cantidad: articulo.cantidad,
                                estado_articulo_id: articulo.estado_articulo_id!,
                                remision_articulo_id: articulo.remision_articulo_id,
                                serie_fabricante: articulo.serie_fabricante,
                                precio: articulo.precio,
                                es_regalia: articulo.es_regalia,
                            },
                            {
                                sucursal_id: contexto.sucursalId,
                                user_id: contexto.userId,
                                factura_cod: facturaRegistrada.codigoFactura,
                                documento_id: facturaRegistrada.facturaId,
                            },
                        );

                        if (creadas.length !== articulo.cantidad) {
                            throw new InternalServerErrorException(`La cantidad de remisiones del artículo ${articulo.articulo_id} no coincide.`);
                        }

                        remisionesPorLinea[indice] = creadas;

                        this.logger.log(
                            `[INVENTARIO_OK] Articulo=${articulo.articulo_id}, Remisiones=${creadas.length}`,
                        );
                    }

                    const remisiones = remisionesPorLinea.flat();

                    const cantidadArticulos = venta.articulos.reduce(
                        (total, articulo) => total + articulo.cantidad,
                        0,
                    );

                    if (remisiones.length !== cantidadArticulos) {
                        throw new InternalServerErrorException('La cantidad de remisiones procesadas no coincide con los artículos vendidos.');
                    }

                    // ==========================================
                    // 8. REGISTRAR DETALLES
                    // ==========================================

                    await integracion.registrarDetalles(
                        manager,
                        venta,
                        ventaRegistrada,
                        facturaRegistrada,
                        remisiones,
                    );

                    this.logger.log(`[DETALLES_OK] ${remisiones.length}`);

                    // ==========================================
                    // 9. CREAR ORDEN DE ENTREGA
                    // ==========================================

                    this.logger.log(
                        `[ORDEN_ENTREGA_INICIO] Venta=${ventaRegistrada.codigoVenta}`,
                    );

                    await integracion.crearOrdenEntrega(
                        manager,
                        ventaRegistrada,
                    );

                    this.logger.log(
                        `[ORDEN_ENTREGA_OK] Venta=${ventaRegistrada.codigoVenta}`,
                    );

                    // ==========================================
                    // 10. ACTUALIZAR MOTOCICLETAS
                    // ==========================================

                    await integracion.actualizarMotocicletas(
                        manager,
                        remisiones,
                        facturaRegistrada,
                    );

                    this.logger.log('[MOTOCICLETAS_OK]');

                    // ==========================================
                    // 11. REGISTRAR PAGO EN CAJA
                    // ==========================================

                    if (solicitud.forma_pago_id === '12') {
                        await this.notasCredito.aplicar(manager, aplicaciones, ventaRegistrada.ventaId, contexto.cajaId, contexto.userId, solicitud.operacion_id);
                    }

                    await integracion.registrarPago(
                        manager,
                        venta,
                        contexto,
                        ventaRegistrada,
                        facturaRegistrada,
                    );

                    this.logger.log('[PAGO_CAJA_OK]');

                    // ==========================================
                    // 12. ACTUALIZAR CONTADOR
                    // ==========================================

                    await this.directriz.actualizarContador(
                        manager,
                        numeracion,
                    );

                    this.logger.log('[CONTADOR_OK]');

                    // ==========================================
                    // 13. FINALIZAR CARRITO
                    // ==========================================

                    await this.finalizarCarrito(
                        manager,
                        carrito.id,
                    );

                    this.logger.log(`[CARRITO_FINALIZADO] ${carrito.slug}`);

                    // ==========================================
                    // 14. RESPUESTA
                    // ==========================================

                    return {
                        success: true as const,
                        message: 'Venta de contado registrada correctamente.',
                        data: {
                            codigo_venta: ventaRegistrada.codigoVenta,
                            codigo_factura: facturaRegistrada.codigoFactura,
                            total: venta.total,
                            cantidad_articulos: cantidadArticulos,
                            cantidad_remisiones: remisiones.length,
                        },
                    };
                },
            );

            this.logger.log(
                `[COMMIT_OK] Factura=${resultado.data.codigo_factura}, DuracionMs=${Date.now() - inicio}`,
            );

            return resultado;
        } catch (error) {
            const e = error instanceof Error
                ? error
                : new Error(String(error));

            this.logger.error(
                `[ERROR_ROLLBACK] ${e.message}; DuracionMs=${Date.now() - inicio}`,
                e.stack,
            );

            throw error;
        }
    }
}

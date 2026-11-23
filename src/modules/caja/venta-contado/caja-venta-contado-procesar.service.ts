
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
    CajaVentaContadoValidacionService,
    CrearVentaContadoDto,
    VentaContadoValidada,
} from './caja-venta-contado-validacion.service.js';
import {
    InventarioVentasService,
    RemisionVentaCreada,
} from '../../inventario/inventario-ventas.service.js';
import {
    PostearCuentaDirectrizService,
    CodigoDirectriz,
} from '../postear_cuenta/postear-cuenta-directriz.service.js';

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
    crearVenta(manager: EntityManager, venta: VentaContadoValidada, contexto: ContextoProcesarVentaContado): Promise<VentaContadoRegistrada>;
    crearContrato(manager: EntityManager, venta: VentaContadoValidada, contexto: ContextoProcesarVentaContado, ventaRegistrada: VentaContadoRegistrada): Promise<void>;
    crearFactura(manager: EntityManager, venta: VentaContadoValidada, contexto: ContextoProcesarVentaContado, ventaRegistrada: VentaContadoRegistrada, numeracion: CodigoDirectriz): Promise<FacturaContadoRegistrada>;
    registrarDetalles(manager: EntityManager, venta: VentaContadoValidada, ventaRegistrada: VentaContadoRegistrada, facturaRegistrada: FacturaContadoRegistrada, remisiones: RemisionVentaCreada[]): Promise<void>;
    registrarPago(manager: EntityManager, venta: VentaContadoValidada, contexto: ContextoProcesarVentaContado, ventaRegistrada: VentaContadoRegistrada, facturaRegistrada: FacturaContadoRegistrada): Promise<void>;
    actualizarMotocicletas(manager: EntityManager, remisiones: RemisionVentaCreada[], facturaRegistrada: FacturaContadoRegistrada): Promise<void>;
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

@Injectable()
export class CajaVentaContadoProcesarService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly validacion: CajaVentaContadoValidacionService,
        private readonly inventario: InventarioVentasService,
        private readonly directriz: PostearCuentaDirectrizService,
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
            'registrarPago',
            'actualizarMotocicletas',
        ];

        if (!integracion || metodos.some(metodo => typeof integracion[metodo] !== 'function')) {
            throw new InternalServerErrorException(
                'Los servicios de procesamiento de venta de contado no están completamente conectados.',
            );
        }
    }

    async procesar(
        datos: CrearVentaContadoDto,
        contexto: ContextoProcesarVentaContado,
        integracion: IntegracionVentaContado,
    ): Promise<ResultadoProcesarVentaContado> {
        const venta = this.validacion.validar(datos);

        this.validarContexto(contexto);
        this.validarIntegracion(integracion);

        for (const articulo of venta.articulos) {
            if (!articulo.estado_articulo_id) {
                throw new BadRequestException(
                    `Debes indicar el estado del artículo ${articulo.articulo_id}.`,
                );
            }
        }

        return this.dataSource.transaction('READ COMMITTED', async manager => {
            // 1. Crear venta.
            const ventaRegistrada = await integracion.crearVenta(manager, venta, contexto);

            if (!ventaRegistrada?.ventaId || !ventaRegistrada?.codigoVenta) {
                throw new InternalServerErrorException('No se pudo registrar correctamente la venta.');
            }

            // 2. Crear contrato.
            await integracion.crearContrato(manager, venta, contexto, ventaRegistrada);

            // 3. Bloquear y preparar numeración tipo 4.
            const numeracion = await this.directriz.prepararCodigo(manager, contexto.sucursalId, 4);

            // 4. Crear factura.
            const facturaRegistrada = await integracion.crearFactura(
                manager, venta, contexto, ventaRegistrada, numeracion,
            );

            if (!facturaRegistrada?.facturaId || !facturaRegistrada?.codigoFactura) {
                throw new InternalServerErrorException('No se pudo registrar correctamente la factura.');
            }

            if (facturaRegistrada.codigoFactura !== numeracion.codigo) {
                throw new InternalServerErrorException(
                    'El código de la factura no coincide con la numeración autorizada.',
                );
            }

            // 5. Ordenar líneas para bloquear inventario de forma consistente.
            // Conservamos el índice original para reconstruir los detalles.
            const lineasOrdenadas = venta.articulos
                .map((articulo, indice) => ({ articulo, indice }))
                .sort((a, b) => {
                    const diferenciaArticulo = Number(a.articulo.articulo_id) - Number(b.articulo.articulo_id);
                    if (diferenciaArticulo !== 0) return diferenciaArticulo;

                    const diferenciaRemision =
                        Number(a.articulo.remision_articulo_id ?? 0) -
                        Number(b.articulo.remision_articulo_id ?? 0);

                    return diferenciaRemision || a.indice - b.indice;
                });

            const remisionesPorLinea: RemisionVentaCreada[][] = Array.from(
                { length: venta.articulos.length },
                () => [],
            );

            for (const { articulo, indice } of lineasOrdenadas) {
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
                    throw new InternalServerErrorException(
                        `La cantidad de remisiones del artículo ${articulo.articulo_id} no coincide.`,
                    );
                }

                remisionesPorLinea[indice] = creadas;
            }

            // Reconstruir el orden original para registrar detalles y regalías.
            const remisiones = remisionesPorLinea.flat();
            const cantidadArticulos = venta.articulos.reduce((total, articulo) => total + articulo.cantidad, 0);

            if (remisiones.length !== cantidadArticulos) {
                throw new InternalServerErrorException(
                    'La cantidad de remisiones procesadas no coincide con los artículos vendidos.',
                );
            }

            // 6. Registrar detalles, incluyendo regalías.
            await integracion.registrarDetalles(
                manager, venta, ventaRegistrada, facturaRegistrada, remisiones,
            );

            // 7. Actualizar motocicletas vinculadas.
            await integracion.actualizarMotocicletas(manager, remisiones, facturaRegistrada);

            // 8. Registrar el pago.
            await integracion.registrarPago(
                manager, venta, contexto, ventaRegistrada, facturaRegistrada,
            );

            // 9. Actualizar contador al terminar las operaciones.
            await this.directriz.actualizarContador(manager, numeracion);

            return {
                success: true,
                message: 'Venta de contado registrada correctamente.',
                data: {
                    codigo_venta: ventaRegistrada.codigoVenta,
                    codigo_factura: facturaRegistrada.codigoFactura,
                    total: venta.total,
                    cantidad_articulos: cantidadArticulos,
                    cantidad_remisiones: remisiones.length,
                },
            };
        });
    }
}

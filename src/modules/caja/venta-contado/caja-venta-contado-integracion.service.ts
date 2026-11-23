import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { VentasService } from '../../ventas/ventas.service.js';
import { PagosContratosService } from '../../ventas/pagos_contratos/pagos-contratos.service.js';
import { FacturasContadosService } from '../../ventas/facturas_contados/facturas-contados.service.js';
import { RemisionVentaCreada } from '../../inventario/inventario-ventas.service.js';
import { CodigoDirectriz } from '../postear_cuenta/postear-cuenta-directriz.service.js';
import { PostearCuentaHistorialCajaService } from '../postear_cuenta/postear-cuenta-historial-caja.service.js';
import { PostearCuentaMontoLetrasService } from '../postear_cuenta/postear-cuenta-monto-letras.service.js';

import {
    ContextoProcesarVentaContado,
    VentaContadoRegistrada,
    FacturaContadoRegistrada,
} from './caja-venta-contado-procesar.service.js';

import { VentaContadoValidada } from './caja-venta-contado-validacion.service.js';

@Injectable()
export class CajaVentaContadoIntegracionService {
    constructor(
        private readonly ventasService: VentasService,
        private readonly pagosContratosService: PagosContratosService,
        private readonly facturasContadosService: FacturasContadosService,
        private readonly historialCaja: PostearCuentaHistorialCajaService,
        private readonly montoLetras: PostearCuentaMontoLetrasService,
    ) {}

    private async obtenerClienteId(manager: EntityManager, slug: string): Promise<string> {
        const clientes: { id: string | number }[] = await manager.query(
            'SELECT id FROM clientes WHERE slug = ? LIMIT 1',
            [slug],
        );

        if (!clientes.length) {
            throw new NotFoundException('No se encontró el cliente seleccionado.');
        }

        return String(clientes[0].id);
    }

    private async obtenerColaboradorId(manager: EntityManager, userId: string): Promise<string> {
        const usuarios: { colaborador_id: string | number | null }[] = await manager.query(
            'SELECT colaborador_id FROM users WHERE id = ? LIMIT 1',
            [userId],
        );

        if (!usuarios.length || !usuarios[0].colaborador_id) {
            throw new BadRequestException(
                'El usuario autenticado no tiene un colaborador asignado.',
            );
        }

        return String(usuarios[0].colaborador_id);
    }

    async crearVenta(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
    ): Promise<VentaContadoRegistrada> {
        const clienteId = await this.obtenerClienteId(manager, venta.cliente_slug);
        const colaboradorId = await this.obtenerColaboradorId(manager, contexto.userId);

        const registrada = await this.ventasService.crearVenta({
            cliente_id: clienteId,
            sucursal_id: contexto.sucursalId,
            colaborador_id: colaboradorId,
            cob_segmento_id: '17',
            tipo_venta: 1,
            total: Number(venta.total),
            saldo_actual: 0,
            estado: 3,
            num_cuotas: 0,
            is_aceptado: 1,
            tasa_mora: 0,
            estado_garantia: 0,
            is_facturado: 1,
            facturada: 1,
        }, manager);

        return {
            ventaId: String(registrada.id),
            codigoVenta: String(registrada.cod),
        };
    }

    async crearContrato(
        manager: EntityManager,
        venta: VentaContadoValidada,
        _contexto: ContextoProcesarVentaContado,
        ventaRegistrada: VentaContadoRegistrada,
    ): Promise<void> {
        const total = Number(venta.total);

        await this.pagosContratosService.crearPagoContrato({
            venta_id: ventaRegistrada.ventaId,
            pago_inicial: total,
            total_pago: 0,
            total_abonado: 0,
            saldo_actual: 0,
            detalle: 'VENTA DE CONTADO',
            is_mora: 0,
            mora: 0,
            inicio_mora: null,
            capital: 0,
            interes: 0,
            fecha_pago: new Date(),
            is_cobro_mora: 0,
            estado: 1,
            saldo_cap: total,
        }, manager);
    }

    async crearFactura(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        ventaRegistrada: VentaContadoRegistrada,
        numeracion: CodigoDirectriz,
    ): Promise<FacturaContadoRegistrada> {
        const total = Number(venta.total);
        const subTotal = Number(venta.sub_total);
        const impuesto = Number(venta.impuesto);
        const esEfectivo = venta.forma_pago_id === '3';
        const recibido = esEfectivo ? Number(venta.monto_recibido ?? venta.total) : total;

        if (!Number.isFinite(recibido) || recibido < total) {
            throw new BadRequestException(
                'El monto recibido no puede ser menor que el total de la venta.',
            );
        }

        const cambio = esEfectivo
            ? Math.round((recibido - total) * 100) / 100
            : 0;

        const resultado: { insertId?: number | string } = await manager.query(
            `
INSERT INTO factura_ventas (
    directrices__impresion_id,
    venta_id,
    sucursal_id,
    caja_id,
    user_id,
    fecha,
    hora,
    cuerpo,
    contador,
    sub_total,
    impuesto,
    total,
    efectivo,
    cambio,
    total_string,
    estado,
    descuento,
    created_at,
    updated_at
) VALUES (
        ?, ?, ?, ?, ?,
    CURDATE(), CURTIME(),
    NULL, ?, ?, ?, ?, ?, ?, ?,
    1, 0, NOW(), NOW()
)
    `,
            [
                numeracion.directriz_id,
                ventaRegistrada.ventaId,
                contexto.sucursalId,
                contexto.cajaId,
                contexto.userId,
                numeracion.contador_generado,
                subTotal,
                impuesto,
                total,
                recibido,
                cambio,
                this.montoLetras.convertir(total),
            ],
        );

        if (!resultado?.insertId) {
            throw new InternalServerErrorException(
                'No se pudo registrar la factura de contado.',
            );
        }

        return {
            facturaId: String(resultado.insertId),
            codigoFactura: numeracion.codigo,
        };
    }

    async registrarDetalles(
        manager: EntityManager,
        venta: VentaContadoValidada,
        ventaRegistrada: VentaContadoRegistrada,
        _facturaRegistrada: FacturaContadoRegistrada,
        remisiones: RemisionVentaCreada[],
    ): Promise<void> {
        let posicion = 0;

        for (const articulo of venta.articulos) {
            for (let unidad = 0; unidad < articulo.cantidad; unidad++) {
                const remision = remisiones[posicion++];

                if (
                    !remision ||
                    remision.articulo_id !== articulo.articulo_id ||
                    remision.es_regalia !== articulo.es_regalia
                ) {
                    throw new InternalServerErrorException(
                        `La remisión del artículo ${articulo.articulo_id} no coincide con el detalle de la venta.`,
                    );
                }

                await this.facturasContadosService.crearFacturaContado({
                    venta_id: ventaRegistrada.ventaId,
                    articulo_id: articulo.articulo_id,
                    cantidad: 1,
                    precio: articulo.es_regalia ? 0 : Number(articulo.precio),
                    total: articulo.es_regalia ? 0 : Number(articulo.precio),
                    is_remision: 1,
                    remision_articulo_id: remision.remision_articulo_id,
                    estado_articulo_id: articulo.estado_articulo_id,
                    combo_id: articulo.combo_id,
                }, manager);
            }
        }

        if (posicion !== remisiones.length) {
            throw new InternalServerErrorException(
                'Existen remisiones que no corresponden a los detalles de la venta.',
            );
        }
    }

    async registrarPago(
        manager: EntityManager,
        venta: VentaContadoValidada,
        contexto: ContextoProcesarVentaContado,
        _ventaRegistrada: VentaContadoRegistrada,
        facturaRegistrada: FacturaContadoRegistrada,
    ): Promise<void> {
        await this.historialCaja.registrar(manager, {
            caja_id: contexto.cajaId,
            forma_pago_id: venta.forma_pago_id,
            recibo_id: null,
            factura_id: facturaRegistrada.facturaId,
            referencia: facturaRegistrada.codigoFactura,
            total: venta.total,
            tipo: 0,
            tipo_documento: 1,
            historial: venta.observacion || null,
        });
    }

    async actualizarMotocicletas(
        manager: EntityManager,
        remisiones: RemisionVentaCreada[],
        _facturaRegistrada: FacturaContadoRegistrada,
    ): Promise<void> {
        const remisionIds = [...new Set(
            remisiones.map((remision) => String(remision.remision_articulo_id)),
        )];

        if (!remisionIds.length) return;

        const motocicletas: {
            id: string | number;
            remision_articulo_id: string | number;
            facturado: number | string | null;
        }[] = await manager.query(
            `
SELECT m.id, m.remision_articulo_id, m.facturado
FROM motocicletas m
WHERE m.remision_articulo_id IN (${remisionIds.map(() => '?').join(',')})
FOR UPDATE
    `,
            remisionIds,
        );

        if (!motocicletas.length) return;

        for (const motocicleta of motocicletas) {
            if (Number(motocicleta.facturado) === 1) {
                throw new BadRequestException(
                    `La motocicleta vinculada a la remisión ${motocicleta.remision_articulo_id} ya está facturada.`,
                );
            }
        }

        const resultado = await manager.query(
            `
UPDATE motocicletas
SET facturado = 1, estado_notificar = 1, updated_at = NOW()
WHERE remision_articulo_id IN (${remisionIds.map(() => '?').join(',')})
AND (facturado = 0 OR facturado IS NULL)
`,
            remisionIds,
        );

        if (resultado.affectedRows !== motocicletas.length) {
            throw new InternalServerErrorException(
                'No se pudieron actualizar todas las motocicletas vendidas.',
            );
        }
    }
}

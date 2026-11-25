import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CajaController } from './caja.controller.js';
import { CajaService } from './caja.service.js';
import { CajaSesionService } from './caja-sesion.service.js';
import { CajaCredencialesService } from './caja-credenciales.service.js';
import { CajaSesionDispositivoService } from './caja-sesion-dispositivo.service.js';
import { CajaDistribucionService } from './caja-distribucion.service.js';
import { CajaOperacionPagoService } from './caja-operacion-pago.service.js';

import { PostearCuentaHistorialCajaService } from './postear_cuenta/postear-cuenta-historial-caja.service.js';
import { PostearCuentaLimiteCreditoService } from './postear_cuenta/postear-cuenta-limite-credito.service.js';
import { PostearCuentaProcesarService } from './postear_cuenta/postear-cuenta-procesar.service.js';

import { DocumentosModule } from '../documentos/documentos.module.js';

import { FormasPagoController } from './formas-pago/formas-pago.controller.js';
import { FormasPagoService } from './formas-pago/formas-pago.service.js';
import { CarritosRemisionesService } from '../clientes/carritos_compras/carritos-remisiones.service.js';
import { CajaVentaContadoValidacionService } from './venta-contado/caja-venta-contado-validacion.service.js';
import { InventarioVentasService } from '../inventario/inventario-ventas.service.js';
import { CajaVentaContadoProcesarService } from './venta-contado/caja-venta-contado-procesar.service.js';
import { CajaVentaContadoSeriesService } from './venta-contado/caja-venta-contado-series.service.js';

import {
    Cajas,
    Users,
    Colaboradors,
    Sucursals,
    CajaSesiones,
    CajaOperacionPago,
    CajaSesionDispositivo,
    VentasEntity,
    PagosContratos,
} from '../../database/entities/index.js';

import { MailModule } from '../../common/mail/mail.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { PermisosModule } from '../../common/permisos/permisos.module.js';
import { ColaboradoresModule } from '../colaboradores/colaboradores.module.js';
import { AuthDocumentosModule } from '../auth-documentos/auth-documentos.module.js';

import { ActualizarPagosContratosService } from './postear_cuenta/actualizar-pagos-contratos.service.js';
import { PostearCuentaEstadoCuentaService } from './postear_cuenta/registrar-estado-cuenta.service.js';
import { PostearCuentaSegmentoService } from './postear_cuenta/postear-cuenta-segmento.service.js';
import { PostearCuentaDirectrizService } from './postear_cuenta/postear-cuenta-directriz.service.js';
import { PostearCuentaMontoLetrasService } from './postear_cuenta/postear-cuenta-monto-letras.service.js';
import { PostearCuentaRecibosService } from './postear_cuenta/postear-cuenta-recibos.service.js';

import { CajaConsultaService } from './caja-consulta.service.js';

import { CajaEgresosService } from './caja-egresos.service.js';
import { CajaEgresosController } from './egreso/caja-egresos.controller.js';
import { CajaAnticiposController } from './anticipos/caja-anticipos.controller.js';
import { CajaAnticiposService } from './anticipos/caja-anticipos.service.js';
import { CajaAnticiposRecibosService } from './anticipos/caja-anticipos-recibos.service.js';

import { NotasCreditoClientesModule } from '../notas-credito-clientes/notas-credito-clientes.module.js';

import { CajaVentaContadoController } from './venta-contado/caja-venta-contado.controller.js';
import { CajaVentaContadoService } from './venta-contado/caja-venta-contado.service.js';
import { InventarioMotocicletasService } from '../inventario/inventario-motocicletas.service.js';
import { CarritosImpuestosService } from '../clientes/carritos_compras/carritos-impuestos.service.js';
import { ClientesService } from '../clientes/clientes.service.js';
import { NotasCreditoDisponiblesService } from '../clientes/notas_credito_clientes/notas-credito-disponibles.service.js';
import { CajaVentaContadoIntegracionService } from './venta-contado/caja-venta-contado-integracion.service.js';
import { DocumentosService } from '../documentos/documentos.service.js';
import { VentasModule } from '../ventas/ventas.module.js';
import { PagosContratosModule } from '../ventas/pagos_contratos/pagos_contratos.module.js';
import { FacturasContadosModule } from '../ventas/facturas_contados/facturas-contados.module.js';
import { OrdenEntregaVentasService } from '../ventas/inventario/orden-entrega-ventas.service.js';
import { FacturaPdfService } from '../documentos/caja/factura-pdf.service.js';

import { CajaCierresService } from './caja-cierres.service.js';
import { CajaCierresConsultaService } from './caja-cierres-consulta.service.js';
import { CajaCierresDocumentoService } from './caja-cierres-documento.service.js';
import { CajaHistorialCierresController } from './caja-historial-cierres.controller.js';
import { CajaHistorialCierresService } from './caja-historial-cierres.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Cajas,
            Users,
            Colaboradors,
            Sucursals,
            CajaSesiones,
            CajaOperacionPago,
            CajaSesionDispositivo,
            VentasEntity,
            PagosContratos,
        ]),

        MailModule,
        UsuariosModule,
        PermisosModule,
        ColaboradoresModule,
        AuthDocumentosModule,
        forwardRef(() => DocumentosModule),
        NotasCreditoClientesModule,
        VentasModule,
        PagosContratosModule,
        FacturasContadosModule,
    ],

    controllers: [
        CajaController,
        FormasPagoController,
        CajaEgresosController,

        // Venta de contado
        CajaVentaContadoController,
        CajaAnticiposController,
        CajaHistorialCierresController
    ],

    providers: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,
        CajaSesionDispositivoService,
        FormasPagoService,
        CajaDistribucionService,
        CajaOperacionPagoService,
        ClientesService,
        CajaCierresDocumentoService,
        NotasCreditoDisponiblesService,

        // ====================================
        // POSTEO DE CUENTA
        // ====================================

        ActualizarPagosContratosService,
        PostearCuentaEstadoCuentaService,
        PostearCuentaSegmentoService,
        PostearCuentaDirectrizService,
        PostearCuentaMontoLetrasService,
        PostearCuentaRecibosService,
        PostearCuentaHistorialCajaService,
        PostearCuentaLimiteCreditoService,
        PostearCuentaProcesarService,
        CarritosRemisionesService,
        CarritosImpuestosService,

        // ====================================
        // CONSULTAS DE CAJA
        // ====================================

        CajaConsultaService,

        // ====================================
        // EGRESOS
        // ====================================

        CajaEgresosService,

        // ====================================
        // VENTA DE CONTADO
        // ====================================

        CajaVentaContadoService,
        CajaAnticiposService,
        CajaAnticiposRecibosService,
        InventarioMotocicletasService,
        CajaVentaContadoValidacionService,
        InventarioVentasService,
        CajaVentaContadoProcesarService,
        CajaVentaContadoIntegracionService,
        CajaVentaContadoSeriesService,
        DocumentosService,
        OrdenEntregaVentasService,
        FacturaPdfService,

        // ====================================
        // CIERRES DE CAJA
        // ====================================

        CajaCierresService,
        CajaCierresConsultaService,
        CajaHistorialCierresService,
    ],

    exports: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,

        // Compartido con otros módulos
        CajaVentaContadoService,
        DocumentosModule,
    ],
})
export class CajaModule {}
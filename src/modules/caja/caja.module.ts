
import { Module } from '@nestjs/common';
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
        DocumentosModule,
        NotasCreditoClientesModule
    ],

    controllers: [
        CajaController,
        FormasPagoController,
        CajaEgresosController,

        // Venta de contado
        CajaVentaContadoController,
        CajaAnticiposController
    ],

    providers: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,
        CajaSesionDispositivoService,
        FormasPagoService,
        CajaDistribucionService,
        CajaOperacionPagoService,

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
    ],

    exports: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,

        // Compartido con otros módulos
        CajaVentaContadoService,
    ],
})
export class CajaModule {}

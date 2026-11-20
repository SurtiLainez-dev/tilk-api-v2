import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';

import { AuthModule } from './auth/auth.module.js';
import { CajaModule } from './modules/caja/caja.module.js';
import { MailModule } from './common/mail/mail.module.js';
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module.js';
import { CuentasModule } from './modules/cuentas/cuentas.module.js';
import { DocumentosModule } from './modules/documentos/documentos.module.js';
import { SpacesModule } from './modules/spaces/spaces.module.js';

// ============================================
// MÓDULOS - VENTA DE CONTADO
// ============================================

import { ClientesModule } from './modules/clientes/clientes.module.js';
import { CarritosModule } from './modules/clientes/carritos_compras/carritos.module.js';
import { InventarioModule } from './modules/inventario/inventario.module.js';
import { ArticulosModule } from './modules/inventario/articulos/articulos.module.js';
import { PreciosModule } from './modules/inventario/precios/precios.module.js';

import {NotasCreditoClientesModule} from "./modules/notas-credito-clientes/notas-credito-clientes.module.js";
import { VentasModule } from './modules/ventas/ventas.module.js';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module.js';

@Module({
  imports: [
    // CONFIGURACIÓN GENERAL
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DatabaseModule,

    // MÓDULOS EXISTENTES
    SpacesModule,
    AuthModule,
    CajaModule,
    MailModule,
    ColaboradoresModule,
    CuentasModule,
    DocumentosModule,
    WhatsappModule,

    // VENTA DE CONTADO
    ClientesModule,
    CarritosModule,
    InventarioModule,
    ArticulosModule,
    PreciosModule,

    NotasCreditoClientesModule,
    VentasModule
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}
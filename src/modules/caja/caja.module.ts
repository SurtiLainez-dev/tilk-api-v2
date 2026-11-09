
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CajaController } from './caja.controller.js';
import { CajaService } from './caja.service.js';
import { CajaSesionService } from './caja-sesion.service.js';
import { CajaCredencialesService } from './caja-credenciales.service.js';

import {
    Cajas,
    Users,
    Colaboradors,
    Sucursals,
    CajaSesiones,
    CajaOperacionPago,
    CajaSesionDispositivo
} from '../../database/entities/index.js';

import { MailModule } from '../../common/mail/mail.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { PermisosModule } from '../../common/permisos/permisos.module.js';
import { ColaboradoresModule } from '../colaboradores/colaboradores.module.js';
import {CajaSesionDispositivoService} from "./caja-sesion-dispositivo.service.js";
import {FormasPagoController} from "./formas-pago/formas-pago.controller.js";
import {FormasPagoService} from "./formas-pago/formas-pago.service.js";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Cajas,
            Users,
            Colaboradors,
            Sucursals,
            CajaSesiones,
            CajaOperacionPago,
            CajaSesionDispositivo
        ]),
        MailModule,
        UsuariosModule,
        PermisosModule,
        ColaboradoresModule,
    ],
    controllers: [
        CajaController,
        FormasPagoController
    ],
    providers: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,
        CajaSesionDispositivoService,
        FormasPagoService
    ],
    exports: [
        CajaService,
        CajaSesionService,
        CajaCredencialesService,
    ],
})
export class CajaModule {}

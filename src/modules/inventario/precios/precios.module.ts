
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PrecioService } from './precio.service.js';
import { PreciosController } from './precios.controller.js';

import { CajaVentaContadoService } from '../../caja/venta-contado/caja-venta-contado.service.js';
import { CajaSesionService } from '../../caja/caja-sesion.service.js';

import {
    Cajas,
    CajaSesiones,
} from '../../../database/entities/index.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Cajas,
            CajaSesiones,
        ]),
    ],

    controllers: [
        PreciosController,
    ],

    providers: [
        PrecioService,
        CajaVentaContadoService,
        CajaSesionService,
    ],

    exports: [
        PrecioService,
    ],
})
export class PreciosModule {}

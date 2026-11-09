import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CuentasController } from './cuentas.controller.js';
import { CuentasService } from './cuentas.service.js';
import { CuentasDetalleService } from './cuentas-detalle.service.js';

import {
    VentasEntity,
    Clientes,
} from '../../database/entities/index.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            VentasEntity,
            Clientes,
        ]),
    ],
    controllers: [
        CuentasController,
    ],
    providers: [
        CuentasService,
        CuentasDetalleService,
    ],
    exports: [
        CuentasService,
        CuentasDetalleService,
    ],
})
export class CuentasModule {}
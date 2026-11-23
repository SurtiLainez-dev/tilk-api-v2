import { Module } from '@nestjs/common';

import { CajaModule } from '../../caja/caja.module.js';

import { CarritosController } from './carritos.controller.js';
import { CarritosService } from './carritos.service.js';
import { CarritosConsultasService } from './carritos-consultas.service.js';
import { CarritosArticulosService } from './carritos-articulos.service.js';
import { CarritosGuardarService } from './carritos-guardar.service.js';
import { CarritosRegaliasService } from './carritos-regalias.service.js';
import { CarritosFacturacionController } from './carritos-facturacion.controller.js';
import { CarritosFacturacionService } from './carritos-facturacion.service.js';

@Module({
    imports: [
        CajaModule,
    ],

    controllers: [
        CarritosController,
        CarritosFacturacionController
    ],

    providers: [
        CarritosService,
        CarritosConsultasService,
        CarritosArticulosService,
        CarritosGuardarService,
        CarritosRegaliasService,
        CarritosFacturacionService
    ],

    exports: [
        CarritosService,
        CarritosConsultasService,
        CarritosGuardarService,
    ],
})
export class CarritosModule {}
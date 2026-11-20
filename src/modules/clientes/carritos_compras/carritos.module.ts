import { Module } from '@nestjs/common';

import { CajaModule } from '../../caja/caja.module.js';

import { CarritosController } from './carritos.controller.js';
import { CarritosService } from './carritos.service.js';
import { CarritosConsultasService } from './carritos-consultas.service.js';
import { CarritosArticulosService } from './carritos-articulos.service.js';
import { CarritosGuardarService } from './carritos-guardar.service.js';

@Module({
    imports: [
        CajaModule,
    ],

    controllers: [
        CarritosController,
    ],

    providers: [
        CarritosService,
        CarritosConsultasService,
        CarritosArticulosService,
        CarritosGuardarService,
    ],

    exports: [
        CarritosService,
        CarritosConsultasService,
        CarritosGuardarService,
    ],
})
export class CarritosModule {}
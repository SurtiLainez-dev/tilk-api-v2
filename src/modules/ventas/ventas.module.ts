import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import {

    VentasEntity,
    Sucursals,
    Colaboradors,
    CobSegmentos,
    CobPortafolios,

} from '../../database/entities/index.js';

import {

    VentasController,

} from './ventas.controller.js';

import {

    VentasService,

} from './ventas.service.js';

@Module({

    imports: [

        TypeOrmModule.forFeature([

            VentasEntity,
            Sucursals,
            Colaboradors,
            CobSegmentos,
            CobPortafolios,

        ]),

    ],

    controllers: [

        VentasController,

    ],

    providers: [

        VentasService,

    ],

    exports: [

        VentasService,

    ],

})
export class VentasModule {}
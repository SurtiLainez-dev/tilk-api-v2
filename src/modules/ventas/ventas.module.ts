import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import {
    VentasEntity,
    Sucursals,
    Colaboradors,
    CobSegmentos,
    CobPortafolios,} from '../../database/entities/index.js';

import {VentasController,} from './ventas.controller.js';
import {VentasService,} from './ventas.service.js';
import { VentasCodigoService } from './ventas-codigo.service.js';
import { CobPortafoliosModule } from '../cobros/portafolios/cob-portafolios.module.js';

@Module({

    imports: [

        TypeOrmModule.forFeature([

            VentasEntity,
            Sucursals,
            Colaboradors,
            CobSegmentos,
            CobPortafolios,
        ]),
        CobPortafoliosModule,
    ],

    controllers: [

        VentasController,

    ],

    providers: [

        VentasService,
        VentasCodigoService
    ],

    exports: [

        VentasService,

    ],

})
export class VentasModule {}

import { Module } from '@nestjs/common';

import { CajaModule } from '../../caja/caja.module.js';

// Controlador
import { ArticulosController } from './articulos.controller.js';

// Servicios
import { ArticulosService } from './articulos.service.js';
import { ArticulosSeriesService } from './articulos-series.service.js';

@Module({
    imports: [
        CajaModule,
    ],

    controllers: [
        ArticulosController,
    ],

    providers: [
        ArticulosService,
        ArticulosSeriesService,
    ],

    exports: [
        ArticulosService,
        ArticulosSeriesService,
    ],
})
export class ArticulosModule {}

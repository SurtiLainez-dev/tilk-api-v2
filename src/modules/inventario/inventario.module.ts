
import { Module } from '@nestjs/common';

// Módulo de Caja
import { CajaModule} from "../caja/caja.module.js";

// Controlador principal
import { InventarioController } from './inventario.controller.js';

// Servicios de inventario
import { InventarioService } from './inventario.service.js';
import { InventarioStockService } from './inventario-stock.service.js';

// Módulo de precios
import { PreciosModule } from './precios/precios.module.js';

@Module({
    imports: [
        CajaModule,
        PreciosModule,
    ],

    controllers: [
        InventarioController,
    ],

    providers: [
        InventarioService,
        InventarioStockService,
    ],

    exports: [
        InventarioService,
        InventarioStockService,
    ],
})
export class InventarioModule {}

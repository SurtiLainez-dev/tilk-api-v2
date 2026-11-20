
import { Module } from '@nestjs/common';

import { ClientesController } from './clientes.controller.js';
import { ClientesService } from './clientes.service.js';
import { ClientesBusquedaService } from './clientes-busqueda.service.js';

@Module({
    imports: [],

    controllers: [
        ClientesController,
    ],

    providers: [
        ClientesService,
        ClientesBusquedaService,
    ],

    exports: [
        ClientesService,
        ClientesBusquedaService,
    ],
})
export class ClientesModule {}

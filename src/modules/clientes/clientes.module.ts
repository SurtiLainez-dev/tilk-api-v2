
import { Module } from '@nestjs/common';

import { ClientesController } from './clientes.controller.js';
import { ClientesService } from './clientes.service.js';
import { ClientesBusquedaService } from './clientes-busqueda.service.js';
import { CarritosImpuestosService} from "./carritos_compras/carritos-impuestos.service.js";
import { NotasCreditoDisponiblesService } from '../clientes/notas_credito_clientes/notas-credito-disponibles.service.js';
import { CarritosRegaliasLoteController} from "./carritos_compras/carritos-regalias-lote.controller.js";
import { CarritosRegaliasLoteService} from "./carritos_compras/carritos-regalias-lote.service.js";

@Module({
    imports: [],

    controllers: [
        ClientesController,
        CarritosRegaliasLoteController
    ],

    providers: [
        ClientesService,
        ClientesBusquedaService,
        CarritosImpuestosService,
        NotasCreditoDisponiblesService,
        CarritosRegaliasLoteService
    ],

    exports: [
        ClientesService,
        ClientesBusquedaService,
    ],
})
export class ClientesModule {}

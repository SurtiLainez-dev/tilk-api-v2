
import {
    Controller,
    Get,
    Query,
} from '@nestjs/common';
import { ClientesBusquedaService } from './clientes-busqueda.service.js';

@Controller('clientes')
export class ClientesController {
    constructor(
        private readonly clientesBusquedaService: ClientesBusquedaService,
    ) {}

    @Get('buscar')
    buscar(@Query('buscar') buscar: string) {
        return this.clientesBusquedaService.buscar(buscar);
    }
}

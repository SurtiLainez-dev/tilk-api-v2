import {
    Controller,
    Get,
    Param,
} from '@nestjs/common';

import {VentasService,} from './ventas.service.js';

@Controller('ventas')
export class VentasController {
    constructor(

        private readonly ventasService:
            VentasService,

    ) {}

    @Get('cliente/:clienteSlug/cuentas-activas')
    async obtenerCuentasActivas(

        @Param('clienteSlug')
            clienteSlug: string,

    ) {

        return this.ventasService
            .obtenerCuentasActivas(
                clienteSlug,
            );

    }

}
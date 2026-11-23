
import { Controller, Get, Param } from '@nestjs/common';
import { CarritosFacturacionService } from './carritos-facturacion.service.js';

@Controller('facturacion/carritos')
export class CarritosFacturacionController {
    constructor(private readonly carritos: CarritosFacturacionService) {}

    @Get('cliente/:clienteSlug/abiertos')
    buscarAbiertos(@Param('clienteSlug') clienteSlug: string) {
        return this.carritos.buscarAbiertos(clienteSlug);
    }

    @Get(':carritoSlug')
    obtenerDetalle(@Param('carritoSlug') carritoSlug: string) {
        return this.carritos.obtenerDetalle(carritoSlug);
    }
}

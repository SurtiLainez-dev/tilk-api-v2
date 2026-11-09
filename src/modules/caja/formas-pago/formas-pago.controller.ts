
import { Controller, Get } from '@nestjs/common';
import { FormasPagoService } from './formas-pago.service.js';

@Controller('caja/formas-pago')
export class FormasPagoController {
    constructor(
        private readonly service: FormasPagoService,
    ) {}

    @Get()
    listar() {
        return this.service.listar();
    }
}

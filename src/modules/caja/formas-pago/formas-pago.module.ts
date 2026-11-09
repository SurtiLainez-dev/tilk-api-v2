
import { Module } from '@nestjs/common';
import { FormasPagoController } from './formas-pago.controller.js';
import { FormasPagoService } from './formas-pago.service.js';

@Module({
    controllers: [FormasPagoController],
    providers: [FormasPagoService],
    exports: [FormasPagoService],
})
export class FormasPagoModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FacturasContados } from '../../../database/entities/index.js';
import { FacturasContadosService } from './facturas-contados.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([FacturasContados])],
    providers: [FacturasContadosService],
    exports: [FacturasContadosService],
})
export class FacturasContadosModule {}

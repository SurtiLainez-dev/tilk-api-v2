
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosContratos } from '../../../database/entities/index.js';
import { PagosContratosService } from './pagos-contratos.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([PagosContratos])],
    providers: [PagosContratosService],
    exports: [PagosContratosService],
})
export class PagosContratosModule {}

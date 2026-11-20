import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TipoNotaCreditosEntity, NotaCreditoClientes, NotaCreditoClienteContadores, NotaCreditoClienteAplicaciones } from '../../database/entities/index.js';
import { SpacesModule } from '../spaces/spaces.module.js';

import { NotasCreditoClientesController } from './notas-credito-clientes.controller.js';
import { NotasCreditoClientesService } from './notas-credito-clientes.service.js';
import { NotasCreditoRegistroService } from './notas-credito-registro.service.js';
import { NotasCreditoContadoresService } from './notas-credito-contadores.service.js';
import { NotasCreditoConsultasService } from './notas-credito-consultas.service.js';
import { NotasCreditoAnulacionService } from './notas-credito-anulacion.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TipoNotaCreditosEntity,
            NotaCreditoClientes,
            NotaCreditoClienteContadores,
            NotaCreditoClienteAplicaciones,
        ]),
        SpacesModule,
    ],
    controllers: [NotasCreditoClientesController],
    providers: [
        NotasCreditoClientesService,
        NotasCreditoRegistroService,
        NotasCreditoContadoresService,
        NotasCreditoConsultasService,
        NotasCreditoAnulacionService,
    ],
    exports: [NotasCreditoClientesService, NotasCreditoContadoresService],
})
export class NotasCreditoClientesModule {}
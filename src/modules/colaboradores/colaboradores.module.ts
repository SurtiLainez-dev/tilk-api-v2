
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
    Colaboradors,
    Users,
    Sucursals,
} from '../../database/entities/index.js';

import { ColaboradoresController } from './colaboradores.controller.js';
import { ColaboradoresService } from './colaboradores.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Colaboradors,
            Users,
            Sucursals,
        ]),
    ],
    controllers: [ColaboradoresController],
    providers: [ColaboradoresService],
    exports: [ColaboradoresService],
})
export class ColaboradoresModule {}

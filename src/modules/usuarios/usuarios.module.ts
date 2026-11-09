
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Users } from '../../database/entities/index.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([Users]),
    ],
    providers: [
        UsuariosService,
    ],
    exports: [
        UsuariosService,
    ],
})
export class UsuariosModule {}

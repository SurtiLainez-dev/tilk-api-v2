
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CobPortafolios } from '../../../database/entities/index.js';
import { CobPortafoliosService } from './cob-portafolios.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([CobPortafolios])],
    providers: [CobPortafoliosService],
    exports: [CobPortafoliosService],
})
export class CobPortafoliosModule {}

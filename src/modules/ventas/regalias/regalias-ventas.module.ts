
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegaliasVentasEntity} from "../../../database/entities/index.js";
import { RegaliasVentasService } from './regalias-ventas.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([RegaliasVentasEntity])],
    providers: [RegaliasVentasService],
    exports: [RegaliasVentasService],
})
export class RegaliasVentasModule {}

import { Module } from '@nestjs/common';
import { FacturacionVentasService } from './facturacion-ventas.service.js';
import { CajaModule } from '../caja/caja.module.js';

@Module({
    imports: [CajaModule],
    providers: [FacturacionVentasService],
    exports: [FacturacionVentasService],
})
export class FacturacionVentasModule {}
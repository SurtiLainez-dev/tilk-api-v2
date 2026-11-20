
import { Injectable } from '@nestjs/common';
import { InventarioStockService } from './inventario-stock.service.js';

@Injectable()
export class InventarioService {
    constructor(
        private readonly stockService: InventarioStockService,
    ) {}

    obtenerStockSucursal(sucursalId: string) {
        return this.stockService.consultarPorSucursal(
            sucursalId,
        );
    }
}

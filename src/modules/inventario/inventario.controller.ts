
import {
    Controller,
    Get,
    Headers,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { InventarioStockService } from './inventario-stock.service.js';
import { CajaVentaContadoService } from '../caja/venta-contado/caja-venta-contado.service.js';

interface SolicitudAutenticada {
    user?: {
        id?: string | number;
    };
}

@Controller('inventario')
export class InventarioController {
    constructor(
        private readonly stockService: InventarioStockService,
        private readonly cajaVentaContado: CajaVentaContadoService,
    ) {}

    @Get('stock')
    async obtenerStock(
        @Req() request: SolicitudAutenticada,
        @Headers('x-caja-token') token: string,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'Usuario no autenticado.',
            );
        }

        const contexto = await this.cajaVentaContado.obtenerContexto(
            token,
            String(request.user.id),
        );

        return this.stockService.consultarPorSucursal(
            contexto.sucursalId,
        );
    }
}


import {
    Controller,
    Get,
    Headers,
    Param,
    Req,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventarioStockService } from './inventario-stock.service.js';
import { CajaVentaContadoService } from '../caja/venta-contado/caja-venta-contado.service.js';

interface SolicitudAutenticada {
    user?: { id?: string | number };
}

@Controller('inventario')
export class InventarioController {
    constructor(
        private readonly stockService: InventarioStockService,
        private readonly cajaVentaContado: CajaVentaContadoService,
        private readonly dataSource: DataSource,
    ) {}

    @Get('stock')
    async obtenerStock(
        @Req() request: SolicitudAutenticada,
        @Headers('x-caja-token') token: string,
    ) {
        if (!request.user?.id) throw new UnauthorizedException('Usuario no autenticado.');

        const contexto = await this.cajaVentaContado.obtenerContexto(token, String(request.user.id));
        return this.stockService.consultarPorSucursal(contexto.sucursalId);
    }

    @Get('stock_x_sucursal/:sucursalId')
    async obtenerStockPorSucursal(
        @Req() request: SolicitudAutenticada,
        @Param('sucursalId') sucursalId: string,
    ) {
        if (!request.user?.id) throw new UnauthorizedException('Usuario no autenticado.');

        if (!sucursalId?.trim() || !/^\d+$/.test(sucursalId) || Number(sucursalId) <= 0) {
            throw new BadRequestException('Se requiere un ID válido de sucursal.');
        }

        const filas: Array<{ id: string | number }> = await this.dataSource.query(
            'SELECT id FROM sucursals WHERE id = ? LIMIT 1',
            [sucursalId],
        );

        if (!filas.length) throw new NotFoundException('Sucursal no encontrada.');

        return this.stockService.consultarPorSucursal(String(filas[0].id));
    }
}

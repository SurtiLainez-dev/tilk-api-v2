
import {
    Controller,
    Get,
    Headers,
    Param,
    Req,
    UnauthorizedException,
} from '@nestjs/common';

import { PrecioService } from './precio.service.js';

import { CajaVentaContadoService } from
        '../../caja/venta-contado/caja-venta-contado.service.js';

interface SolicitudAutenticada {
    user?: {
        id?: string | number;
    };
}

@Controller('precios')
export class PreciosController {
    constructor(
        private readonly precioService: PrecioService,
        private readonly cajaVentaContado: CajaVentaContadoService,
    ) {}

    @Get('contado/articulo/:slug')
    async consultarPrecioContado(
        @Param('slug') articuloSlug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'Usuario no autenticado.',
            );
        }

        const contexto =
            await this.cajaVentaContado.obtenerContexto(
                token,
                String(request.user.id),
            );

        const data =
            await this.precioService.consultarPorArticuloSlug(
                articuloSlug,
                contexto.sucursalId,
            );

        return {
            success: true,
            message: 'Precio de contado consultado correctamente.',
            data,
        };
    }
}

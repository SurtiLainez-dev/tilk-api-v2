import { Body, Controller, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CarritosRegaliasLoteService, type CambioRegaliaLote } from './carritos-regalias-lote.service.js';
interface SolicitudAutenticada { user?: { id?: string | number } }
@Controller('facturacion/carritos')
export class CarritosRegaliasLoteController {
    constructor(private readonly regaliasLote: CarritosRegaliasLoteService) {}
    @Post(':carritoSlug/regalias/lote')
    guardar(
        @Req() request: SolicitudAutenticada,
        @Param('carritoSlug') carritoSlug: string,
        @Body() body: { cambios: CambioRegaliaLote[] },
    ) {
        if (!request.user?.id) throw new UnauthorizedException('Usuario no autenticado.');

        return this.regaliasLote.guardar(
            carritoSlug,
            body?.cambios,
            String(request.user.id),
        );
    }
}

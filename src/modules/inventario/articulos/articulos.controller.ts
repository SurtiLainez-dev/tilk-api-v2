
import {
    Controller,
    Get,
    Headers,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { ArticulosSeriesService } from './articulos-series.service.js';
import { CajaVentaContadoService } from '../../caja/venta-contado/caja-venta-contado.service.js';

interface SolicitudAutenticada {
    user?: {
        id?: string | number;
    };
}

@Controller('articulos')
export class ArticulosController {
    constructor(
        private readonly seriesService: ArticulosSeriesService,
        private readonly cajaVentaContado: CajaVentaContadoService,
    ) {}

    @Get('series')
    async obtenerSeries(
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

        return this.seriesService.consultarDisponibles(
            contexto.sucursalId,
        );
    }
}

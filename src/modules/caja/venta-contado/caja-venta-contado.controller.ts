
import {
    Controller,
    Get,
    Headers,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { CajaVentaContadoService } from './caja-venta-contado.service.js';

interface SolicitudAutenticada {
    user?: {
        id?: string | number;
    };
}

@Controller('caja/venta-contado')
export class CajaVentaContadoController {
    constructor(
        private readonly ventaContadoService: CajaVentaContadoService,
    ) {}

    @Get('iniciar')
    async iniciar(
        @Req() request: SolicitudAutenticada,
        @Headers('x-caja-token') token: string,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'Usuario no autenticado.',
            );
        }

        await this.ventaContadoService.obtenerContexto(
            token,
            String(request.user.id),
        );

        return {
            success: true,
            message: 'Sesión de caja válida para venta de contado.',
            data: {
                puede_iniciar: true,
            },
        };
    }
}

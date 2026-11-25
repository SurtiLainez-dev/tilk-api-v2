import {
    Body,
    Controller,
    Get,
    Headers,
    Logger,
    Post,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import { CajaVentaContadoService } from './caja-venta-contado.service.js';
import { CajaVentaContadoProcesarService } from './caja-venta-contado-procesar.service.js';
import { CajaVentaContadoIntegracionService } from './caja-venta-contado-integracion.service.js';
import type { CrearVentaContadoDto } from './caja-venta-contado-validacion.service.js';

interface SolicitudAutenticada {
    user?: { id?: string | number };
}

@Controller('caja/venta-contado')
export class CajaVentaContadoController {
    private readonly logger = new Logger(CajaVentaContadoController.name);

    constructor(
        private readonly ventaContadoService: CajaVentaContadoService,
        private readonly procesarService: CajaVentaContadoProcesarService,
        private readonly integracionService: CajaVentaContadoIntegracionService,
    ) {}

    @Get('iniciar')
    async iniciar(
        @Req() request: SolicitudAutenticada,
        @Headers('x-caja-token') token: string,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        await this.ventaContadoService.obtenerContexto(
            token,
            String(request.user.id),
        );

        return {
            success: true,
            message: 'Sesión de caja válida para venta de contado.',
            data: { puede_iniciar: true },
        };
    }

    @Post('registrar')
    async registrar(
        @Req() request: SolicitudAutenticada,
        @Headers('x-caja-token') token: string,
        @Body() datos: CrearVentaContadoDto,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        const userId = String(request.user.id);
        const contexto = await this.ventaContadoService.obtenerContexto(token, userId);

        this.logger.log(
            `[REGISTRAR_INICIO] Usuario=${userId} Caja=${contexto.cajaId} Sucursal=${contexto.sucursalId}`,
        );

        try {
            const resultado = await this.procesarService.procesar(
                datos,
                {
                    cajaId: contexto.cajaId,
                    sucursalId: contexto.sucursalId,
                    userId,
                },
                this.integracionService,
            );

            this.logger.log(
                `[REGISTRAR_OK] Venta=${resultado.data.codigo_venta} Factura=${resultado.data.codigo_factura}`,
            );

            return resultado;
        } catch (error) {
            this.logger.error(
                `[REGISTRAR_ERROR] Usuario=${userId} Caja=${contexto.cajaId} Error=${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw error;
        }
    }
}
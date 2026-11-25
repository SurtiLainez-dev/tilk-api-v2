import { Controller, Get, Param, Headers, Req, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/guards/passport-auth.guard.js';

import { CajaSesionService } from './caja-sesion.service.js';
import { CajaHistorialCierresService } from './caja-historial-cierres.service.js';

@Controller('caja/historial-cierres')
export class CajaHistorialCierresController {

    constructor(
        private readonly cajaSesionService: CajaSesionService,
        private readonly historialService: CajaHistorialCierresService,
    ) {}

    // ==========================================
    // VALIDAR CONTEXTO DE CAJA
    // ==========================================

    private async obtenerContexto(token: string, request: AuthenticatedRequest) {
        const userId = request.user?.id;

        if (!userId) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        if (typeof token !== 'string' || !token.trim()) {
            throw new UnauthorizedException('No se recibió el token de sesión de caja.');
        }

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), String(userId));

        if (!sesion?.data?.caja_id || !String(sesion.data.caja_id).trim()) {
            throw new UnauthorizedException('No se pudo identificar la caja de la sesión activa.');
        }

        return {
            cajaId: String(sesion.data.caja_id),
            userId: String(userId),
        };
    }

    // ==========================================
    // LISTAR CIERRES
    // ==========================================

    @Get()
    async listar(
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const contexto = await this.obtenerContexto(token, request);

        return this.historialService.listar(contexto.cajaId);
    }

    // ==========================================
    // DETALLES DEL CIERRE
    // ==========================================

    @Get(':fecha')
    async obtenerDetalle(
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const contexto = await this.obtenerContexto(token, request);

        return this.historialService.obtenerDetalle(contexto.cajaId, fecha);
    }

    // ==========================================
    // DOCUMENTO FIRMADO
    // ==========================================

    @Get(':fecha/documento')
    async obtenerDocumento(
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const contexto = await this.obtenerContexto(token, request);
        const archivo = await this.historialService.obtenerArchivo(contexto.cajaId, fecha);

        return {
            success: true,
            data: {
                path: archivo,
            },
        };
    }
}
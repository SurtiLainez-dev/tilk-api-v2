import {
    Controller,
    Get,
    Post,
    Put,
    Req,
    Param,
    Body,
    Headers,
    BadRequestException,
} from '@nestjs/common';

import type { Request } from 'express';

import { CajaService } from './caja.service.js';
import { CajaSesionService } from './caja-sesion.service.js';
import { CajaCredencialesService } from './caja-credenciales.service.js';

import { PermisosService } from '../../common/permisos/permisos.service.js';

import type {
    AuthenticatedRequest,
} from '../../auth/guards/passport-auth.guard.js';

@Controller('caja')
export class CajaController {
    constructor(
        private readonly cajaService: CajaService,
        private readonly cajaSesionService: CajaSesionService,
        private readonly cajaCredencialesService: CajaCredencialesService,
        private readonly permisosService: PermisosService,
    ) {}

    // ==========================================
    // LISTAR CAJAS DEL USUARIO
    // ==========================================
    @Get('cajas')
    async listarCajas(
        @Req() request: AuthenticatedRequest,
    ) {
        return this.cajaService.listarCajas(
            String(request.user.id),
        );
    }

    // ==========================================
    // LISTAR CAJAS GENERALES
    // ==========================================
    @Get('generales')
    async listarCajasGenerales() {
        return this.cajaService.listarCajasGenerales();
    }

    // ==========================================
    // OBTENER CAJA GENERAL POR SLUG
    // ==========================================
    @Get('generales/:slug')
    async obtenerCajaGeneralPorSlug(
        @Param('slug') slug: string,
    ) {
        return this.cajaService.obtenerCajaGeneralPorSlug(slug);
    }

    // ==========================================
    // INICIAR SESIÓN DE CAJA
    // ==========================================
    @Post('sesion/iniciar')
    async iniciarSesion(
        @Req() request: AuthenticatedRequest & Request,
        @Body() body: {
            slug: string;
            password: string;
        },
    ) {
        if (
            typeof body?.slug !== 'string' ||
            typeof body?.password !== 'string' ||
            !body.slug.trim() ||
            !body.password
        ) {
            throw new BadRequestException(
                'Debes proporcionar el slug y el PIN de Caja.',
            );
        }

        return this.cajaSesionService.iniciarSesion(
            body.slug,
            body.password,
            String(request.user.id),
            request,
        );
    }

    // ==========================================
    // VALIDAR SESIÓN DE CAJA
    // ==========================================
    @Get('sesion/validar')
    async validarSesion(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
    ) {
        return this.cajaSesionService.validarSesion(
            token,
            String(request.user.id),
        );
    }

    // ==========================================
    // CERRAR SESIÓN DE CAJA
    // ==========================================
    @Post('sesion/cerrar')
    async cerrarSesion(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
    ) {
        return this.cajaSesionService.cerrarSesion(
            token,
            String(request.user.id),
        );
    }

    // ==========================================
    // CAMBIAR USUARIO ASIGNADO A UNA CAJA
    // Requiere acceso al módulo Contabilidad
    // ==========================================
    @Put(':cajaId/usuario')
    async cambiarUsuarioCaja(
        @Req() request: AuthenticatedRequest,
        @Param('cajaId') cajaId: string,
        @Body() body: {
            user_id: string;
        },
    ) {
        // Verificar permisos del usuario autenticado
        await this.permisosService.verificarAccesoModulo(
            String(request.user.id),
            'contabilidad',
        );

        // Validar nuevo usuario
        if (
            body?.user_id === null ||
            body?.user_id === undefined ||
            !String(body.user_id).trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar el nuevo usuario.',
            );
        }

        // Cambiar usuario y generar nuevas credenciales
        return this.cajaCredencialesService.cambiarUsuario(
            cajaId,
            String(body.user_id),
        );
    }

    // ==========================================
    // REGENERAR PIN DE UNA CAJA
    // Requiere acceso al módulo Contabilidad
    // ==========================================
    @Post(':cajaId/regenerar-pin')
    async regenerarPinCaja(
        @Req() request: AuthenticatedRequest,
        @Param('cajaId') cajaId: string,
    ) {
        // Verificar permisos del usuario autenticado
        await this.permisosService.verificarAccesoModulo(
            String(request.user.id),
            'contabilidad',
        );

        // Regenerar PIN y enviar correo
        return this.cajaCredencialesService.regenerarPin(
            cajaId,
        );
    }

}
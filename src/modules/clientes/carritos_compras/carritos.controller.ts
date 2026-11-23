
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
    Req,
    UnauthorizedException,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';

import { CarritosConsultasService } from './carritos-consultas.service.js';
import { CajaVentaContadoService } from '../../caja/venta-contado/caja-venta-contado.service.js';
import { CarritosArticulosService } from './carritos-articulos.service.js';
import { CarritosGuardarService } from './carritos-guardar.service.js';
import {
    CarritosRegaliasService,
    type GuardarRegaliaDto,
    type ActualizarRegaliaDto,
} from './carritos-regalias.service.js';
import { AgregarArticuloCarritoDto } from './dto/gregar-articulo-carrito.dto.js';
import { GuardarCarritoContadoDto } from './dto/guardar-carrito-contado.dto.js';

interface SolicitudAutenticada {
    user?: {
        id?: string | number;
    };
}

@Controller('carritos')
export class CarritosController {
    constructor(
        private readonly consultas: CarritosConsultasService,
        private readonly cajaVentaContado: CajaVentaContadoService,
        private readonly articulos: CarritosArticulosService,
        private readonly guardarService: CarritosGuardarService,
        private readonly regaliasService: CarritosRegaliasService,
    ) {}

    private async obtenerContexto(
        request: SolicitudAutenticada,
        token: string,
    ): Promise<{ sucursalId: string; userId: string }> {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'Usuario no autenticado.',
            );
        }

        if (!token?.trim()) {
            throw new UnauthorizedException(
                'Se requiere una sesión activa de Caja.',
            );
        }

        const userId = String(request.user.id);

        const contexto =
            await this.cajaVentaContado.obtenerContexto(
                token,
                userId,
            );

        return {
            sucursalId: contexto.sucursalId,
            userId,
        };
    }

    // ==========================================
    // CONSULTAR CARRITOS ABIERTOS
    // ==========================================

    @Get('cliente/:clienteSlug/abiertos')
    async buscarAbiertos(
        @Param('clienteSlug') clienteSlug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId } = await this.obtenerContexto(
            request,
            token,
        );

        return this.consultas.buscarAbiertos(
            clienteSlug,
            sucursalId,
        );
    }

    // ==========================================
    // GUARDAR CARRITO DE CONTADO
    // ==========================================

    @Post('guardar-contado')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    async guardarContado(
        @Body() dto: GuardarCarritoContadoDto,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId, userId } =
            await this.obtenerContexto(request, token);

        return this.guardarService.guardar(
            dto,
            sucursalId,
            userId,
        );
    }

    // ==========================================
    // CONSULTAR DETALLE DEL CARRITO
    // ==========================================

    @Get(':slug')
    async obtenerDetalle(
        @Param('slug') slug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId } = await this.obtenerContexto(
            request,
            token,
        );

        return this.consultas.obtenerDetalle(
            slug,
            sucursalId,
        );
    }

    // ==========================================
    // AGREGAR ARTÍCULO AL CARRITO
    // ==========================================

    @Post(':slug/articulos')
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    )
    async agregarArticulo(
        @Param('slug') slug: string,
        @Body() dto: AgregarArticuloCarritoDto,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId } = await this.obtenerContexto(
            request,
            token,
        );

        return this.articulos.agregarArticulo(
            slug,
            dto,
            sucursalId,
        );
    }

    // ==========================================
    // ELIMINAR ARTÍCULO DEL CARRITO
    // ==========================================

    @Delete(':slug/articulos/:articuloSlug/precio/:precioId')
    async eliminarArticulo(
        @Param('slug') slug: string,
        @Param('articuloSlug') articuloSlug: string,
        @Param('precioId') precioId: string,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId } = await this.obtenerContexto(
            request,
            token,
        );

        return this.articulos.eliminarArticulo(
            slug,
            articuloSlug,
            precioId,
            sucursalId,
        );
    }

    // ==========================================
    // CONSULTAR REGALÍAS DEL CARRITO
    // ==========================================

    @Get(':slug/regalias')
    async consultarRegalias(
        @Param('slug') slug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId } = await this.obtenerContexto(
            request,
            token,
        );

        return this.regaliasService.consultar(
            slug,
            sucursalId,
        );
    }

    // ==========================================
    // AGREGAR REGALÍA AL CARRITO
    // ==========================================

    @Post(':slug/regalias')
    async agregarRegalia(
        @Param('slug') slug: string,
        @Body() dto: GuardarRegaliaDto,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId, userId } =
            await this.obtenerContexto(request, token);

        return this.regaliasService.agregar(
            slug,
            dto,
            sucursalId,
            userId,
        );
    }

    // ==========================================
    // ACTUALIZAR CANTIDAD DE REGALÍA
    // ==========================================

    @Patch(':slug/regalias/:lineaRegaliaId')
    async actualizarRegalia(
        @Param('slug') slug: string,
        @Param('lineaRegaliaId') lineaRegaliaId: string,
        @Body() dto: ActualizarRegaliaDto,
        @Headers('x-caja-token') token: string,
        @Req() request: SolicitudAutenticada,
    ) {
        const { sucursalId, userId } =
            await this.obtenerContexto(request, token);

        return this.regaliasService.actualizar(
            slug,
            Number(lineaRegaliaId),
            dto,
            sucursalId,
            userId,
        );
    }
}

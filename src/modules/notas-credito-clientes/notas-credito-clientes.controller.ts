import { Controller, Get, Post, Patch, Param, Query, Req, Body, UploadedFile, UseInterceptors, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { NotasCreditoClientesService } from './notas-credito-clientes.service.js';
import { NotasCreditoRegistroService } from './notas-credito-registro.service.js';
import { NotasCreditoConsultasService } from './notas-credito-consultas.service.js';
import { NotasCreditoAnulacionService } from './notas-credito-anulacion.service.js';
import { CrearNotaCreditoDto } from './dto/crear-nota-credito.dto.js';

@Controller()
export class NotasCreditoClientesController {
    constructor(
        private readonly notasCreditoClientesService: NotasCreditoClientesService,
        private readonly registroService: NotasCreditoRegistroService,
        private readonly consultasService: NotasCreditoConsultasService,
        private readonly anulacionService: NotasCreditoAnulacionService,
    ) {}

    // ==========================================
    // CONSULTAR TIPOS DE NOTAS DE CRÉDITO
    // ==========================================
    @Get(['notas-credito-clientes/tipos', 'contabilidad/notas-creditos/clientes/tipos'])
    async obtenerTipos() {
        return await this.notasCreditoClientesService.obtenerTipos();
    }

    // ==========================================
    // LISTADO DE NOTAS DE CRÉDITO
    // ==========================================
    @Get('contabilidad/notas-creditos/clientes')
    async index(@Req() request: Request, @Query('pagina') pagina?: string, @Query('buscar') buscar?: string) {
        this.obtenerUsuarioAutenticado(request);
        return await this.consultasService.index(Number(pagina ?? 1), buscar ?? '');
    }

    // ==========================================
    // CONSULTAR DOCUMENTO ADJUNTO O COMPROBANTE
    // ==========================================
    @Get('contabilidad/notas-creditos/clientes/:slug/archivo')
    async obtenerArchivo(@Req() request: Request, @Param('slug') slug: string, @Query('tipo') tipo?: string) {
        this.obtenerUsuarioAutenticado(request);
        return await this.consultasService.obtenerArchivo(slug, tipo ?? 'adjunto');
    }

    // ==========================================
    // CONSULTAR DETALLE DE NOTA DE CRÉDITO
    // ==========================================
    @Get('contabilidad/notas-creditos/clientes/:slug')
    async detalle(@Req() request: Request, @Param('slug') slug: string) {
        this.obtenerUsuarioAutenticado(request);
        return await this.consultasService.detalle(slug);
    }

    // ==========================================
    // ANULAR NOTA DE CRÉDITO
    // ==========================================
    @Patch('contabilidad/notas-creditos/clientes/:slug/anular')
    async anular(@Req() request: Request, @Param('slug') slug: string, @Body() body: Record<string, unknown>) {
        const userId = this.obtenerUsuarioAutenticado(request);

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new BadRequestException('Solicitud no válida.');
        }

        if (typeof body.motivo !== 'string') {
            throw new BadRequestException('El motivo de anulación es obligatorio.');
        }

        return await this.anulacionService.anular(slug, userId, body.motivo);
    }

    // ==========================================
    // REGISTRAR NOTA DE CRÉDITO
    // ==========================================
    @Post('contabilidad/notas-creditos/clientes')
    @UseInterceptors(FileInterceptor('archivo', {
        storage: memoryStorage(),
        limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 20 },
    }))
    async registrar(@Req() request: Request, @Body() body: Record<string, unknown>, @UploadedFile() archivo?: Express.Multer.File) {

        // 1. Validar usuario autenticado
        const usuario = (request as Request & { user?: { id: string | number } }).user;

        if (!usuario?.id) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        // 2. Validar datos recibidos
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new BadRequestException('Solicitud no válida.');
        }

        const campos = { ...body };

        // 3. Normalizar campos opcionales
        const camposOpcionales = ['venta_slug', 'uso', 'referencia', 'fecha_vencimiento'];

        for (const campo of camposOpcionales) {
            if (campos[campo] === '' || campos[campo] === null || campos[campo] === undefined) {
                delete campos[campo];
            }
        }

        // 4. Convertir al DTO existente
        const dto = plainToInstance(CrearNotaCreditoDto, campos);

        // 5. Validar DTO
        try {
            await validateOrReject(dto, {
                whitelist: true,
                forbidNonWhitelisted: true,
                validationError: { target: false, value: false },
            });
        } catch (errores) {
            const mensajes = Array.isArray(errores) ? errores.flatMap(error => Object.values(error.constraints ?? {})) : [];

            throw new BadRequestException(mensajes.length > 0 ? mensajes : 'Los datos de la nota de crédito no son válidos.');
        }

        console.log('ARCHIVO RECIBIDO:', {
            nombre: archivo?.originalname,
            tipo: archivo?.mimetype,
            size: archivo?.size,
            buffer: archivo?.buffer?.length,
        });

        // 6. Registrar nota de crédito
        return await this.registroService.registrar(dto, String(usuario.id), archivo?.buffer);
    }

    // ==========================================
    // OBTENER USUARIO AUTENTICADO
    // ==========================================
    private obtenerUsuarioAutenticado(request: Request): string {
        const usuario = (request as Request & { user?: { id: string | number } }).user;

        if (!usuario?.id) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        return String(usuario.id);
    }
}
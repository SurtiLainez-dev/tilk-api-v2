import { BadRequestException, Controller, Headers, HttpCode, HttpStatus, Post, Req, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DataSource } from 'typeorm';

import type { AuthenticatedRequest } from '../../../auth/guards/passport-auth.guard.js';

import { CajaSesionService } from '../caja-sesion.service.js';
import { CajaEgresosService } from '../caja-egresos.service.js';
import { CajaEgresosOtroDiaService } from './caja-egresos-otro-dia.service.js';
import { DocumentosMultipartService } from '../../documentos/documentos-multipart.service.js';

@Controller('caja/egresos')
export class CajaEgresosController {

    constructor(
        private readonly egresosService: CajaEgresosService,
        private readonly cajaSesionService: CajaSesionService,
        private readonly documentosMultipart: DocumentosMultipartService,
        private readonly dataSource: DataSource,
        private readonly egresosOtroDiaService: CajaEgresosOtroDiaService,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('comprobante', {
        storage: memoryStorage(),
        limits: {
            fileSize: 15 * 1024 * 1024,
            files: 1,
        },
    }))
    async registrar(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {
        if (!request.user?.id || !token?.trim()) {
            throw new UnauthorizedException('Se requiere una sesión de caja válida.');
        }

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), String(request.user.id));
        const cajaId = sesion?.data?.caja_id;

        if (!cajaId) {
            throw new UnauthorizedException('No se pudo identificar la caja activa.');
        }

        const body = request.body as Record<string, string | undefined>;
        const slug = body?.slug?.trim();

        if (!slug) {
            throw new BadRequestException('Debes proporcionar el slug de la caja.');
        }

        const cajas: Array<{ id: number }> = await this.dataSource.query(
            'SELECT id FROM cajas WHERE slug = ? LIMIT 1',
            [slug],
        );

        if (!cajas[0] || String(cajas[0].id) !== String(cajaId)) {
            throw new UnauthorizedException('La caja no corresponde a la sesión activa.');
        }

        const comprobante = this.documentosMultipart.procesarArchivo(archivo, {
            campoArchivo: 'comprobante',
            tipoPermitido: 'application/pdf',
            maxMB: 15,
        });

        const montoDepositado = Number(body.montoDepositado ?? body.total);

        if (!Number.isFinite(montoDepositado) || montoDepositado <= 0) {
            throw new BadRequestException('El monto depositado debe ser mayor que cero.');
        }

        return this.egresosService.registrarEgreso({
            slug,
            montoDepositado,
            referencia: body.referencia ?? '',
            observacion: body.observacion ?? '',
            comprobante,
        });
    }

    @Post('otro-dia')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('comprobante', {
        storage: memoryStorage(),
        limits: {
            fileSize: 15 * 1024 * 1024,
            files: 1,
        },
    }))
    async registrarOtroDia(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {
        if (!request.user?.id || !token?.trim()) {
            throw new UnauthorizedException('Se requiere una sesión de caja válida.');
        }

        const userId = String(request.user.id);

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), userId);
        const cajaId = sesion?.data?.caja_id;

        if (!cajaId) {
            throw new UnauthorizedException('No se pudo identificar la caja activa.');
        }

        const body = request.body as Record<string, string | undefined>;

        const comprobante = this.documentosMultipart.procesarArchivo(archivo, {
            campoArchivo: 'comprobante',
            tipoPermitido: 'application/pdf',
            maxMB: 15,
        });

        const montoDepositado = Number(body.montoDepositado ?? body.total);

        if (!Number.isFinite(montoDepositado) || montoDepositado <= 0) {
            throw new BadRequestException('El monto depositado debe ser mayor que cero.');
        }

        return this.egresosOtroDiaService.registrarEgreso({
            cajaId: String(cajaId),
            userId,
            fechaCierre: body.fecha_cierre ?? '',
            fechaDeposito: body.fecha_deposito ?? '',
            montoDepositado,
            referencia: body.referencia ?? '',
            observacion: body.observacion ?? '',
            comprobante,
        });
    }
}
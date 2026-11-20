import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Req,
    Res,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
    ConflictException,
    UseGuards,
    Logger,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import type { FastifyReply } from 'fastify';

import {
    PassportAuthGuard,
    type AuthenticatedRequest,
} from '../../auth/guards/passport-auth.guard.js';

import { DocumentosService } from './documentos.service.js';
import { SpacesService } from '../spaces/spaces.service.js';
import { CajaAnticiposPdfService } from './caja/caja-anticipos-pdf.service.js';

interface SolicitarUrlFirmadaDto {
    path?: string;
}

@Controller('documentos')
@UseGuards(PassportAuthGuard)
export class DocumentosController {

    private readonly logger = new Logger(DocumentosController.name);

    constructor(
        private readonly documentosService: DocumentosService,
        private readonly spacesService: SpacesService,
        private readonly cajaAnticiposPdfService: CajaAnticiposPdfService,
        private readonly dataSource: DataSource,
    ) {}

    // ==========================================
    // GENERAR PDF DE RECIBO
    // ==========================================

    @Get('recibo/:codigo/pdf')
    async obtenerReciboPdf(
        @Param('codigo') codigo: string,
        @Req() request: AuthenticatedRequest,
        @Res() reply: FastifyReply,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'No se pudo identificar al usuario autenticado.',
            );
        }

        const codigoRecibo = codigo?.trim();

        if (!codigoRecibo) {
            throw new BadRequestException(
                'Debe proporcionar el código del recibo.',
            );
        }

        // ======================================
        // 1. IDENTIFICAR TIPO DE DOCUMENTO
        // ======================================

        const registros = await this.dataSource.query(
            `
            SELECT
                r.codigo,
                hc.tipo_documento
            FROM recibos r
            INNER JOIN historial_cajas hc
                ON hc.recibo_id = r.id
            WHERE r.codigo = ?
            LIMIT 2
            `,
            [codigoRecibo],
        );

        if (!registros.length) {
            throw new NotFoundException(
                'No se encontró el recibo en el historial de caja.',
            );
        }

        if (registros.length > 1) {
            throw new ConflictException(
                'El recibo tiene múltiples registros en el historial de caja.',
            );
        }

        const tipoDocumento = Number(registros[0].tipo_documento);

        this.logger.log(
            `[DOCUMENTOS] Recibo=${codigoRecibo}, tipo_documento=${tipoDocumento}`,
        );

        // ======================================
        // 2. GENERAR PDF SEGÚN TIPO DE DOCUMENTO
        // ======================================

        let pdf: Buffer;
        let nombreArchivo: string;

        const codigoArchivo = codigoRecibo.replace(/[^a-zA-Z0-9_-]/g, '_');

        switch (tipoDocumento) {

            // RECIBO DE ABONO A CUENTA
            case 2:

                pdf = await this.documentosService.generarRecibo(codigoRecibo);

                nombreArchivo = `recibo-${codigoArchivo}.pdf`;

                break;

            // RECIBO DE ANTICIPO
            case 5:

                pdf = await this.cajaAnticiposPdfService.generar(codigoRecibo);

                nombreArchivo = `anticipo-${codigoArchivo}.pdf`;

                break;

            default:

                throw new BadRequestException(
                    `El tipo de documento ${tipoDocumento} no admite generación de recibo PDF.`,
                );
        }

        // ======================================
        // 3. RETORNAR PDF
        // ======================================

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        reply.header('Cache-Control', 'private, no-store');
        reply.header('Content-Length', pdf.length);

        return reply.send(pdf);
    }

    // ==========================================
    // GENERAR URL FIRMADA DE SPACES
    // ==========================================

    @Post('url-firmada')
    @HttpCode(HttpStatus.OK)
    async obtenerUrlFirmada(
        @Body() datos: SolicitarUrlFirmadaDto,
        @Req() request: AuthenticatedRequest,
    ) {
        if (!request.user?.id) {
            throw new UnauthorizedException(
                'No se pudo identificar al usuario autenticado.',
            );
        }

        const url = await this.spacesService.generarUrlFirmada(
            datos?.path ?? '',
            300,
        );

        return {
            success: true,
            message: 'URL del documento generada correctamente.',
            data: {
                url,
                expiresIn: 300,
            },
        };
    }
}
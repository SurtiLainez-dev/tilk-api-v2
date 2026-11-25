import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Req, Res, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException, UseGuards, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FastifyReply } from 'fastify';

import { PassportAuthGuard, type AuthenticatedRequest } from '../../auth/guards/passport-auth.guard.js';

import { DocumentosService } from './documentos.service.js';
import { SpacesService } from '../spaces/spaces.service.js';
import { CajaAnticiposPdfService } from './caja/caja-anticipos-pdf.service.js';
import { CajaCierresPdfService } from './caja/caja-cierres-pdf.service.js';
import { CajaSesionService } from '../caja/caja-sesion.service.js';
import { PermisosService } from '../../common/permisos/permisos.service.js';

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
        private readonly cajaCierresPdfService: CajaCierresPdfService,
        private readonly cajaSesionService: CajaSesionService,
        private readonly permisosService: PermisosService,
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
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const codigoRecibo = codigo?.trim();

        if (!codigoRecibo) {
            throw new BadRequestException('Debe proporcionar el código del recibo.');
        }

        // ======================================
        // 1. IDENTIFICAR TIPO DE DOCUMENTO
        // ======================================

        const registros = await this.dataSource.query(`
            SELECT
                r.codigo,
                hc.tipo_documento
            FROM recibos r
            INNER JOIN historial_cajas hc
                ON hc.recibo_id = r.id
            WHERE r.codigo = ?
            LIMIT 2
        `, [codigoRecibo]);

        if (!registros.length) {
            throw new NotFoundException('No se encontró el recibo en el historial de caja.');
        }

        if (registros.length > 1) {
            throw new ConflictException('El recibo tiene múltiples registros en el historial de caja.');
        }

        const tipoDocumento = Number(registros[0].tipo_documento);

        this.logger.log(`[DOCUMENTOS] Recibo=${codigoRecibo}, tipo_documento=${tipoDocumento}`);

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

                throw new BadRequestException(`El tipo de documento ${tipoDocumento} no admite generación de recibo PDF.`);
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
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const url = await this.spacesService.generarUrlFirmada(datos?.path ?? '', 300);

        return {
            success: true,
            message: 'URL del documento generada correctamente.',
            data: {
                url,
                expiresIn: 300,
            },
        };
    }

    // ==========================================
    // GENERAR PDF DE FACTURA
    // ==========================================

    @Get('factura/:codigo/pdf')
    async obtenerFacturaPdf(
        @Param('codigo') codigo: string,
        @Req() request: AuthenticatedRequest,
        @Res() reply: FastifyReply,
    ) {

        if (!request.user?.id) {
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const codigoFactura = codigo?.trim();

        if (!codigoFactura) {
            throw new BadRequestException('Debe proporcionar el código de la factura.');
        }

        this.logger.log(`[DOCUMENTOS] Generando factura=${codigoFactura}, Usuario=${request.user.id}`);

        const pdf = await this.documentosService.generarFactura(codigoFactura);

        const codigoArchivo = codigoFactura.replace(/[^a-zA-Z0-9_-]/g, '_');
        const nombreArchivo = `factura-${codigoArchivo}.pdf`;

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        reply.header('Cache-Control', 'private, no-store');
        reply.header('Content-Length', pdf.length);

        return reply.send(pdf);
    }

    // ==========================================
    // GENERAR PDF DE CIERRE DE CAJA
    // ==========================================

    @Get('cierre-caja/:slug/:fecha/pdf')
    async generarPdfCierreCaja(
        @Param('slug') slug: string,
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string | undefined,
        @Req() request: AuthenticatedRequest,
        @Res() reply: FastifyReply,
    ) {

        // ======================================
        // 1. VALIDAR USUARIO AUTENTICADO
        // ======================================

        if (!request.user?.id) {
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const userId = String(request.user.id);
        const slugCaja = String(slug ?? '').trim();
        const fechaCierre = String(fecha ?? '').trim();

        // ======================================
        // 2. VALIDAR PARÁMETROS
        // ======================================

        if (!slugCaja) {
            throw new BadRequestException('Debes proporcionar el identificador de la caja.');
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaCierre)) {
            throw new BadRequestException('La fecha del cierre debe tener el formato YYYY-MM-DD.');
        }

        const fechaValidada = new Date(`${fechaCierre}T00:00:00.000Z`);

        if (Number.isNaN(fechaValidada.getTime()) || fechaValidada.toISOString().slice(0, 10) !== fechaCierre) {
            throw new BadRequestException('La fecha del cierre no es válida.');
        }

        // ======================================
        // 3. VALIDAR AUTORIZACIÓN
        // ======================================

        let cajaSesionId: string | null = null;

        if (typeof token === 'string' && token.trim()) {

            // CONSULTA DESDE UNA SESIÓN DE CAJA

            const sesion = await this.cajaSesionService.validarSesion(token.trim(), userId);

            if (!sesion?.data?.caja_id) {
                throw new UnauthorizedException('No se pudo identificar la caja de la sesión activa.');
            }

            cajaSesionId = String(sesion.data.caja_id);

        } else {

            // CONSULTA DESDE CONTABILIDAD

            await this.permisosService.verificarAccesoModulo(userId, 'contabilidad');

        }

        // ======================================
        // 4. OBTENER IDENTIFICADOR INTERNO
        // ======================================

        const cajaId = await this.cajaCierresPdfService.obtenerCajaIdPorSlug(slugCaja);

        // ======================================
        // 5. VALIDAR CAJA DE LA SESIÓN
        // ======================================

        if (cajaSesionId !== null && cajaSesionId !== cajaId) {
            throw new ForbiddenException('No tienes autorización para consultar el cierre de esta caja.');
        }

        this.logger.log(`[DOCUMENTOS] Generando cierre de caja=${slugCaja}, Fecha=${fechaCierre}, Usuario=${userId}`);

        // ======================================
        // 6. GENERAR DOCUMENTO PDF
        // ======================================

        const pdf = await this.cajaCierresPdfService.generar(cajaId, fechaCierre);

        const nombreArchivo = `arqueo-caja-${fechaCierre}.pdf`;

        // ======================================
        // 7. VALIDAR DOCUMENTO GENERADO
        // ======================================

        if (!Buffer.isBuffer(pdf) || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new ConflictException('No fue posible generar un documento PDF válido.');
        }

        // ======================================
        // 8. RETORNAR PDF
        // ======================================

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `inline; filename="${nombreArchivo}"`);
        reply.header('Cache-Control', 'private, no-store');
        reply.header('Content-Length', pdf.length);

        return reply.send(pdf);
    }
}
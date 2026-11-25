import { Controller, Get, Post, Put, Req, Res, Param, Body, Headers, BadRequestException, UnauthorizedException, HttpCode, HttpStatus, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CajaService } from './caja.service.js';
import { CajaSesionService } from './caja-sesion.service.js';
import { CajaCredencialesService } from './caja-credenciales.service.js';
import { CajaDistribucionService } from './caja-distribucion.service.js';
import { CajaOperacionPagoService } from './caja-operacion-pago.service.js';
import { PostearCuentaProcesarService } from './postear_cuenta/postear-cuenta-procesar.service.js';
import { CajaConsultaService } from './caja-consulta.service.js';
import { PermisosService } from '../../common/permisos/permisos.service.js';
import { InventarioMotocicletasService } from '../inventario/inventario-motocicletas.service.js';
import { CarritosRemisionesService, type VincularRemisionCarritoDto } from '../clientes/carritos_compras/carritos-remisiones.service.js';
import { CajaVentaContadoService } from './venta-contado/caja-venta-contado.service.js';
import { CarritosImpuestosService } from '../clientes/carritos_compras/carritos-impuestos.service.js';
import { ClientesService } from '../clientes/clientes.service.js';
import { NotasCreditoDisponiblesService } from '../clientes/notas_credito_clientes/notas-credito-disponibles.service.js';

import { CajaCierresService, type RegistrarCierreCajaDto } from './caja-cierres.service.js';
import { CajaCierresDocumentoService } from './caja-cierres-documento.service.js';
import { CajaCierresPdfService } from '../documentos/caja/caja-cierres-pdf.service.js';
import { DocumentosMultipartService } from '../documentos/documentos-multipart.service.js';

import type { AuthenticatedRequest } from '../../auth/guards/passport-auth.guard.js';

@Controller('caja')
export class CajaController {

    constructor(
        private readonly cajaService: CajaService,
        private readonly cajaSesionService: CajaSesionService,
        private readonly cajaCredencialesService: CajaCredencialesService,
        private readonly permisosService: PermisosService,
        private readonly cajaDistribucionService: CajaDistribucionService,
        private readonly cajaOperacionPagoService: CajaOperacionPagoService,
        private readonly postearCuentaService: PostearCuentaProcesarService,
        private readonly cajaConsultaService: CajaConsultaService,
        private readonly inventarioMotocicletas: InventarioMotocicletasService,
        private readonly carritosRemisionesService: CarritosRemisionesService,
        private readonly cajaVentaContado: CajaVentaContadoService,
        private readonly carritosImpuestosService: CarritosImpuestosService,
        private readonly clientesService: ClientesService,
        private readonly notasCreditoDisponiblesService: NotasCreditoDisponiblesService,
        private readonly cajaCierresService: CajaCierresService,
        private readonly cierresDocumentoService: CajaCierresDocumentoService,
        private readonly cierresPdfService: CajaCierresPdfService,
        private readonly documentosMultipart: DocumentosMultipartService,
    ) {}

    // ==========================================
    // LISTAR CAJAS DEL USUARIO
    // ==========================================

    @Get('cajas')
    async listarCajas(@Req() request: AuthenticatedRequest) {
        return this.cajaService.listarCajas(String(request.user.id));
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
    async obtenerCajaGeneralPorSlug(@Param('slug') slug: string) {
        return this.cajaService.obtenerCajaGeneralPorSlug(slug);
    }

    // ==========================================
    // INICIAR SESIÓN DE CAJA
    // ==========================================

    @Post('sesion/iniciar')
    async iniciarSesion(
        @Req() request: AuthenticatedRequest & Request,
        @Body() body: { slug: string; password: string },
    ) {
        if (typeof body?.slug !== 'string' || typeof body?.password !== 'string' || !body.slug.trim() || !body.password) {
            throw new BadRequestException('Debes proporcionar el slug y el PIN de Caja.');
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
        return this.cajaSesionService.validarSesion(token, String(request.user.id));
    }

    // ==========================================
    // CERRAR SESIÓN DE CAJA
    // ==========================================

    @Post('sesion/cerrar')
    async cerrarSesion(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
    ) {
        return this.cajaSesionService.cerrarSesion(token, String(request.user.id));
    }

    // ==========================================
    // CAMBIAR USUARIO ASIGNADO A UNA CAJA
    // Requiere acceso al módulo Contabilidad
    // ==========================================

    @Put(':cajaId/usuario')
    async cambiarUsuarioCaja(
        @Req() request: AuthenticatedRequest,
        @Param('cajaId') cajaId: string,
        @Body() body: { user_id: string },
    ) {
        await this.permisosService.verificarAccesoModulo(String(request.user.id), 'contabilidad');

        if (body?.user_id === null || body?.user_id === undefined || !String(body.user_id).trim()) {
            throw new BadRequestException('Debes proporcionar el nuevo usuario.');
        }

        return this.cajaCredencialesService.cambiarUsuario(cajaId, String(body.user_id));
    }

    // ==========================================
    // CONSULTAR DETALLES DE CAJA
    // ==========================================

    @Get([':slug/detalles', ':slug/detalles/:fecha'])
    async consultarDetallesCaja(
        @Param('slug') slug: string,
        @Param('fecha') fecha?: string,
    ) {
        return this.cajaConsultaService.consultarPorSlug(slug, fecha);
    }

    // ==========================================
    // REGENERAR PIN DE UNA CAJA
    // Requiere acceso al módulo Contabilidad
    // ==========================================

    @Put(':cajaId/regenerar-pin')
    async regenerarPinCaja(
        @Req() request: AuthenticatedRequest,
        @Param('cajaId') cajaId: string,
    ) {
        await this.permisosService.verificarAccesoModulo(String(request.user.id), 'contabilidad');

        return this.cajaCredencialesService.regenerarPin(cajaId);
    }

    // ==========================================
    // DISTRIBUIR PAGO
    // ==========================================

    @Post('pagos/distribuir')
    async consultarDistribucionPago(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @Body() body: {
            venta_slug: string;
            monto: string | number;
        },
    ) {
        // ======================================
        // 1. VALIDAR USUARIO AUTENTICADO
        // ======================================

        if (!request.user?.id) {
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const userId = String(request.user.id);

        // ======================================
        // 2. VALIDAR DATOS RECIBIDOS
        // ======================================

        if (!body || typeof body.venta_slug !== 'string' || !body.venta_slug.trim()) {
            throw new BadRequestException('Debes proporcionar una venta válida.');
        }

        if (typeof body.monto !== 'string' && typeof body.monto !== 'number') {
            throw new BadRequestException('Debes proporcionar un monto válido.');
        }

        const ventaSlug = body.venta_slug.trim();

        // ======================================
        // 3. VALIDAR TOKEN DE CAJA
        // ======================================

        if (typeof token !== 'string' || !token.trim()) {
            throw new UnauthorizedException('No se recibió el token de sesión de caja. Verifica que el frontend envíe x-caja-token.');
        }

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), userId);

        if (!sesion?.data?.caja_id || String(sesion.data.caja_id).trim() === '') {
            throw new UnauthorizedException('No se pudo identificar la caja de la sesión activa.');
        }

        const cajaId = String(sesion.data.caja_id);

        // ======================================
        // 4. CALCULAR DISTRIBUCIÓN
        // ======================================

        const distribucion = await this.cajaDistribucionService.consultarDistribucion(ventaSlug, body.monto);

        // ======================================
        // 5. VALIDAR DISTRIBUCIÓN
        // ======================================

        if (!distribucion || distribucion.success !== true || !Array.isArray(distribucion.distribucion) || distribucion.distribucion.length === 0) {
            throw new BadRequestException('No fue posible generar una distribución válida para el pago.');
        }

        // ======================================
        // 6. VALIDAR TOTAL DISTRIBUIDO
        // ======================================

        const totalDistribuido = Number(distribucion.resumen?.total_distribuido ?? 0);

        if (!Number.isFinite(totalDistribuido) || totalDistribuido <= 0) {
            throw new BadRequestException('La distribución no contiene un monto válido para registrar.');
        }

        // ======================================
        // 7. CREAR OPERACIÓN PENDIENTE
        // ======================================

        const operacion = await this.cajaOperacionPagoService.crearOperacion({
            venta_slug: ventaSlug,
            monto: body.monto,
            caja_id: cajaId,
            user_id: userId,
        });

        // ======================================
        // 8. DEVOLVER DISTRIBUCIÓN Y UUID
        // ======================================

        return {
            ...distribucion,
            operacion_id: operacion.operacion_id,
            estado_operacion: operacion.estado,
            registrado: false,
            simulacion: true,
        };
    }

    // ==========================================
    // PROCESAR PAGO DEFINITIVO
    // ==========================================

    @Post('pagos/procesar')
    async procesarPago(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @Body() body: {
            operacion_id: string;
            venta_slug: string;
            monto: string | number;
            forma_pago_id: string | number;
            observacion?: string;
            historial?: string | null;
            avisar_auditoria?: boolean;
        },
    ) {
        // ======================================
        // 1. VALIDAR USUARIO AUTENTICADO
        // ======================================

        if (!request.user?.id) {
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const userId = String(request.user.id);

        // ======================================
        // 2. VALIDAR OPERACIÓN
        // ======================================

        if (typeof body?.operacion_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.operacion_id)) {
            throw new BadRequestException('Debes proporcionar un UUID de operación válido.');
        }

        // ======================================
        // 3. VALIDAR VENTA
        // ======================================

        if (typeof body.venta_slug !== 'string' || !body.venta_slug.trim()) {
            throw new BadRequestException('Debes proporcionar una venta válida.');
        }

        // ======================================
        // 4. VALIDAR MONTO
        // ======================================

        if ((typeof body.monto !== 'string' && typeof body.monto !== 'number') || !/^\d+(\.\d{1,2})?$/.test(String(body.monto)) || Number(body.monto) <= 0) {
            throw new BadRequestException('Debes proporcionar un monto válido mayor a cero.');
        }

        // ======================================
        // 5. VALIDAR FORMA DE PAGO
        // ======================================

        if (!/^[1-9]\d*$/.test(String(body.forma_pago_id ?? ''))) {
            throw new BadRequestException('Debes seleccionar una forma de pago válida.');
        }

        // ======================================
        // 6. VALIDAR OBSERVACIÓN
        // ======================================

        if (body.observacion !== undefined && (typeof body.observacion !== 'string' || body.observacion.length > 400)) {
            throw new BadRequestException('La observación no puede superar los 400 caracteres.');
        }

        // ======================================
        // 7. VALIDAR TOKEN DE CAJA
        // ======================================

        if (typeof token !== 'string' || !token.trim()) {
            throw new UnauthorizedException('No se recibió el token de sesión de caja.');
        }

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), userId);

        if (!sesion?.data?.caja_id || String(sesion.data.caja_id).trim() === '') {
            throw new UnauthorizedException('No se pudo identificar la caja de la sesión activa.');
        }

        const cajaId = String(sesion.data.caja_id);

        // ======================================
        // 8. ENVIAR AL SERVICIO PRINCIPAL
        // ======================================

        return this.postearCuentaService.procesarPago({
            operacion_id: body.operacion_id,
            venta_slug: body.venta_slug.trim(),
            monto: body.monto,
            forma_pago_id: String(body.forma_pago_id),
            observacion: body.observacion ?? '',
            historial: body.historial ?? null,
            avisar_auditoria: body.avisar_auditoria === true,
            caja_id: cajaId,
            user_id: userId,
        });
    }

    // ==========================================
    // CONSULTAR INVENTARIO DE MOTOCICLETAS
    // ==========================================

    @Get('inventario/motocicletas/:articuloSlug')
    async consultarMotocicletasCaja(
        @Param('articuloSlug') articuloSlug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = request.user?.id;

        if (!userId) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        const contexto = await this.cajaVentaContado.obtenerContexto(token, String(userId));

        return this.inventarioMotocicletas.consultar({
            articuloSlug,
            sucursalId: contexto.sucursalId,
        });
    }

    // ==========================================
    // VINCULAR REMISIÓN A CARRITO
    // ==========================================

    @Post('carritos/:carritoSlug/articulos/vincular-remision')
    async vincularRemisionCarrito(
        @Param('carritoSlug') carritoSlug: string,
        @Body() body: VincularRemisionCarritoDto,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = request.user?.id;

        if (!userId) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        const contexto = await this.cajaVentaContado.obtenerContexto(token, String(userId));

        return this.carritosRemisionesService.vincular(
            carritoSlug,
            body,
            contexto.sucursalId,
        );
    }

    // ==========================================
    // CONSULTAR IMPUESTOS DEL CARRITO
    // ==========================================

    @Get('carritos/:carritoSlug/impuestos')
    async consultarImpuestosCarrito(
        @Param('carritoSlug') carritoSlug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = request.user?.id;

        if (!userId) {
            throw new UnauthorizedException('Usuario no autenticado.');
        }

        const contexto = await this.cajaVentaContado.obtenerContexto(token, String(userId));

        return this.carritosImpuestosService.consultar(
            carritoSlug,
            contexto.sucursalId,
        );
    }

    // ==========================================
    // CONSULTAR NOTAS DE CRÉDITO DISPONIBLES
    // ==========================================

    @Get('clientes/:clienteSlug/notas-credito-disponibles')
    async consultarNotasCreditoDisponibles(
        @Param('clienteSlug') clienteSlug: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = request.user?.id;

        if (!userId) throw new UnauthorizedException('Usuario no autenticado.');

        if (!clienteSlug?.trim()) throw new BadRequestException('Debes proporcionar el slug del cliente.');

        await this.cajaVentaContado.obtenerContexto(token, String(userId));

        const clienteId = await this.clientesService.obtenerIdInterno(clienteSlug.trim());

        return this.notasCreditoDisponiblesService.consultar(clienteId);
    }

    // ==========================================
    // CIERRES DE CAJA
    // ==========================================

    // ==========================================
    // VALIDAR CONTEXTO DEL CIERRE
    // ==========================================

    private async obtenerContextoCierre(
        request: AuthenticatedRequest,
        token: string,
    ) {
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
    // CONSULTAR RESUMEN PREVIO AL CIERRE
    // ==========================================

    @Get('cierres/resumen/:fecha')
    async consultarResumenCierre(
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
    ) {
        const contexto = await this.obtenerContextoCierre(request, token);

        return this.cajaCierresService.consultar(fecha, contexto);
    }

    // ==========================================
    // REGISTRAR CIERRE DE CAJA
    // ==========================================

    @Post('cierres/registrar')
    @HttpCode(HttpStatus.CREATED)
    async registrarCierre(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @Body() body: RegistrarCierreCajaDto,
    ) {
        const contexto = await this.obtenerContextoCierre(request, token);

        if (typeof body?.fecha !== 'string' || !body.fecha.trim()) {
            throw new BadRequestException('Debes proporcionar la fecha del cierre.');
        }

        if (body.efectivo_declarado === null || body.efectivo_declarado === undefined || !/^\d+(\.\d{1,2})?$/.test(String(body.efectivo_declarado))) {
            throw new BadRequestException('Debes proporcionar un importe de efectivo válido.');
        }

        if (body.observacion !== undefined && body.observacion !== null && (typeof body.observacion !== 'string' || body.observacion.length > 200)) {
            throw new BadRequestException('La observación no puede superar los 200 caracteres.');
        }

        return this.cajaCierresService.registrar(body, contexto);
    }

    // ==========================================
    // GENERAR PDF DEL ARQUEO DE CAJA
    // La caja se obtiene de la sesión activa.
    // El servicio pertenece al módulo Documentos.
    // ==========================================

    @Get('cierres/imprimir/:fecha')
    async imprimirArqueoCierre(
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
        @Res() response: Response,
    ) {
        const contexto = await this.obtenerContextoCierre(request, token);

        const pdf = await this.cierresPdfService.generar(contexto.cajaId, fecha);

        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `inline; filename="arqueo-caja-${fecha}.pdf"`);
        response.setHeader('Content-Length', pdf.length);
        response.setHeader('Cache-Control', 'no-store');

        return response.send(pdf);
    }

    // ==========================================
    // CARGAR DOCUMENTO FIRMADO DEL CIERRE
    // ==========================================

    @Post('cierres/documento/:fecha')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(
        FileInterceptor('archivo', {
            storage: memoryStorage(),
            limits: {
                fileSize: 15 * 1024 * 1024,
                files: 1,
            },
        }),
    )
    async cargarDocumentoCierre(
        @Param('fecha') fecha: string,
        @Headers('x-caja-token') token: string,
        @Req() request: AuthenticatedRequest,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {
        const contexto = await this.obtenerContextoCierre(request, token);

        const documento = this.documentosMultipart.procesarArchivo(archivo, {
            campoArchivo: 'archivo',
            tipoPermitido: 'application/pdf',
            maxMB: 15,
        });

        return this.cierresDocumentoService.registrarDocumento(
            contexto.cajaId,
            contexto.userId,
            fecha,
            documento,
        );
    }
}
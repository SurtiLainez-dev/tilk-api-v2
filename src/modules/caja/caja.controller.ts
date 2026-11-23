
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
    UnauthorizedException,
} from '@nestjs/common';

import type { Request } from 'express';

import { CajaService } from './caja.service.js';
import { CajaSesionService } from './caja-sesion.service.js';
import { CajaCredencialesService } from './caja-credenciales.service.js';
import { CajaDistribucionService } from './caja-distribucion.service.js';
import { CajaOperacionPagoService } from './caja-operacion-pago.service.js';
import { PostearCuentaProcesarService } from './postear_cuenta/postear-cuenta-procesar.service.js';
import { CajaConsultaService } from './caja-consulta.service.js';

import { PermisosService } from '../../common/permisos/permisos.service.js';
import { InventarioMotocicletasService} from "../inventario/inventario-motocicletas.service.js";
import {
    CarritosRemisionesService,
    type VincularRemisionCarritoDto
} from "../clientes/carritos_compras/carritos-remisiones.service.js";
import { CajaVentaContadoService } from './venta-contado/caja-venta-contado.service.js';
import { CarritosImpuestosService} from "../clientes/carritos_compras/carritos-impuestos.service.js";
import { ClientesService } from '../clientes/clientes.service.js';
import { NotasCreditoDisponiblesService } from '../clientes/notas_credito_clientes/notas-credito-disponibles.service.js';

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
        return this.cajaService.obtenerCajaGeneralPorSlug(
            slug,
        );
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
        // ======================================
        // VERIFICAR PERMISOS
        // ======================================

        await this.permisosService.verificarAccesoModulo(
            String(request.user.id),
            'contabilidad',
        );

        // ======================================
        // VALIDAR NUEVO USUARIO
        // ======================================

        if (
            body?.user_id === null ||
            body?.user_id === undefined ||
            !String(body.user_id).trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar el nuevo usuario.',
            );
        }

        // ======================================
        // CAMBIAR USUARIO Y GENERAR CREDENCIALES
        // ======================================

        return this.cajaCredencialesService.cambiarUsuario(
            cajaId,
            String(body.user_id),
        );
    }

    // ==========================================
    // REGENERAR PIN DE UNA CAJA
    // Requiere acceso al módulo Contabilidad
    // ==========================================

    @Get(':slug/detalles')
    async consultarDetallesCaja(
        @Param('slug') slug: string,
    ) {
        return this.cajaConsultaService.consultarPorSlug(slug);
    }

    @Post(':cajaId/regenerar-pin')
    async regenerarPinCaja(
        @Req() request: AuthenticatedRequest,
        @Param('cajaId') cajaId: string,
    ) {
        // ======================================
        // VERIFICAR PERMISOS
        // ======================================

        await this.permisosService.verificarAccesoModulo(
            String(request.user.id),
            'contabilidad',
        );

        // ======================================
        // REGENERAR PIN Y ENVIAR CORREO
        // ======================================

        return this.cajaCredencialesService.regenerarPin(
            cajaId,
        );
    }

    // ==========================================
    // DISTRIBUIR PAGO
    // ==========================================
    //
    // 1. Valida usuario autenticado.
    // 2. Valida token de sesión de caja.
    // 3. Valida venta y monto.
    // 4. Calcula distribución.
    // 5. Crea operación PENDIENTE.
    // 6. Devuelve UUID generado por NestJS.
    //
    // NO REGISTRA PAGOS FINANCIEROS.
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
            throw new UnauthorizedException(
                'No se pudo identificar al usuario autenticado.',
            );
        }

        const userId = String(request.user.id);

        // ======================================
        // 2. VALIDAR DATOS RECIBIDOS
        // ======================================

        if (
            !body ||
            typeof body.venta_slug !== 'string' ||
            !body.venta_slug.trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar una venta válida.',
            );
        }

        if (
            typeof body.monto !== 'string' &&
            typeof body.monto !== 'number'
        ) {
            throw new BadRequestException(
                'Debes proporcionar un monto válido.',
            );
        }

        const ventaSlug = body.venta_slug.trim();

        // ======================================
        // 3. VALIDAR TOKEN DE CAJA
        // ======================================

        if (
            typeof token !== 'string' ||
            !token.trim()
        ) {
            throw new UnauthorizedException(
                'No se recibió el token de sesión de caja. Verifica que el frontend envíe x-caja-token.',
            );
        }

        const sesion =
            await this.cajaSesionService.validarSesion(
                token.trim(),
                userId,
            );

        if (
            !sesion?.data?.caja_id ||
            String(sesion.data.caja_id).trim() === ''
        ) {
            throw new UnauthorizedException(
                'No se pudo identificar la caja de la sesión activa.',
            );
        }

        const cajaId = String(sesion.data.caja_id);

        // ======================================
        // 4. CALCULAR DISTRIBUCIÓN
        // ======================================
        //
        // La distribución utiliza los registros
        // pendientes de pagos_contratos.
        //
        // No interpreta el texto de detalle.
        // ======================================

        const distribucion =
            await this.cajaDistribucionService
                .consultarDistribucion(
                    ventaSlug,
                    body.monto,
                );

        // ======================================
        // 5. VALIDAR DISTRIBUCIÓN
        // ======================================

        if (
            !distribucion ||
            distribucion.success !== true ||
            !Array.isArray(
                distribucion.distribucion,
            ) ||
            distribucion.distribucion.length === 0
        ) {
            throw new BadRequestException(
                'No fue posible generar una distribución válida para el pago.',
            );
        }

        // ======================================
        // 6. VALIDAR TOTAL DISTRIBUIDO
        // ======================================

        const totalDistribuido = Number(
            distribucion.resumen?.total_distribuido ?? 0,
        );

        if (
            !Number.isFinite(totalDistribuido) ||
            totalDistribuido <= 0
        ) {
            throw new BadRequestException(
                'La distribución no contiene un monto válido para registrar.',
            );
        }

        // ======================================
        // 7. CREAR OPERACIÓN PENDIENTE
        // ======================================
        //
        // El UUID se genera en NestJS.
        // Se registra en caja_operaciones_pago.
        //
        // Estado inicial: PENDIENTE.
        // ======================================

        const operacion =
            await this.cajaOperacionPagoService
                .crearOperacion({
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
    //
    // 1. Valida usuario autenticado.
    // 2. Valida los parámetros.
    // 3. Valida la sesión de caja.
    // 4. Envía la operación al servicio principal.
    //
    // El servicio principal debe validar:
    // - Operación pendiente e idempotencia.
    // - Directriz de impresión activa.
    // - Distribución del pago.
    // - Contratos y saldos.
    // - Recibo, cuerpo y QR.
    // - Estado de cuenta.
    // - Historial de caja.
    // - Límite de crédito.
    //
    // Todos los cambios financieros deben
    // ejecutarse en una sola transacción.
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
            throw new UnauthorizedException(
                'No se pudo identificar al usuario autenticado.',
            );
        }

        const userId = String(request.user.id);

        // ======================================
        // 2. VALIDAR OPERACIÓN
        // ======================================

        if (
            typeof body?.operacion_id !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.operacion_id)
        ) {
            throw new BadRequestException(
                'Debes proporcionar un UUID de operación válido.',
            );
        }

        // ======================================
        // 3. VALIDAR VENTA
        // ======================================

        if (
            typeof body.venta_slug !== 'string' ||
            !body.venta_slug.trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar una venta válida.',
            );
        }

        // ======================================
        // 4. VALIDAR MONTO
        // ======================================

        if (
            (typeof body.monto !== 'string' &&
                typeof body.monto !== 'number') ||
            !/^\d+(\.\d{1,2})?$/.test(String(body.monto)) ||
            Number(body.monto) <= 0
        ) {
            throw new BadRequestException(
                'Debes proporcionar un monto válido mayor a cero.',
            );
        }

        // ======================================
        // 5. VALIDAR FORMA DE PAGO
        // ======================================

        if (
            !/^[1-9]\d*$/.test(
                String(body.forma_pago_id ?? ''),
            )
        ) {
            throw new BadRequestException(
                'Debes seleccionar una forma de pago válida.',
            );
        }

        // ======================================
        // 6. VALIDAR OBSERVACIÓN
        // ======================================

        if (
            body.observacion !== undefined &&
            (typeof body.observacion !== 'string' ||
                body.observacion.length > 400)
        ) {
            throw new BadRequestException(
                'La observación no puede superar los 400 caracteres.',
            );
        }

        // ======================================
        // 7. VALIDAR TOKEN DE CAJA
        // ======================================

        if (
            typeof token !== 'string' ||
            !token.trim()
        ) {
            throw new UnauthorizedException(
                'No se recibió el token de sesión de caja.',
            );
        }

        const sesion =
            await this.cajaSesionService.validarSesion(
                token.trim(),
                userId,
            );

        if (
            !sesion?.data?.caja_id ||
            String(sesion.data.caja_id).trim() === ''
        ) {
            throw new UnauthorizedException(
                'No se pudo identificar la caja de la sesión activa.',
            );
        }

        const cajaId = String(sesion.data.caja_id);

        // ======================================
        // 8. ENVIAR AL SERVICIO PRINCIPAL
        // ======================================
        //
        // El servicio principal ejecutará
        // todas las operaciones financieras
        // dentro de una transacción.
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

        const contexto = await this.cajaVentaContado.obtenerContexto(
            token,
            String(userId),
        );

        return this.inventarioMotocicletas.consultar({
            articuloSlug,
            sucursalId: contexto.sucursalId,
        });
    }






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

        const contexto = await this.cajaVentaContado.obtenerContexto(
            token,
            String(userId),
        );

        return this.carritosRemisionesService.vincular(
            carritoSlug,
            body,
            contexto.sucursalId,
        );
    }



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

        const contexto = await this.cajaVentaContado.obtenerContexto(
            token,
            String(userId),
        );

        return this.carritosImpuestosService.consultar(
            carritoSlug,
            contexto.sucursalId,
        );
    }



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


}

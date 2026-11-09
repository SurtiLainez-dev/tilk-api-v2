import {
    Controller,
    Get,
    Param,
    Query,
} from '@nestjs/common';

import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';

import { CuentasService } from './cuentas.service.js';
import { CuentasDetalleService } from './cuentas-detalle.service.js';
import { ConsultarCuentasDto } from './dto/consultar-cuentas.dto.js';

@ApiTags('Cuentas')
@ApiBearerAuth()
@Controller('cuentas')
export class CuentasController {
    constructor(
        private readonly cuentasService: CuentasService,
        private readonly detalleService: CuentasDetalleService,
    ) {}

    // ==========================================================
    // 1. CONSULTAR CUENTAS PENDIENTES
    // ==========================================================

    @Get('pendientes')
    @ApiOperation({
        summary: 'Consultar cuentas pendientes de pago',
        description:
            'Obtiene ventas con estado 1 (Al día) o 2 (Mora) ' +
            'y saldo_actual mayor que cero.',
    })
    @ApiQuery({
        name: 'buscar',
        required: false,
        type: String,
        description:
            'Buscar por código de venta, nombres, apellidos o identidad.',
    })
    @ApiQuery({
        name: 'estado',
        required: false,
        enum: [1, 2],
        description: '1 = Al día, 2 = Mora.',
    })
    @ApiQuery({
        name: 'pagina',
        required: false,
        type: Number,
        example: 1,
    })
    @ApiQuery({
        name: 'limite',
        required: false,
        type: Number,
        example: 100,
    })
    async obtenerCuentasPendientes(
        @Query() filtros: ConsultarCuentasDto,
    ) {
        return this.cuentasService.obtenerCuentasPendientes(filtros);
    }

    // ==========================================================
    // 2. DETALLE DE CUENTA
    // ==========================================================

    @Get(':slug/detalle')
    @ApiOperation({
        summary: 'Consultar detalle completo de una cuenta',
        description:
            'Obtiene información del cliente, límite de crédito activo, ' +
            'datos de la venta, artículos y saldos calculados.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        description: 'Slug de la venta.',
    })
    detalle(@Param('slug') slug: string) {
        return this.detalleService.detalle(slug);
    }

    // ==========================================================
    // 3. TABLA DE PAGOS
    // ==========================================================

    @Get(':slug/plan-pagos')
    @ApiOperation({
        summary: 'Consultar tabla de pagos de una venta',
        description:
            'Obtiene las cuotas del contrato, fechas de vencimiento, ' +
            'capital, intereses, mora, abonos y saldos.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        description: 'Slug de la venta.',
    })
    planPagos(@Param('slug') slug: string) {
        return this.detalleService.planPagos(slug);
    }

    // ==========================================================
    // 4. RECIBOS ANTERIORES
    // ==========================================================

    @Get(':slug/recibos')
    @ApiOperation({
        summary: 'Consultar recibos anteriores de una cuenta',
        description:
            'Obtiene los recibos registrados para la venta, ' +
            'ordenados del más reciente al más antiguo.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        description: 'Slug de la venta.',
    })
    recibos(@Param('slug') slug: string) {
        return this.detalleService.recibos(slug);
    }

    // ==========================================================
    // 5. AUDITORÍA DE SALDOS
    // ==========================================================

    @Get(':slug/auditoria')
    @ApiOperation({
        summary: 'Auditar saldos y segmento de cobranza',
        description:
            'Compara los saldos almacenados en ventas contra los ' +
            'calculados desde pagos_contratos. También verifica ' +
            'días de mora y segmento de cobranza. ' +
            'Esta operación no modifica registros.',
    })
    @ApiParam({
        name: 'slug',
        type: String,
        description: 'Slug de la venta.',
    })
    auditoria(@Param('slug') slug: string) {
        return this.detalleService.auditoria(slug);
    }
}
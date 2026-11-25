import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuthDocumentosService } from '../../auth-documentos/auth-documentos.service.js';
import { VerificarDocumentosQrService } from '../../auth-documentos/verificar-documentos-qr.service.js';
import { PostearCuentaDirectrizService } from './postear-cuenta-directriz.service.js';
import { PostearCuentaMontoLetrasService } from './postear-cuenta-monto-letras.service.js';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

export interface MovimientoCuerpoRecibo {
    pago_id: string;
    tipo: 1 | 2;
    monto: number | string;
}

export interface CrearReciboPosteo {
    venta_id: string;
    user_id: string;
    sucursal_id: string;
    caja_id: string;
    total: number | string;
    observacion: string;
    saldo_anterior: number | string;
    saldo_nuevo: number | string;
    movimientos: MovimientoCuerpoRecibo[];
}

@Injectable()
export class PostearCuentaRecibosService {
    private readonly logger = new Logger(PostearCuentaRecibosService.name);

    constructor(
        private readonly directrizService: PostearCuentaDirectrizService,
        private readonly montoLetrasService: PostearCuentaMontoLetrasService,
        private readonly authDocumentosService: AuthDocumentosService,
        private readonly verificarQrService: VerificarDocumentosQrService,
    ) {}

    private centavos(valor: number | string, campo: string): number {
        const numero = Number(valor);
        const redondeado = Math.round(numero * 100);
        if (!Number.isFinite(numero) || numero < 0 || !Number.isSafeInteger(redondeado) || Math.abs(numero * 100 - redondeado) > 0.000001) {
            throw new BadRequestException(`El campo ${campo} no contiene un monto válido.`);
        }
        return redondeado;
    }

    private validarId(valor: string, campo: string): void {
        if (!/^[1-9]\d*$/.test(String(valor))) throw new BadRequestException(`El campo ${campo} no es válido.`);
    }

    async crearRecibo(manager: EntityManager, datos: CrearReciboPosteo) {
        this.validarId(datos.venta_id, 'venta_id');
        this.validarId(datos.user_id, 'user_id');
        this.validarId(datos.sucursal_id, 'sucursal_id');
        this.validarId(datos.caja_id, 'caja_id');

        if (!datos.movimientos?.length) throw new BadRequestException('El recibo debe contener movimientos.');
        if (typeof datos.observacion !== 'string' || datos.observacion.length > 400) throw new BadRequestException('La observación no es válida.');

        const totalCentavos = this.centavos(datos.total, 'total');
        const saldoAnterior = this.centavos(datos.saldo_anterior, 'saldo_anterior');
        const saldoNuevo = this.centavos(datos.saldo_nuevo, 'saldo_nuevo');
        if (totalCentavos <= 0) throw new BadRequestException('El total del recibo debe ser mayor que cero.');

        this.logger.log(`[RECIBO] Iniciando creación. Venta=${datos.venta_id}, total=${datos.total}`);

        try {
            // La venta ya debe estar bloqueada por el servicio principal.
            const ventas = await manager.query('SELECT id, cod, sucursal_id, saldo_actual FROM ventas WHERE id = ?', [datos.venta_id]);
            if (!ventas.length) throw new NotFoundException('No se encontró la venta.');
            if (String(ventas[0].sucursal_id) !== String(datos.sucursal_id)) throw new ConflictException('La sucursal no corresponde a la venta.');
            if (this.centavos(ventas[0].saldo_actual, 'saldo_actual') !== saldoNuevo) throw new ConflictException('El saldo nuevo no coincide con el saldo de la venta.');

            const sumaMovimientos = datos.movimientos.reduce((suma, movimiento) => suma + this.centavos(movimiento.monto, 'movimiento'), 0);
            if (sumaMovimientos !== totalCentavos) throw new BadRequestException('El total del recibo no coincide con sus movimientos.');
            if (saldoAnterior - saldoNuevo !== totalCentavos) throw new ConflictException('La diferencia de saldos no coincide con el abono.');

            const ids = [...new Set(datos.movimientos.map(movimiento => String(movimiento.pago_id)))];
            for (const id of ids) this.validarId(id, 'pago_id');

            const placeholders = ids.map(() => '?').join(',');
            const obligaciones = await manager.query(`
                SELECT id, venta_id, detalle FROM pagos_contratos
                WHERE venta_id = ? AND id IN (${placeholders})
            `, [datos.venta_id, ...ids]);

            if (obligaciones.length !== ids.length) throw new NotFoundException('Una o más obligaciones no pertenecen a la venta.');

            const detalles = new Map<string, string>();
            for (const obligacion of obligaciones) detalles.set(String(obligacion.id), String(obligacion.detalle));

            const directriz = await this.directrizService.prepararCodigo(manager, datos.sucursal_id, 1);
            const codigo = directriz.codigo;
            const existente = await manager.query('SELECT id FROM recibos WHERE codigo = ? LIMIT 1', [codigo]);
            if (existente.length) throw new ConflictException(`El código de recibo ${codigo} ya existe.`);

            const { fecha, hora, created_at, updated_at } = fechaHonduras();
            const total = totalCentavos / 100;
            const pagoLetras = this.montoLetrasService.convertir(total);
            const totalMora = datos.movimientos.filter(m => m.tipo === 2).reduce((suma, m) => suma + this.centavos(m.monto, 'mora'), 0) / 100;

            this.logger.debug(`[RECIBO] Código=${codigo}, fecha=${fecha}, hora=${hora}`);

            const resultado = await manager.query(`
                INSERT INTO recibos (
                    venta_id, codigo, fecha, hora, observacion, total, user_id, pago,
                    sucursal_id, caja_id, saldo_actual_venta, saldo_nuevo, file,
                    total_capital, total_interes, total_mora, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                datos.venta_id, codigo, fecha, hora, datos.observacion, total, datos.user_id,
                pagoLetras, datos.sucursal_id, datos.caja_id, saldoAnterior / 100,
                saldoNuevo / 100, '1', 0, 0, totalMora, created_at, updated_at,
            ]);

            if (!resultado.insertId) throw new ConflictException('No se pudo crear el recibo.');
            const reciboId = String(resultado.insertId);

            this.logger.log(`[RECIBO] Encabezado creado. ID=${reciboId}, código=${codigo}`);

            // El contador se actualiza únicamente después de crear el encabezado.
            await this.directrizService.actualizarContador(manager, directriz);

            for (const movimiento of datos.movimientos) {
                if (movimiento.tipo !== 1 && movimiento.tipo !== 2) throw new BadRequestException('El tipo de movimiento no es válido.');

                const detalle = detalles.get(String(movimiento.pago_id));
                if (detalle === undefined) throw new NotFoundException('No se encontró el detalle de la obligación.');
                if (detalle.length > 50) throw new BadRequestException('El detalle de la obligación supera los 50 caracteres.');

                const monto = this.centavos(movimiento.monto, 'monto') / 100;
                if (monto <= 0) throw new BadRequestException('El movimiento debe ser mayor que cero.');

                const resultadoCuerpo = await manager.query(`
                    INSERT INTO cuerpo_recibos (
                        recibo_id, pagos_contrato_id, tipo, detalle,
                        total_capital, total_interes, total_mora, total, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    reciboId, movimiento.pago_id, movimiento.tipo, detalle,
                    0, 0, movimiento.tipo === 2 ? monto : 0, monto, created_at, updated_at,
                ]);

                if (!resultadoCuerpo.insertId) throw new ConflictException('No se pudo registrar el cuerpo del recibo.');
                this.logger.debug(`[RECIBO] Movimiento creado. Pago=${movimiento.pago_id}, tipo=${movimiento.tipo}, monto=${monto}`);
            }

            const authDocumento = await this.authDocumentosService.ejecutarClave(manager, datos.user_id);

            const urlVerificacion = `cajas/recibos/usuario=SURTI-CREDITOS/recibo=${codigo}/`;

            const detalleQr = `RECIBO DE ABONO A LA CUENTA ${ventas[0].cod} POR UN TOTAL DE L. ${total.toFixed(2)}`;
            const qr = await this.verificarQrService.registrar(manager, {
                url_verificacion: urlVerificacion,
                referencia: codigo,
                detalle: detalleQr,
                tipo: 'RECIBO_POSTEO',
                autor: datos.user_id,
            });

            this.logger.log(`[RECIBO] Creación finalizada. ID=${reciboId}, código=${codigo}, QR=${qr.id}`);

            return {
                recibo_id: reciboId,
                codigo,
                fecha,
                hora,
                total: total.toFixed(2),
                total_mora: totalMora.toFixed(2),
                saldo_anterior: (saldoAnterior / 100).toFixed(2),
                saldo_nuevo: (saldoNuevo / 100).toFixed(2),
                pago: pagoLetras,
                directriz_id: directriz.directriz_id,
                qr: { id: qr.id, token: qr.token, referencia: codigo },
                auth_documento_id: authDocumento.id,
                auth_documento_token: authDocumento.token,
                auth_documento_expiracion: authDocumento.expiracion,
                movimientos: datos.movimientos.length,
            };
        } catch (error) {
            this.logger.error(`[RECIBO] Error creando recibo. Venta=${datos.venta_id}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}
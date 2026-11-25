import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';
import { CajaCierresConsultaService } from './caja-cierres-consulta.service.js';

export interface RegistrarCierreCajaDto {
    fecha: string;
    efectivo_declarado: number | string;
    observacion?: string | null;
}

export interface ContextoCierreCaja {
    cajaId: string;
    userId: string;
}

@Injectable()
export class CajaCierresService {

    private readonly logger = new Logger(CajaCierresService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly consultaService: CajaCierresConsultaService,
    ) {}

    // ==========================================
    // UTILIDADES
    // ==========================================

    private centavos(valor: unknown, permitirNegativo = false): number {

        const texto = String(valor ?? '').trim();

        if (!/^-?\d+(\.\d{1,2})?$/.test(texto)) {
            throw new BadRequestException('El importe proporcionado no es válido.');
        }

        const numero = Math.round(Number(texto) * 100);

        if (!Number.isSafeInteger(numero)) {
            throw new BadRequestException('Importe fuera del límite permitido.');
        }

        if (!permitirNegativo && numero < 0) {
            throw new BadRequestException('El importe no puede ser negativo.');
        }

        return numero;
    }

    private decimal(valor: number): string {
        return (valor / 100).toFixed(2);
    }

    private validarFecha(valor: string): string {

        const fecha = String(valor ?? '').trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new BadRequestException('La fecha del cierre no es válida.');
        }

        const fechaDate = new Date(`${fecha}T00:00:00.000Z`);

        if (Number.isNaN(fechaDate.getTime()) || fechaDate.toISOString().slice(0, 10) !== fecha) {
            throw new BadRequestException('La fecha proporcionada no existe.');
        }

        if (fecha > fechaHonduras().fecha) {
            throw new BadRequestException('No se puede registrar un cierre con fecha futura.');
        }

        return fecha;
    }

    // ==========================================
    // BLOQUEAR Y VALIDAR CAJA
    // ==========================================

    private async bloquearCaja(manager: EntityManager, contexto: ContextoCierreCaja) {

        const cajas = await manager.query(`
            SELECT
                id,
                user_id,
                total,
                total_inicio,
                saldo_acumulado,
                estado_cierre
            FROM cajas
            WHERE id = ?
                LIMIT 1
            FOR UPDATE
        `, [contexto.cajaId]);

        const caja = cajas[0];

        if (!caja) throw new NotFoundException('No se encontró la caja.');

        if (String(caja.user_id) !== String(contexto.userId)) {
            throw new ForbiddenException('El usuario no está asignado a esta caja.');
        }

        return caja;
    }

    // ==========================================
    // VALIDAR CIERRE DUPLICADO
    // ==========================================

    private async validarDuplicado(manager: EntityManager, cajaId: string, fecha: string): Promise<void> {

        const existentes = await manager.query(`
            SELECT id
            FROM cierre_cajas
            WHERE cajas_id = ?
              AND fecha = ?
                LIMIT 1
            FOR UPDATE
        `, [cajaId, fecha]);

        if (existentes.length) {
            throw new ConflictException('Ya existe un cierre de caja para la fecha seleccionada.');
        }
    }

    // ==========================================
    // REGISTRAR HISTORIAL
    // ==========================================

    private async registrarHistorial(
        manager: EntityManager,
        cajaId: string,
        cierreId: string,
        fecha: string,
        monto: string,
        ahora: Date,
    ): Promise<void> {

        const resultado = await manager.query(`
            INSERT INTO historial_cajas (
                cajas_id,
                forma_pago_id,
                referencia,
                tipo_documento,
                recibo_id,
                factura_id,
                total,
                fecha,
                tipo,
                historial,
                created_at,
                updated_at
            ) VALUES (
                ?, 6, ?, 7,
                NULL, NULL,
                ?, ?, 1, NULL, ?, ?
            )
        `, [
            cajaId,
            `CIERRE-${cierreId}`,
            monto,
            fecha,
            ahora,
            ahora,
        ]);

        if (!resultado?.insertId) {
            throw new InternalServerErrorException('No se pudo registrar el historial del cierre.');
        }
    }

    // ==========================================
    // CONSULTAR RESUMEN PREVIO
    // ==========================================

    async consultar(fechaSolicitada: string, contexto: ContextoCierreCaja) {

        const fecha = this.validarFecha(fechaSolicitada);

        return this.dataSource.transaction('READ COMMITTED', async manager => {

            const caja = await this.bloquearCaja(manager, contexto);

            await this.validarDuplicado(manager, contexto.cajaId, fecha);

            const totales = await this.consultaService.calcular(manager, contexto.cajaId, fecha);

            return {
                success: true,
                data: {
                    fecha,
                    total: totales.total.toFixed(2),
                    ingreso: totales.ingreso.toFixed(2),
                    egreso: totales.egreso.toFixed(2),
                    efectivo: totales.efectivo.toFixed(2),
                    saldo_actual_caja: Number(caja.total).toFixed(2),
                },
            };
        });
    }

    // ==========================================
    // REGISTRAR CIERRE DE CAJA
    // ==========================================

    async registrar(datos: RegistrarCierreCajaDto, contexto: ContextoCierreCaja) {

        const inicio = Date.now();
        const fecha = this.validarFecha(datos.fecha);
        const declarado = this.centavos(datos.efectivo_declarado);
        const observacion = String(datos.observacion ?? '').trim() || null;

        const cajaId = String(contexto.cajaId ?? '').trim();
        const userId = String(contexto.userId ?? '').trim();

        if (!/^[1-9]\d*$/.test(cajaId) || !/^[1-9]\d*$/.test(userId)) {
            throw new BadRequestException('La sesión de caja no es válida.');
        }

        if (observacion && observacion.length > 200) {
            throw new BadRequestException('La observación no puede superar los 200 caracteres.');
        }

        this.logger.log(`[INICIO_CIERRE] Caja=${cajaId}, Usuario=${userId}, Fecha=${fecha}`);

        try {

            const respuesta = await this.dataSource.transaction('READ COMMITTED', async manager => {

                // ==================================
                // 1. BLOQUEAR CAJA
                // ==================================

                await this.bloquearCaja(manager, contexto);

                // ==================================
                // 2. VALIDAR DUPLICADO
                // ==================================

                await this.validarDuplicado(manager, cajaId, fecha);

                // ==================================
                // 3. CALCULAR IMPORTES
                // ==================================

                const totales = await this.consultaService.calcular(manager, cajaId, fecha);

                const total = this.centavos(totales.total);
                const ingreso = this.centavos(totales.ingreso);
                const egreso = this.centavos(totales.egreso);
                const efectivo = this.centavos(totales.efectivo, true);

                const descuadre = declarado - efectivo;
                const acumulado = declarado;
                const ahora = new Date();

                // ==================================
                // 4. REGISTRAR CIERRE
                // ==================================

                const resultado = await manager.query(`
                    INSERT INTO cierre_cajas (
                        cajas_id,
                        resumen_fp,
                        resumen,
                        total,
                        ingreso,
                        egreso,
                        efectivo,
                        efectivo_declarado,
                        descuadre,
                        file,
                        fecha,
                        observacion,
                        created_at,
                        updated_at,
                        revisado,
                        comentario_revision,
                        total_acumulado_h,
                        total_acumulado,
                        user_id
                    ) VALUES (
                        ?, NULL, NULL,
                        ?, ?, ?, ?, ?, ?,
                        NULL, ?, ?, ?, ?,
                        0, NULL, ?, ?, ?
                    )
                `, [
                    cajaId,
                    this.decimal(total),
                    this.decimal(ingreso),
                    this.decimal(egreso),
                    this.decimal(efectivo),
                    this.decimal(declarado),
                    this.decimal(descuadre),
                    fecha,
                    observacion,
                    ahora,
                    ahora,
                    this.decimal(acumulado),
                    this.decimal(acumulado),
                    userId,
                ]);

                if (!resultado?.insertId) {
                    throw new InternalServerErrorException('No se pudo registrar el cierre de caja.');
                }

                const cierreId = String(resultado.insertId);

                // ==================================
                // 5. REGISTRAR HISTORIAL DE CAJA
                // ==================================

                await this.registrarHistorial(
                    manager,
                    cajaId,
                    cierreId,
                    fecha,
                    this.decimal(declarado),
                    ahora,
                );

                // ==================================
                // 6. PREPARAR RESPUESTA
                // ==================================

                return {
                    success: true,
                    message: descuadre === 0
                        ? 'Cierre de caja registrado correctamente. Pendiente de documento firmado.'
                        : 'Cierre de caja registrado con descuadre. Pendiente de documento firmado.',
                    data: {
                        fecha,
                        total: this.decimal(total),
                        ingreso: this.decimal(ingreso),
                        egreso: this.decimal(egreso),
                        efectivo: this.decimal(efectivo),
                        efectivo_declarado: this.decimal(declarado),
                        descuadre: this.decimal(descuadre),
                        total_acumulado_h: this.decimal(acumulado),
                        total_acumulado: this.decimal(acumulado),
                        observacion,
                        file: null,
                        tiene_documento: false,
                        revisado: 0,
                        tiene_descuadre: descuadre !== 0,
                        tipo_descuadre: descuadre === 0
                            ? 'NINGUNO'
                            : descuadre < 0
                                ? 'FALTANTE'
                                : 'SOBRANTE',
                    },
                };
            });

            this.logger.log(`[CIERRE_REGISTRADO] Caja=${cajaId}, Fecha=${fecha}, Duracion=${Date.now() - inicio}ms`);

            return respuesta;

        } catch (error) {

            this.logger.error(`[ERROR_CIERRE] Caja=${cajaId}, Fecha=${fecha}, Mensaje=${error instanceof Error ? error.message : String(error)}`);

            throw error;
        }
    }
}
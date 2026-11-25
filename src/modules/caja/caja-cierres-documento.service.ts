import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

import { SpacesService } from '../spaces/spaces.service.js';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

@Injectable()
export class CajaCierresDocumentoService {

    private readonly logger = new Logger(CajaCierresDocumentoService.name);
    private readonly directorio = 'Contabilidad/caja/cierre/archivo';

    constructor(
        private readonly dataSource: DataSource,
        private readonly spacesService: SpacesService,
    ) {}

    // ==========================================
    // VALIDAR FECHA
    // ==========================================

    private validarFecha(valor: string): string {
        const fecha = String(valor ?? '').trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new BadRequestException('La fecha del cierre no es válida.');
        }

        const date = new Date(`${fecha}T00:00:00Z`);

        if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== fecha) {
            throw new BadRequestException('La fecha del cierre no existe.');
        }

        if (fecha > fechaHonduras().fecha) {
            throw new BadRequestException('No se permiten fechas futuras.');
        }

        return fecha;
    }

    // ==========================================
    // VALIDAR DOCUMENTO PDF
    // ==========================================

    private validarPdf(archivo: Buffer): void {

        if (!Buffer.isBuffer(archivo) || archivo.length === 0) {
            throw new BadRequestException('Debes proporcionar un documento válido.');
        }

        if (archivo.length > 15 * 1024 * 1024) {
            throw new BadRequestException('El documento no puede superar los 15 MB.');
        }

        if (archivo.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new BadRequestException('El documento debe estar en formato PDF.');
        }
    }

    // ==========================================
    // GENERAR CLAVE DEL DOCUMENTO
    // ==========================================

    private generarNombreArchivo(fecha: string): string {
        return `${this.directorio}/${fecha.slice(0, 4)}/${fecha.slice(5, 7)}/${randomUUID()}.pdf`;
    }

    // ==========================================
    // SUBIR DOCUMENTO PRIVADO
    // ==========================================

    private async subirDocumento(key: string, archivo: Buffer): Promise<void> {

        await this.spacesService.getCliente().send(
            new PutObjectCommand({
                Bucket: this.spacesService.getBucket(),
                Key: key,
                Body: archivo,
                ContentType: 'application/pdf',
                ACL: 'private',
            }),
        );
    }

    // ==========================================
    // ELIMINAR DOCUMENTO
    // ==========================================

    private async eliminarDocumento(key: string): Promise<void> {

        await this.spacesService.getCliente().send(
            new DeleteObjectCommand({
                Bucket: this.spacesService.getBucket(),
                Key: key,
            }),
        );
    }

    // ==========================================
    // REGISTRAR DOCUMENTO FIRMADO
    // ==========================================

    async registrarDocumento(
        cajaId: string,
        userId: string,
        fechaRecibida: string,
        archivo: Buffer,
    ) {

        const inicio = Date.now();
        const fecha = this.validarFecha(fechaRecibida);

        this.validarPdf(archivo);

        if (!/^[1-9]\d*$/.test(String(cajaId)) || !/^[1-9]\d*$/.test(String(userId))) {
            throw new UnauthorizedException('La sesión de caja no es válida.');
        }

        const key = this.generarNombreArchivo(fecha);

        let documentoSubido = false;

        this.logger.log(`[DOCUMENTO_CIERRE] Caja=${cajaId}, Usuario=${userId}, Fecha=${fecha}`);

        try {

            const respuesta = await this.dataSource.transaction('READ COMMITTED', async manager => {

                // ======================================
                // 1. BLOQUEAR CAJA
                // ======================================

                const cajas = await manager.query(`
                    SELECT id, user_id, estado_cierre
                    FROM cajas
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                `, [cajaId]);

                const caja = cajas[0];

                if (!caja) {
                    throw new NotFoundException('No se encontró la caja.');
                }

                if (String(caja.user_id) !== String(userId)) {
                    throw new UnauthorizedException('El usuario no está asignado a esta caja.');
                }

                // ======================================
                // 2. BUSCAR CIERRE REGISTRADO
                // ======================================

                const cierres = await manager.query(`
                    SELECT
                        id,
                        total,
                        ingreso,
                        egreso,
                        efectivo,
                        efectivo_declarado,
                        descuadre,
                        observacion,
                        file,
                        total_acumulado,
                        total_acumulado_h
                    FROM cierre_cajas
                    WHERE cajas_id = ?
                      AND fecha = ?
                    LIMIT 1
                    FOR UPDATE
                `, [cajaId, fecha]);

                const cierre = cierres[0];

                if (!cierre) {
                    throw new NotFoundException('Primero debes registrar el cierre de caja.');
                }

                if (cierre.file && String(cierre.file).trim()) {
                    throw new ConflictException('Este cierre ya tiene un documento firmado.');
                }

                // ======================================
                // 3. LOCALIZAR MOVIMIENTO DEL CIERRE
                // ======================================

                const movimientos = await manager.query(`
                    SELECT id
                    FROM historial_cajas
                    WHERE cajas_id = ?
                      AND fecha = ?
                      AND tipo_documento = 7
                      AND tipo = 1
                    FOR UPDATE
                `, [cajaId, fecha]);

                if (movimientos.length !== 1) {
                    throw new ConflictException('No se encontró un movimiento de cierre único para esta fecha.');
                }

                const movimiento = movimientos[0];

                // ======================================
                // 4. SUBIR DOCUMENTO A SPACES
                // ======================================

                await this.subirDocumento(key, archivo);

                documentoSubido = true;

                const ahora = new Date();

                // ======================================
                // 5. ACTUALIZAR CIERRE
                // ======================================

                const resultadoCierre = await manager.query(`
                    UPDATE cierre_cajas
                    SET file = ?,
                        updated_at = ?
                    WHERE id = ?
                      AND (file IS NULL OR file = '')
                `, [key, ahora, cierre.id]);

                if (Number(resultadoCierre.affectedRows) !== 1) {
                    throw new InternalServerErrorException('No fue posible actualizar el documento del cierre.');
                }

                // ======================================
                // 6. ACTUALIZAR HISTORIAL DE CAJA
                // ======================================

                const resultadoHistorial = await manager.query(`
                    UPDATE historial_cajas
                    SET historial = ?,
                        updated_at = ?
                    WHERE id = ?
                `, [key, ahora, movimiento.id]);

                if (Number(resultadoHistorial.affectedRows) !== 1) {
                    throw new InternalServerErrorException('No fue posible actualizar el historial del cierre.');
                }

                // ======================================
                // 7. FINALIZAR CIERRE DE CAJA
                // ======================================

                let estadoCierre = Number(caja.estado_cierre);

                if (fecha === fechaHonduras().fecha) {

                    await manager.query(`
                        UPDATE cajas
                        SET estado_cierre = 0,
                            updated_at = ?
                        WHERE id = ?
                    `, [ahora, cajaId]);

                    estadoCierre = 0;
                }

                // ======================================
                // 8. DEVOLVER RESPUESTA
                // ======================================

                return {
                    success: true,
                    message: 'Documento firmado registrado correctamente.',
                    data: {
                        fecha,
                        total: Number(cierre.total).toFixed(2),
                        ingreso: Number(cierre.ingreso).toFixed(2),
                        egreso: Number(cierre.egreso).toFixed(2),
                        efectivo: Number(cierre.efectivo).toFixed(2),
                        efectivo_declarado: Number(cierre.efectivo_declarado).toFixed(2),
                        descuadre: Number(cierre.descuadre).toFixed(2),
                        observacion: cierre.observacion ?? null,
                        file: key,
                        tiene_documento: true,
                        tiene_descuadre: Number(cierre.descuadre) !== 0,
                        total_acumulado: Number(cierre.total_acumulado).toFixed(2),
                        total_acumulado_h: Number(cierre.total_acumulado_h).toFixed(2),
                        estado_cierre: estadoCierre,
                    },
                };
            });

            this.logger.log(`[DOCUMENTO_CIERRE_OK] Caja=${cajaId}, Fecha=${fecha}`);

            return respuesta;

        } catch (error) {

            // ======================================
            // VERIFICAR ANTES DE ELIMINAR EL ARCHIVO
            // ======================================

            if (documentoSubido) {

                try {

                    const registros = await this.dataSource.query(`
                        SELECT id
                        FROM cierre_cajas
                        WHERE cajas_id = ?
                          AND fecha = ?
                          AND file = ?
                        LIMIT 1
                    `, [cajaId, fecha, key]);

                    if (registros.length === 0) {
                        await this.eliminarDocumento(key);
                    }

                } catch (errorLimpieza) {

                    this.logger.error(
                        `[ERROR_LIMPIEZA_DOCUMENTO] Archivo=${key}, Error=${errorLimpieza instanceof Error ? errorLimpieza.message : String(errorLimpieza)}`,
                    );
                }
            }

            this.logger.error(
                `[ERROR_DOCUMENTO_CIERRE] Caja=${cajaId}, Fecha=${fecha}, Error=${error instanceof Error ? error.message : String(error)}`,
            );

            throw error;

        } finally {

            this.logger.log(`[FIN_DOCUMENTO_CIERRE] Duracion=${Date.now() - inicio}ms`);
        }
    }
}
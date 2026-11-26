import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SpacesService } from '../../spaces/spaces.service.js';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

export interface RegistrarEgresoOtroDiaDto {
    cajaId: string;
    userId: string;
    fechaCierre: string;
    fechaDeposito: string;
    montoDepositado: number;
    referencia: string;
    observacion: string;
    comprobante: Buffer;
}

@Injectable()
export class CajaEgresosOtroDiaService {
    private readonly logger = new Logger(CajaEgresosOtroDiaService.name);
    private readonly directorio = 'Contabilidad/caja/egreso/archivo';

    constructor(
        private readonly dataSource: DataSource,
        private readonly spacesService: SpacesService,
    ) {}

    private validarFecha(fecha: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

        const valor = new Date(`${fecha}T00:00:00Z`);

        return Number.isFinite(valor.getTime()) && valor.toISOString().slice(0, 10) === fecha;
    }

    private validarPdf(archivo: Buffer): void {
        if (!Buffer.isBuffer(archivo) || archivo.length === 0) {
            throw new BadRequestException('El comprobante es obligatorio.');
        }

        if (archivo.length > 15 * 1024 * 1024) {
            throw new BadRequestException('El comprobante no puede superar 15 MB.');
        }

        if (archivo.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new BadRequestException('El comprobante debe estar en formato PDF.');
        }
    }

    private async subirComprobante(archivo: Buffer): Promise<string> {
        const key = `${this.directorio}/${randomUUID()}.pdf`;

        await this.spacesService.getCliente().send(new PutObjectCommand({
            Bucket: this.spacesService.getBucket(),
            Key: key,
            Body: archivo,
            ContentType: 'application/pdf',
            ACL: 'private',
        }));

        return key;
    }

    private async eliminarComprobante(key: string): Promise<void> {
        await this.spacesService.getCliente().send(new DeleteObjectCommand({
            Bucket: this.spacesService.getBucket(),
            Key: key,
        }));
    }

    async registrarEgreso(datos: RegistrarEgresoOtroDiaDto) {
        const { fecha: hoy } = fechaHonduras();

        const fechaCierre = datos.fechaCierre?.trim();
        const fechaDeposito = datos.fechaDeposito?.trim();
        const referencia = datos.referencia?.trim();
        const observacion = datos.observacion?.trim();
        const monto = Number(datos.montoDepositado);

        // 1. Validaciones generales.

        if (!datos.cajaId || !datos.userId) {
            throw new BadRequestException('No se recibió el contexto de la caja.');
        }

        if (!this.validarFecha(fechaCierre) || fechaCierre >= hoy) {
            throw new BadRequestException('Debes seleccionar un cierre anterior al día actual.');
        }

        if (!this.validarFecha(fechaDeposito) || fechaDeposito < fechaCierre || fechaDeposito > hoy) {
            throw new BadRequestException('La fecha del depósito no es válida.');
        }

        if (!referencia || referencia.length > 150) {
            throw new BadRequestException('La referencia bancaria es obligatoria y no puede superar 150 caracteres.');
        }

        if (referencia.includes('|')) {
            throw new BadRequestException('La referencia bancaria no puede contener el carácter |.');
        }

        if (!observacion || observacion.length > 1000) {
            throw new BadRequestException('Debes proporcionar una observación válida.');
        }

        if (!Number.isFinite(monto) || monto <= 0 || Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-7) {
            throw new BadRequestException('El monto debe ser mayor que cero y tener máximo dos decimales.');
        }

        const montoCentavos = Math.round(monto * 100);

        if (!Number.isSafeInteger(montoCentavos)) {
            throw new BadRequestException('El importe del depósito no es válido.');
        }

        const montoNormalizado = (montoCentavos / 100).toFixed(2);

        // 2. Construir referencia completa.
        // No se utiliza una columna adicional de observación.

        const referenciaFinal = [
            referencia,
            `Depósito L. ${montoNormalizado}`,
            `Cierre: ${fechaCierre}`,
            observacion,
        ].join(' | ');

        if (referenciaFinal.length > 150) {
            throw new BadRequestException(
                'La referencia bancaria, el monto, la fecha del cierre y la observación juntos no pueden superar los 150 caracteres.',
            );
        }

        this.validarPdf(datos.comprobante);

        const queryRunner = this.dataSource.createQueryRunner();

        let archivoKey: string | null = null;
        let transaccionConfirmada = false;

        try {
            // 3. Subir comprobante privado.

            archivoKey = await this.subirComprobante(datos.comprobante);

            await queryRunner.connect();
            await queryRunner.startTransaction();

            // 4. Bloquear la caja para serializar operaciones.
            // No se modifica ningún campo de la tabla cajas.

            const cajas = await queryRunner.query(`
                SELECT id, user_id
                FROM cajas
                WHERE id = ?
                FOR UPDATE
            `, [datos.cajaId]);

            if (!cajas[0] || String(cajas[0].user_id) !== String(datos.userId)) {
                throw new BadRequestException('La caja no corresponde al usuario autorizado.');
            }

            // 5. Obtener y bloquear el cierre seleccionado.

            const cierres = await queryRunner.query(`
                SELECT id, total_acumulado_h, total_acumulado
                FROM cierre_cajas
                WHERE cajas_id = ?
                  AND fecha = ?
                LIMIT 2
                FOR UPDATE
            `, [datos.cajaId, fechaCierre]);

            if (!cierres.length) {
                throw new NotFoundException('No existe un cierre de caja para la fecha seleccionada.');
            }

            if (cierres.length > 1) {
                throw new ConflictException('Existe más de un cierre para la fecha seleccionada.');
            }

            const cierre = cierres[0];

            // 6. Validar saldo pendiente.

            const saldoInicial = Number(cierre.total_acumulado_h);
            const saldoPendiente = Number(cierre.total_acumulado);

            if (!Number.isFinite(saldoInicial) || !Number.isFinite(saldoPendiente) || saldoInicial < 0 || saldoPendiente < 0) {
                throw new InternalServerErrorException('El cierre contiene saldos inválidos.');
            }

            const saldoCentavos = Math.round(saldoPendiente * 100);

            if (saldoCentavos === 0) {
                throw new ConflictException('Este cierre de caja ya se encuentra liquidado.');
            }

            if (montoCentavos > saldoCentavos) {
                throw new BadRequestException(`El depósito supera el saldo pendiente de L ${saldoPendiente.toFixed(2)}.`);
            }

            // 7. Validar referencia duplicada.
            // Compatible con referencias simples y concatenadas.

            const duplicados = await queryRunner.query(`
                SELECT id
                FROM historial_cajas
                WHERE cajas_id = ?
                  AND fecha = ?
                  AND tipo_documento = 4
                  AND tipo = 1
                  AND (
                      referencia = ?
                      OR TRIM(SUBSTRING_INDEX(referencia, ' | ', 1)) = ?
                  )
                LIMIT 1
            `, [
                datos.cajaId,
                fechaDeposito,
                referencia,
                referencia,
            ]);

            if (duplicados.length) {
                throw new ConflictException('Ya existe un egreso con esta referencia y fecha.');
            }

            // 8. Calcular nuevo saldo pendiente.

            const nuevoSaldoCentavos = saldoCentavos - montoCentavos;
            const nuevoSaldo = (nuevoSaldoCentavos / 100).toFixed(2);

            // 9. Actualizar únicamente el saldo pendiente del cierre.
            // total_acumulado_h permanece intacto.

            await queryRunner.query(`
                UPDATE cierre_cajas
                SET total_acumulado = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [nuevoSaldo, cierre.id]);

            // 10. Registrar historial sin afectar el efectivo.
            // Toda la información se almacena en referencia.
            // El total siempre será cero.

            await queryRunner.query(`
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
                )
                VALUES (
                    ?, 6, ?, 4, NULL, NULL,
                    0, ?, 1, ?,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            `, [
                datos.cajaId,
                referenciaFinal,
                fechaDeposito,
                archivoKey,
            ]);

            // 11. Confirmar transacción.

            await queryRunner.commitTransaction();
            transaccionConfirmada = true;

            this.logger.log(
                `Depósito histórico registrado. Caja: ${datos.cajaId}. Cierre: ${fechaCierre}. Usuario: ${datos.userId}. Monto: L ${montoNormalizado}. Pendiente: L ${nuevoSaldo}.`
            );

            return {
                success: true,
                message: nuevoSaldoCentavos === 0
                    ? 'Depósito registrado. El cierre ha sido liquidado completamente.'
                    : 'Depósito registrado correctamente.',
                data: {
                    fecha_cierre: fechaCierre,
                    fecha_deposito: fechaDeposito,
                    referencia,
                    monto: Number(montoNormalizado),
                    total_acumulado_h: saldoInicial.toFixed(2),
                    saldo_anterior: saldoPendiente.toFixed(2),
                    total_acumulado: nuevoSaldo,
                    liquidado: nuevoSaldoCentavos === 0,
                    comprobante: {
                        disponible: true,
                        tipo: 'application/pdf',
                        path: archivoKey,
                    },
                },
            };

        } catch (error) {
            if (queryRunner.isTransactionActive && !transaccionConfirmada) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) {
                    this.logger.error('Error revirtiendo el depósito histórico.', rollbackError);
                }
            }

            if (archivoKey && !transaccionConfirmada) {
                try {
                    await this.eliminarComprobante(archivoKey);
                } catch (eliminarError) {
                    this.logger.error(`Error eliminando comprobante: ${archivoKey}`, eliminarError);
                }
            }

            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof ConflictException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            this.logger.error('Error registrando depósito histórico.', error);

            throw new InternalServerErrorException('No fue posible registrar el depósito.');

        } finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
}
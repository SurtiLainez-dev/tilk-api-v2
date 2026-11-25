import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SpacesService } from '../spaces/spaces.service.js';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

export interface RegistrarEgresoCajaDto {
    slug: string;
    montoDepositado: number;
    referencia: string;
    observacion?: string;
    comprobante: Buffer;
    nombreOriginal?: string;
}

@Injectable()
export class CajaEgresosService {
    private readonly logger = new Logger(CajaEgresosService.name);

    private readonly directorio = 'Contabilidad/caja/egreso/archivo';

    constructor(
        private readonly dataSource: DataSource,
        private readonly spacesService: SpacesService,
    ) {}

    /**
     * Genera una clave única para guardar
     * el comprobante en DigitalOcean Spaces.
     */
    private generarNombreArchivo(): string {
        return `${this.directorio}/${randomUUID()}.pdf`;
    }

    /**
     * Valida que el comprobante sea un PDF
     * y no supere los 15 MB.
     */
    private validarPdf(archivo: Buffer): void {
        if (!Buffer.isBuffer(archivo)) {
            throw new BadRequestException('El comprobante debe ser un archivo válido.');
        }

        if (archivo.length === 0) {
            throw new BadRequestException('El comprobante está vacío.');
        }

        const limite = 15 * 1024 * 1024;

        if (archivo.length > limite) {
            throw new BadRequestException('El comprobante no puede superar 15 MB.');
        }

        if (archivo.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new BadRequestException('El comprobante debe estar en formato PDF.');
        }
    }

    /**
     * Sube el comprobante a DigitalOcean Spaces.
     *
     * El archivo permanece privado.
     *
     * Devuelve solamente la clave S3.
     */
    private async subirComprobante(archivo: Buffer): Promise<string> {
        const key = this.generarNombreArchivo();

        await this.spacesService.getCliente().send(
            new PutObjectCommand({
                Bucket: this.spacesService.getBucket(),
                Key: key,
                Body: archivo,
                ContentType: 'application/pdf',
                ACL: 'private',
            }),
        );

        return key;
    }

    /**
     * Elimina el comprobante de Spaces
     * cuando falla la transacción MySQL.
     */
    private async eliminarComprobante(key: string): Promise<void> {
        await this.spacesService.getCliente().send(
            new DeleteObjectCommand({
                Bucket: this.spacesService.getBucket(),
                Key: key,
            }),
        );
    }

    /**
     * Registra un egreso de caja.
     *
     * 1. Valida los datos.
     * 2. Sube el comprobante privado.
     * 3. Configura la zona horaria MySQL.
     * 4. Inicia una transacción.
     * 5. Bloquea la caja.
     * 6. Comprueba el saldo.
     * 7. Descuenta el importe.
     * 8. Registra historial_cajas.
     * 9. Confirma la transacción.
     *
     * Si MySQL falla, intenta eliminar
     * el comprobante de Spaces.
     */
    async registrarEgreso(datos: RegistrarEgresoCajaDto) {
        const slug = datos.slug?.trim();
        const referencia = datos.referencia?.trim();

        // ======================================
        // 1. VALIDACIONES
        // ======================================

        if (!slug) {
            throw new BadRequestException('El identificador de la caja es obligatorio.');
        }

        if (!referencia) {
            throw new BadRequestException('La referencia bancaria es obligatoria.');
        }

        if (referencia.length > 150) {
            throw new BadRequestException('La referencia no puede superar 150 caracteres.');
        }

        const monto = Number(datos.montoDepositado);

        if (
            !Number.isFinite(monto) ||
            monto <= 0 ||
            !Number.isInteger(Math.round(monto * 100)) ||
            Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-7
        ) {
            throw new BadRequestException('El monto debe ser mayor que cero y tener máximo dos decimales.');
        }

        const montoCentavos = Math.round(monto * 100);
        const montoNormalizado = (montoCentavos / 100).toFixed(2);

        this.validarPdf(datos.comprobante);

        // ======================================
        // 2. FECHA Y HORA DE HONDURAS
        // ======================================

        const { fecha, fecha_hora_mysql: fechaHora, created_at, updated_at } = fechaHonduras();

        let archivoKey: string | null = null;
        let transaccionConfirmada = false;

        const queryRunner = this.dataSource.createQueryRunner();

        let conexionEstablecida = false;
        let zonaOriginal: string | null = null;

        try {
            // ==================================
            // 3. SUBIR COMPROBANTE
            // ==================================

            archivoKey = await this.subirComprobante(datos.comprobante);

            // ==================================
            // 4. CONECTAR MYSQL
            // ==================================

            await queryRunner.connect();

            conexionEstablecida = true;

            // Guardar la zona horaria de esta
            // conexión para restaurarla después.
            const zonas = await queryRunner.query(
                'SELECT @@session.time_zone AS zona',
            ) as Array<{ zona: string }>;

            zonaOriginal = zonas[0]?.zona ?? null;

            // Honduras utiliza UTC-06:00.
            // Esto permite que MySQL interprete
            // correctamente los TIMESTAMP enviados.
            await queryRunner.query(
                "SET SESSION time_zone = '-06:00'",
            );

            // ==================================
            // 5. INICIAR TRANSACCIÓN
            // ==================================

            await queryRunner.startTransaction();

            // ==================================
            // 6. BLOQUEAR CAJA
            // ==================================

            const cajas: Array<{
                id: number;
                total: string | number;
            }> = await queryRunner.query(
                `
                SELECT
                    id,
                    total
                FROM cajas
                WHERE slug = ?
                LIMIT 1
                FOR UPDATE
                `,
                [slug],
            );

            const caja = cajas[0];

            if (!caja) {
                throw new NotFoundException('No se encontró la caja solicitada.');
            }

            // ==================================
            // 7. VALIDAR SALDO
            // ==================================

            const saldoActual = Number(caja.total);

            if (!Number.isFinite(saldoActual)) {
                throw new InternalServerErrorException('El saldo de la caja no es válido.');
            }

            const saldoCentavos = Math.round(saldoActual * 100);

            if (saldoCentavos < montoCentavos) {
                throw new BadRequestException('La caja no tiene saldo suficiente para registrar este egreso.');
            }

            const nuevoSaldoCentavos = saldoCentavos - montoCentavos;
            const nuevoSaldo = (nuevoSaldoCentavos / 100).toFixed(2);

            // ==================================
            // 8. DESCONTAR SALDO
            // ==================================

            await queryRunner.query(
                `
                UPDATE cajas
                SET total = ?,
                    updated_at = ?
                WHERE id = ?
                `,
                [
                    nuevoSaldo,
                    updated_at,
                    caja.id,
                ],
            );

            // ==================================
            // 9. REGISTRAR HISTORIAL
            // ==================================
            //
            // forma_pago_id = 6
            // tipo_documento = 4
            // tipo = 1
            //
            // historial = clave privada S3
            //
            // created_at y updated_at se
            // registran mediante fechaHonduras().
            // ==================================

            await queryRunner.query(
                `
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
                    ?,
                    6,
                    ?,
                    4,
                    NULL,
                    NULL,
                    ?,
                    ?,
                    1,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    caja.id,
                    referencia,
                    montoNormalizado,
                    fecha,
                    archivoKey,
                    created_at,
                    updated_at,
                ],
            );

            // ==================================
            // 10. CONFIRMAR TRANSACCIÓN
            // ==================================

            await queryRunner.commitTransaction();

            transaccionConfirmada = true;

            this.logger.log(
                `Egreso registrado. ` +
                `Caja: ${slug}. ` +
                `Fecha: ${fecha}. ` +
                `Hora Honduras: ${fechaHora}. ` +
                `Monto: L ${montoNormalizado}`,
            );

            // ==================================
            // 11. RESPUESTA
            // ==================================

            return {
                success: true,
                message: 'Egreso registrado correctamente.',

                data: {
                    fecha,
                    referencia,
                    monto: Number(montoNormalizado),
                    saldo_actual: Number(nuevoSaldo),

                    comprobante: {
                        disponible: true,
                        tipo: 'application/pdf',

                        // Clave para solicitar una
                        // URL firmada posteriormente.
                        path: archivoKey,
                    },
                },
            };

        } catch (error) {
            // ==================================
            // REVERTIR TRANSACCIÓN
            // ==================================

            if (queryRunner.isTransactionActive && !transaccionConfirmada) {
                try {
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) {
                    this.logger.error(
                        'No se pudo revertir la transacción del egreso.',
                        rollbackError instanceof Error
                            ? rollbackError.stack
                            : String(rollbackError),
                    );
                }
            }

            // ==================================
            // LIMPIAR COMPROBANTE S3
            // ==================================

            if (archivoKey && !transaccionConfirmada) {
                try {
                    await this.eliminarComprobante(archivoKey);
                } catch (eliminarError) {
                    this.logger.error(
                        `No se pudo limpiar el comprobante S3: ${archivoKey}`,
                        eliminarError instanceof Error
                            ? eliminarError.stack
                            : String(eliminarError),
                    );
                }
            }

            this.logger.error(
                'Error registrando egreso de caja.',
                error instanceof Error
                    ? error.stack
                    : String(error),
            );

            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }

            throw new InternalServerErrorException('No fue posible registrar el egreso de caja.');

        } finally {
            // ==================================
            // RESTAURAR ZONA HORARIA
            // ==================================
            //
            // La conexión puede reutilizarse
            // por otros módulos de TypeORM.
            // ==================================

            if (conexionEstablecida && !queryRunner.isReleased) {
                try {
                    if (zonaOriginal !== null) {
                        await queryRunner.query(
                            'SET SESSION time_zone = ?',
                            [zonaOriginal],
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        'No se pudo restaurar la zona horaria de la conexión MySQL.',
                        error instanceof Error
                            ? error.stack
                            : String(error),
                    );
                }
            }

            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
}
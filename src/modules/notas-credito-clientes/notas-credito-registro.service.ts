import { Injectable, BadRequestException, ConflictException, NotFoundException, UnprocessableEntityException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID, createHash } from 'node:crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { NotaCreditoClientes, NotaCreditoModalidad, NotaCreditoOrigen, NotaCreditoUso, TipoNotaCreditosEntity } from '../../database/entities/index.js';
import { SpacesService } from '../spaces/spaces.service.js';
import { CrearNotaCreditoDto } from './dto/crear-nota-credito.dto.js';
import { NotasCreditoContadoresService } from './notas-credito-contadores.service.js';

@Injectable()
export class NotasCreditoRegistroService {

    private readonly logger = new Logger(NotasCreditoRegistroService.name);
    private readonly directorio = 'Contabilidad/notas-credito/clientes/archivos';

    constructor(
        private readonly dataSource: DataSource,
        private readonly contadoresService: NotasCreditoContadoresService,
        private readonly spacesService: SpacesService,
    ) {}

    // ==========================================
    // DETECTAR FORMATO DEL ARCHIVO
    // ==========================================

    private detectarFormatoArchivo(archivo: Buffer): { extension: string; contentType: string } {

        if (archivo.subarray(0, 5).toString() === '%PDF-') {
            return { extension: 'pdf', contentType: 'application/pdf' };
        }

        if (archivo.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) {
            return { extension: 'jpg', contentType: 'image/jpeg' };
        }

        if (archivo.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
            return { extension: 'png', contentType: 'image/png' };
        }

        if (archivo.subarray(0, 4).toString() === 'RIFF' && archivo.subarray(8, 12).toString() === 'WEBP') {
            return { extension: 'webp', contentType: 'image/webp' };
        }

        throw new BadRequestException('El documento adjunto debe estar en formato PDF, JPG, PNG o WEBP.');
    }

    // ==========================================
    // SUBIR ARCHIVO A SPACES
    // ==========================================

    private async subirArchivo(archivo: Buffer, key: string, contentType: string): Promise<void> {
        await this.spacesService.getCliente().send(new PutObjectCommand({
            Bucket: this.spacesService.getBucket(),
            Key: key,
            Body: archivo,
            ContentType: contentType,
            ACL: 'private',
        }));
    }

    // ==========================================
    // ELIMINAR ARCHIVO DE SPACES
    // ==========================================

    private async eliminarArchivo(key: string): Promise<void> {
        await this.spacesService.getCliente().send(new DeleteObjectCommand({
            Bucket: this.spacesService.getBucket(),
            Key: key,
        }));
    }

    // ==========================================
    // REGISTRAR NOTA DE CRÉDITO
    // ==========================================

    async registrar(dto: CrearNotaCreditoDto, userId: string, archivo?: Buffer) {

        // 1. Validar monto
        const monto = Number(dto.monto);

        if (!Number.isFinite(monto) || monto <= 0 || monto > 9999999.99) {
            throw new BadRequestException('El monto de la nota no es válido.');
        }

        // 2. Validar concepto y motivo
        const concepto = dto.concepto.trim();
        const motivo = dto.motivo.trim();

        if (!concepto || !motivo) {
            throw new BadRequestException('El concepto y el motivo son obligatorios.');
        }

        // 3. Validar modalidad
        if (dto.modalidad === NotaCreditoModalidad.CUENTA) {
            throw new UnprocessableEntityException('La aplicación directa a cuentas todavía no está habilitada.');
        }

        if (dto.venta_slug) {
            throw new BadRequestException('Una nota de saldo a favor no debe tener una venta asociada.');
        }

        const uso = dto.uso ?? NotaCreditoUso.GENERAL;

        // 4. Validar archivo opcional
        const formatoArchivo = archivo !== undefined ? this.detectarFormatoArchivo(archivo) : null;
        const archivoHash = archivo ? createHash('sha256').update(archivo).digest('hex') : null;

        // 5. Generar hash de la operación
        const hash = createHash('sha256').update(JSON.stringify([
            userId,
            dto.cliente_slug,
            dto.modalidad,
            uso,
            dto.tipo_nota_credito_codigo,
            monto.toFixed(2),
            concepto,
            motivo,
            dto.referencia?.trim() || null,
            dto.fecha_vencimiento || null,
            archivoHash,
        ])).digest('hex');

        const repository = this.dataSource.getRepository(NotaCreditoClientes);

        // 6. Verificar si la operación ya fue registrada
        const operacionExistente = await repository.findOne({
            where: { operacion_uuid: dto.operacion_uuid },
        });

        if (operacionExistente) {
            if (operacionExistente.operacion_hash !== hash) {
                throw new ConflictException('Esta operación ya fue utilizada con otros datos.');
            }

            return this.respuesta(operacionExistente);
        }

        let archivoKey: string | null = null;
        let transaccionConfirmada = false;

        try {

            // 7. Subir archivo opcional a Spaces
            if (archivo && formatoArchivo) {
                archivoKey = `${this.directorio}/${randomUUID()}.${formatoArchivo.extension}`;
                await this.subirArchivo(archivo, archivoKey, formatoArchivo.contentType);
            }

            // 8. Iniciar transacción MySQL
            const resultado = await this.dataSource.transaction(async manager => {

                const repository = manager.getRepository(NotaCreditoClientes);

                // 9. Buscar y bloquear cliente
                const clientes = await manager.query(`
                    SELECT id, slug
                    FROM clientes
                    WHERE slug = ?
                    LIMIT 1
                    FOR UPDATE
                `, [dto.cliente_slug]);

                const cliente = clientes[0];

                if (!cliente) {
                    throw new NotFoundException('El cliente seleccionado no existe.');
                }

                // 10. Verificar duplicados dentro de la transacción
                const existente = await repository.findOne({
                    where: { operacion_uuid: dto.operacion_uuid },
                    lock: { mode: 'pessimistic_write' },
                });

                if (existente) {
                    if (existente.operacion_hash !== hash) {
                        throw new ConflictException('Esta operación ya fue utilizada con otros datos.');
                    }

                    return { nota: existente, nueva: false };
                }

                // 11. Buscar tipo de nota de crédito
                const tipo = await manager.getRepository(TipoNotaCreditosEntity).findOne({
                    where: { id: dto.tipo_nota_credito_codigo },
                });

                if (!tipo) {
                    throw new BadRequestException('El tipo de nota de crédito no existe.');
                }

                const nombreTipo = tipo.nombre.trim().toUpperCase();

                if (nombreTipo === 'DEBITO' || nombreTipo === 'DÉBITO') {
                    throw new BadRequestException('El tipo seleccionado corresponde a una nota de débito.');
                }

                if (nombreTipo === 'ANTICIPOS') {
                    throw new BadRequestException('Los anticipos deben registrarse mediante su operación correspondiente.');
                }

                // 12. Obtener siguiente contador del cliente
                const contador = await this.contadoresService.siguiente(manager, String(cliente.id));

                // 13. Generar código de nota de crédito
                const codigo = `NC-${cliente.id}-${String(contador).padStart(6, '0')}`;

                if (codigo.length > 30) {
                    throw new BadRequestException('El código generado excede la longitud permitida.');
                }

                const ahora = new Date();

                // 14. Crear nota de crédito
                const nota = repository.create({
                    slug: randomUUID(),
                    codigo,
                    contador,
                    cliente_id: String(cliente.id),
                    venta_id: null,
                    anticipo_cliente_id: null,
                    modalidad: NotaCreditoModalidad.SALDO_FAVOR,
                    origen: NotaCreditoOrigen.CONTABILIDAD,
                    uso,
                    monto,
                    saldo_disponible: monto.toFixed(2),
                    estado: 1,
                    tipo: 1,
                    tipo_nota_credito_id: tipo.id,
                    user_id: userId,
                    concepto,
                    motivo,
                    referencia: dto.referencia?.trim() || null,
                    cc_id: null,
                    ct_libro_diario_id: null,
                    recibo_id: null,
                    recibo_id_2: null,
                    saldo_anterior: 0,
                    saldo_nuevo: monto,
                    url: archivoKey,
                    url_comprobante: null,
                    fecha_vencimiento: dto.fecha_vencimiento || null,
                    fecha_liquidacion: null,
                    fecha_anulacion: null,
                    operacion_uuid: dto.operacion_uuid,
                    operacion_hash: hash,
                    created_at: ahora,
                    updated_at: ahora,
                });

                // 15. Guardar nota de crédito
                const registrada = await repository.save(nota);

                return { nota: registrada, nueva: true };
            });

            transaccionConfirmada = true;

            // 16. Limpiar archivo si otro proceso registró primero la operación
            if (!resultado.nueva && archivoKey && resultado.nota.url !== archivoKey) {
                await this.limpiarArchivo(archivoKey);
            }

            if (resultado.nueva) {
                this.logger.log(`Nota de crédito registrada: ${resultado.nota.codigo}. Monto: L ${monto.toFixed(2)}`);
            }

            // 17. Responder al frontend
            return this.respuesta(resultado.nota);

        } catch (error: unknown) {

            // 18. Verificar posibles duplicados o confirmaciones inciertas
            let existente: NotaCreditoClientes | null = null;
            let consultaConfirmada = false;

            try {
                existente = await repository.findOne({
                    where: { operacion_uuid: dto.operacion_uuid },
                });

                consultaConfirmada = true;

            } catch (consultaError) {
                this.logger.error('No fue posible verificar el estado de la operación.', consultaError instanceof Error ? consultaError.stack : String(consultaError));
            }

            // 19. Limpiar archivo solamente si no está vinculado
            if (archivoKey && !transaccionConfirmada && consultaConfirmada && existente?.url !== archivoKey) {
                await this.limpiarArchivo(archivoKey);
            }

            // 20. Si la operación ya existe, comprobar el hash
            if (existente) {
                if (existente.operacion_hash === hash) {
                    return this.respuesta(existente);
                }

                throw new ConflictException('Esta operación ya fue utilizada con otros datos.');
            }

            const mysqlError = error as { code?: string; driverError?: { code?: string } };

            if (mysqlError.code === 'ER_DUP_ENTRY' || mysqlError.driverError?.code === 'ER_DUP_ENTRY') {
                throw new ConflictException('Existe un conflicto con el identificador de la operación o el código de la nota.');
            }

            this.logger.error('Error registrando nota de crédito.', error instanceof Error ? error.stack : String(error));

            throw error;
        }
    }

    // ==========================================
    // LIMPIEZA SEGURA DE ARCHIVO
    // ==========================================

    private async limpiarArchivo(key: string): Promise<void> {
        try {
            await this.eliminarArchivo(key);
        } catch (error) {
            this.logger.error(`No se pudo eliminar el archivo de Spaces: ${key}`, error instanceof Error ? error.stack : String(error));
        }
    }

    // ==========================================
    // RESPUESTA AL FRONTEND
    // ==========================================

    private respuesta(nota: NotaCreditoClientes) {
        return {
            success: true,
            message: 'Nota de crédito registrada correctamente.',
            data: {
                slug: nota.slug,
                codigo: nota.codigo,
                modalidad: nota.modalidad,
                uso: nota.uso,
                monto: Number(nota.monto),
                saldo_disponible: Number(nota.saldo_disponible),
                archivo_adjunto: Boolean(nota.url),
                documento_url: null,
            },
        };
    }
}
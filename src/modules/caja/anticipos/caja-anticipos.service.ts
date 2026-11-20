import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID, createHash } from 'node:crypto';

import { CajaSesionService } from '../caja-sesion.service.js';
import { CajaAnticiposRecibosService } from './caja-anticipos-recibos.service.js';
import { PostearCuentaHistorialCajaService } from '../postear_cuenta/postear-cuenta-historial-caja.service.js';
import { NotasCreditoContadoresService } from '../../notas-credito-clientes/notas-credito-contadores.service.js';
import { CrearAnticipoDto} from "./dto/crear-anticipo.dto.js";

@Injectable()
export class CajaAnticiposService {
    private readonly logger = new Logger(CajaAnticiposService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly cajaSesionService: CajaSesionService,
        private readonly recibosService: CajaAnticiposRecibosService,
        private readonly historialCajaService: PostearCuentaHistorialCajaService,
        private readonly contadoresService: NotasCreditoContadoresService,
    ) {}

    // ==========================================
    // VALIDAR ID INTERNO
    // ==========================================

    private validarId(valor: unknown, campo: string): string {
        const id = String(valor ?? '');

        if (!/^[1-9]\d*$/.test(id)) {
            throw new BadRequestException(`${campo} no es válido.`);
        }

        return id;
    }

    // ==========================================
    // VALIDAR Y NORMALIZAR MONTO
    // ==========================================

    private normalizarMonto(valor: unknown): string {
        const texto = String(valor ?? '').trim();

        if (!/^\d{1,7}(\.\d{1,2})?$/.test(texto)) {
            throw new BadRequestException('El monto del anticipo no es válido.');
        }

        const monto = Number(texto);

        if (!Number.isFinite(monto) || monto <= 0 || monto > 9999999.99) {
            throw new BadRequestException('El monto debe ser mayor que cero.');
        }

        return monto.toFixed(2);
    }

    // ==========================================
    // CONSULTAR OPERACIÓN EXISTENTE
    // ==========================================

    private async obtenerOperacion(manager: EntityManager, uuid: string, bloquear = false) {
        const registros = await manager.query(`
            SELECT
                nc.slug,
                nc.codigo,
                nc.monto,
                nc.saldo_disponible,
                nc.estado,
                nc.uso,
                nc.origen,
                nc.operacion_hash,
                nc.operacion_uuid,
                nc.user_id,
                a.slug AS anticipo_slug,
                r.codigo AS recibo_codigo,
                r.fecha AS recibo_fecha,
                r.hora AS recibo_hora,
                r.caja_id AS recibo_caja_id,
                c.slug AS cliente_slug,
                CONCAT_WS(' ', c.nombres, c.apellidos) AS cliente_nombre
            FROM nota_credito_clientes nc
            LEFT JOIN anticipo_clientes a ON a.id = nc.anticipo_cliente_id
            LEFT JOIN recibos r ON r.id = nc.recibo_id
            LEFT JOIN clientes c ON c.id = nc.cliente_id
            WHERE nc.operacion_uuid = ?
            LIMIT 1
            ${bloquear ? 'FOR UPDATE' : ''}
        `, [uuid]);

        return registros[0] ?? null;
    }

    // ==========================================
    // VALIDAR OPERACIÓN DUPLICADA
    // ==========================================

    private validarOperacionExistente(operacion: any, hash: string, userId: string, cajaId: string) {
        if (
            operacion.operacion_hash !== hash ||
            operacion.origen !== 'CAJA' ||
            String(operacion.user_id) !== userId ||
            String(operacion.recibo_caja_id) !== cajaId
        ) {
            throw new ConflictException('La operación ya fue utilizada con otros datos.');
        }

        if (!operacion.anticipo_slug || !operacion.recibo_codigo) {
            throw new ConflictException('La operación existente tiene registros incompletos.');
        }

        return this.respuesta(operacion, true);
    }

    // ==========================================
    // FORMATEAR RESPUESTA
    // ==========================================

    private respuesta(operacion: any, duplicada = false) {
        return {
            success: true,
            registrado: true,
            operacion_reutilizada: duplicada,
            message: duplicada
                ? 'El anticipo ya había sido registrado correctamente.'
                : 'Anticipo registrado correctamente.',

            operacion_uuid: operacion.operacion_uuid,

            data: {
                cliente: {
                    slug: operacion.cliente_slug,
                    nombre: operacion.cliente_nombre,
                },

                anticipo: {
                    slug: operacion.anticipo_slug,
                    monto: Number(operacion.monto).toFixed(2),
                    uso: operacion.uso,
                },

                recibo: {
                    codigo: operacion.recibo_codigo,
                    fecha: operacion.recibo_fecha,
                    hora: operacion.recibo_hora,
                    total: Number(operacion.monto).toFixed(2),
                    saldo_anterior: Number(operacion.monto).toFixed(2),
                    saldo_nuevo: '0.00',
                },

                nota_credito: {
                    slug: operacion.slug,
                    codigo: operacion.codigo,
                    monto: Number(operacion.monto).toFixed(2),
                    saldo_disponible: Number(operacion.saldo_disponible).toFixed(2),
                    estado: Number(operacion.estado),
                    modalidad: 'SALDO_FAVOR',
                    origen: 'CAJA',
                    uso: operacion.uso,
                },
            },
        };
    }

    // ==========================================
    // REGISTRAR ANTICIPO
    // ==========================================

    async registrar(dto: CrearAnticipoDto, token: string, usuarioId: string) {
        const userId = this.validarId(usuarioId, 'user_id');

        // ======================================
        // 1. VALIDAR SESIÓN DE CAJA
        // ======================================

        if (typeof token !== 'string' || !token.trim()) {
            throw new UnauthorizedException('No se recibió el token de sesión de caja.');
        }

        const sesion = await this.cajaSesionService.validarSesion(token.trim(), userId);

        if (!sesion?.data?.caja_id) {
            throw new UnauthorizedException('No se pudo identificar la caja de la sesión activa.');
        }

        const cajaId = this.validarId(sesion.data.caja_id, 'caja_id');

        // ======================================
        // 2. VALIDAR DATOS DEL ANTICIPO
        // ======================================

        const clienteSlug = dto.cliente_slug?.trim();
        const monto = this.normalizarMonto(dto.monto);
        const observacion = dto.observacion?.trim();
        const formaPagoId = this.validarId(dto.forma_pago_id, 'forma_pago_id');
        const uso = dto.uso;
        const uuid = dto.operacion_uuid?.trim().toLowerCase();

        if (!clienteSlug || clienteSlug.length > 255) {
            throw new BadRequestException('Debes seleccionar un cliente válido.');
        }

        if (!observacion || observacion.length > 150) {
            throw new BadRequestException('La observación debe contener entre 1 y 150 caracteres.');
        }

        if (!['GENERAL', 'PAGO_DXC'].includes(uso)) {
            throw new BadRequestException('El uso del anticipo no es válido.');
        }

        if (!uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
            throw new BadRequestException('El identificador de operación no es válido.');
        }

        // ======================================
        // 3. GENERAR HASH DE LA OPERACIÓN
        // ======================================

        const hash = createHash('sha256').update(JSON.stringify({
            tipo: 'ANTICIPO_CAJA',
            cliente_slug: clienteSlug,
            caja_id: cajaId,
            user_id: userId,
            monto,
            forma_pago_id: formaPagoId,
            uso,
            observacion,
        })).digest('hex');

        // ======================================
        // 4. VERIFICAR OPERACIÓN EXISTENTE
        // ======================================

        const existente = await this.obtenerOperacion(this.dataSource.manager, uuid);

        if (existente) {
            return this.validarOperacionExistente(existente, hash, userId, cajaId);
        }

        this.logger.log(`[ANTICIPO] Iniciando operación=${uuid}, caja=${cajaId}, monto=${monto}`);

        try {

            // ==================================
            // 5. INICIAR TRANSACCIÓN
            // ==================================

            return await this.dataSource.transaction(async manager => {

                // ==============================
                // 6. BUSCAR Y BLOQUEAR CLIENTE
                // ==============================

                const clientes = await manager.query(`
                    SELECT id, slug, nombres, apellidos
                    FROM clientes
                    WHERE slug = ?
                    LIMIT 1
                    FOR UPDATE
                `, [clienteSlug]);

                const cliente = clientes[0];

                if (!cliente) {
                    throw new NotFoundException('No se encontró el cliente seleccionado.');
                }

                const clienteId = this.validarId(cliente.id, 'cliente_id');

                // ==============================
                // 7. VERIFICAR DUPLICADOS
                // ==============================

                const operacionExistente = await this.obtenerOperacion(manager, uuid, true);

                if (operacionExistente) {
                    return this.validarOperacionExistente(operacionExistente, hash, userId, cajaId);
                }

                // ==============================
                // 8. VALIDAR Y BLOQUEAR CAJA
                // ==============================

                const cajas = await manager.query(`
                    SELECT id, slug, user_id, sucursal_id, total
                    FROM cajas
                    WHERE id = ?
                    LIMIT 1
                    FOR UPDATE
                `, [cajaId]);

                const caja = cajas[0];

                if (!caja) {
                    throw new NotFoundException('No se encontró la caja.');
                }

                if (String(caja.user_id) !== userId) {
                    throw new UnauthorizedException('El usuario no está autorizado para procesar operaciones en esta caja.');
                }

                if (!Number.isFinite(Number(caja.total ?? 0))) {
                    throw new ConflictException('El saldo de la caja no es válido.');
                }

                const sucursalId = this.validarId(caja.sucursal_id, 'sucursal_id');

                // ==============================
                // 9. VALIDAR FORMA DE PAGO
                // ==============================

                const formas = await manager.query(`
                    SELECT id, nombre
                    FROM forma_pagos
                    WHERE id = ?
                    LIMIT 1
                `, [formaPagoId]);

                if (!formas.length) {
                    throw new NotFoundException('No se encontró la forma de pago.');
                }

                // Únicamente dinero efectivamente recibido.
                // Actualmente se habilitan efectivo y tarjeta.

                if (!['3', '5'].includes(formaPagoId)) {
                    throw new BadRequestException('La forma de pago no está habilitada para anticipos.');
                }

                // ==============================
                // 10. VALIDAR TIPO DE NOTA
                // ==============================

                const tipos = await manager.query(`
                    SELECT id, nombre
                    FROM tipo_nota_creditos
                    WHERE id = 1
                    LIMIT 1
                `);

                if (!tipos.length || String(tipos[0].nombre).trim().toUpperCase() !== 'ANTICIPOS') {
                    throw new ConflictException('No se encontró el tipo de nota de crédito ANTICIPOS.');
                }

                // ==============================
                // 11. CREAR RECIBO
                // ==============================

                const recibo = await this.recibosService.crearRecibo(manager, {
                    user_id: userId,
                    sucursal_id: sucursalId,
                    caja_id: cajaId,
                    total: monto,
                    observacion,
                });

                // ==============================
                // 12. CREAR ANTICIPO
                // ==============================

                const anticipoSlug = randomUUID();

                const anticipo = await manager.query(`
                    INSERT INTO anticipo_clientes (
                        slug,
                        cliente_id,
                        cc_id,
                        motivo,
                        monto,
                        estado,
                        archivo,
                        recibo_id,
                        gestion_saldo,
                        uso,
                        fecha_liquidacion,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?, ?, NULL, ?, ?, 1, NULL, ?,
                        'NOTA_CREDITO', ?, NULL, NOW(), NOW()
                    )
                `, [
                    anticipoSlug,
                    clienteId,
                    observacion,
                    monto,
                    recibo.recibo_id,
                    uso,
                ]);

                if (!anticipo.insertId) {
                    throw new ConflictException('No se pudo registrar el anticipo del cliente.');
                }

                const anticipoId = String(anticipo.insertId);

                // ==============================
                // 13. REGISTRAR HISTORIAL CAJA
                // ==============================
                //
                // tipo = 0: ingreso.
                // tipo_documento = 5: anticipo.
                //
                // El servicio existente actualiza
                // cajas.total cuando es efectivo.
                // ==============================

                await this.historialCajaService.registrar(manager, {
                    caja_id: cajaId,
                    forma_pago_id: formaPagoId,
                    recibo_id: recibo.recibo_id,
                    factura_id: null,
                    total: monto,
                    tipo: 0,
                    tipo_documento: 5,
                    historial: null,
                });

                // ==============================
                // 14. GENERAR CONTADOR NC
                // ==============================

                const contador = await this.contadoresService.siguiente(manager, clienteId);
                const codigo = `NC-${clienteId}-${String(contador).padStart(6, '0')}`;

                if (codigo.length > 30) {
                    throw new ConflictException('El código de nota de crédito supera la longitud permitida.');
                }

                const notaSlug = randomUUID();

                // ==============================
                // 15. CREAR NOTA DE CRÉDITO
                // ==============================

                const nota = await manager.query(`
                    INSERT INTO nota_credito_clientes (
                        slug,
                        codigo,
                        contador,
                        cliente_id,
                        anticipo_cliente_id,
                        cc_id,
                        monto,
                        user_id,
                        ct_libro_diario_id,
                        referencia,
                        concepto,
                        motivo,
                        venta_id,
                        tipo_nota_credito_id,
                        recibo_id,
                        recibo_id_2,
                        saldo_anterior,
                        saldo_nuevo,
                        tipo,
                        modalidad,
                        origen,
                        uso,
                        saldo_disponible,
                        estado,
                        url,
                        url_comprobante,
                        fecha_vencimiento,
                        fecha_liquidacion,
                        fecha_anulacion,
                        operacion_uuid,
                        operacion_hash,
                        user_anulacion_id,
                        motivo_anulacion,
                        created_at,
                        updated_at
                    )
                    VALUES (
                               ?, ?, ?, ?, ?, NULL,
                               ?, ?, NULL, NULL,
                               ?, ?, NULL, 1,
                               ?, NULL, 0, ?,
                               1, 'SALDO_FAVOR', 'CAJA', ?,
                               ?, 1, NULL, NULL,
                               DATE_ADD(CURDATE(), INTERVAL 6 MONTH), NULL, NULL,
                               ?, ?, NULL, NULL,
                               NOW(), NOW()
                           )
                `, [
                    notaSlug,
                    codigo,
                    contador,
                    clienteId,
                    anticipoId,
                    monto,
                    userId,
                    uso === 'PAGO_DXC' ? 'ANTICIPO PARA PAGO DXC' : 'ANTICIPO DE CLIENTE',
                    observacion,
                    recibo.recibo_id,
                    monto,
                    uso,
                    monto,
                    uuid,
                    hash,
                ]);

                if (!nota.insertId) {
                    throw new ConflictException('No se pudo generar la nota de crédito del anticipo.');
                }

                // ==============================
                // 16. PREPARAR RESPUESTA
                // ==============================

                const resultado = await this.obtenerOperacion(manager, uuid);

                if (!resultado) {
                    throw new ConflictException('No se pudo consultar el anticipo generado.');
                }

                return this.respuesta(resultado);
            });

        } catch (error) {

            // ==================================
            // 17. CONTROL DE OPERACIONES
            //     CONCURRENTES
            // ==================================

            const errorMysql = error as {
                code?: string;
                driverError?: { code?: string };
            };

            const codigoError = errorMysql.driverError?.code ?? errorMysql.code;

            if (codigoError === 'ER_DUP_ENTRY') {

                const registrado = await this.obtenerOperacion(this.dataSource.manager, uuid);

                if (registrado) {
                    return this.validarOperacionExistente(registrado, hash, userId, cajaId);
                }
            }

            this.logger.error(
                `[ANTICIPO] Error operación=${uuid}`,
                error instanceof Error ? error.stack : String(error),
            );

            throw error;
        }
    }
}
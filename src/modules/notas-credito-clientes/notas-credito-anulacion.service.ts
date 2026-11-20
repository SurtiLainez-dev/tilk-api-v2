import { Injectable, Logger, BadRequestException, ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { NotaCreditoClientes, NotaCreditoClienteAplicaciones, NotaCreditoModalidad, NotaCreditoOrigen } from '../../database/entities/index.js';

@Injectable()
export class NotasCreditoAnulacionService {
    private readonly logger = new Logger(NotasCreditoAnulacionService.name);

    constructor(
        private readonly dataSource: DataSource,
    ) {}

    // ==========================================
    // ANULAR NOTA DE CRÉDITO
    // ==========================================

    async anular(slug: string, userId: string, motivo: string) {
        if (typeof motivo !== 'string') {
            throw new BadRequestException('El motivo de anulación es obligatorio.');
        }

        const motivoAnulacion = motivo.trim();

        if (motivoAnulacion.length < 5 || motivoAnulacion.length > 400) {
            throw new BadRequestException('El motivo de anulación debe contener entre 5 y 400 caracteres.');
        }

        const resultado = await this.dataSource.transaction(async manager => {
            const repository = manager.getRepository(NotaCreditoClientes);

            // 1. Buscar y bloquear nota de crédito
            const nota = await repository.findOne({
                where: { slug },
                lock: { mode: 'pessimistic_write' },
            });

            if (!nota) {
                throw new NotFoundException('La nota de crédito solicitada no existe.');
            }

            // 2. Validar fecha del registro
            if (!nota.created_at || new Date(nota.created_at).getTime() <= new Date(2026, 10, 1).getTime()) {
                throw new UnprocessableEntityException('Esta nota pertenece a un período que no está habilitado para anulación.');
            }

            // 3. Evitar una doble anulación
            if (Number(nota.estado) === 3) {
                return {
                    nota,
                    nueva_anulacion: false,
                };
            }

            // 4. Validar estado actual
            if (Number(nota.estado) !== 1) {
                throw new ConflictException('La nota de crédito no se encuentra disponible para anulación.');
            }

            // 5. Validar modalidad
            if (nota.modalidad !== NotaCreditoModalidad.SALDO_FAVOR) {
                throw new UnprocessableEntityException('Las notas aplicadas directamente a cuentas requieren una operación de reversión.');
            }

            // 6. Validar origen
            if (nota.origen !== NotaCreditoOrigen.CONTABILIDAD) {
                throw new UnprocessableEntityException('La nota debe anularse desde el módulo donde fue originada.');
            }

            // 7. Validar tipo
            if (Number(nota.tipo) !== 1) {
                throw new UnprocessableEntityException('Este registro no corresponde a una nota de crédito.');
            }

            // 8. Validar vinculación con anticipos
            if (nota.anticipo_cliente_id) {
                throw new UnprocessableEntityException('La nota está vinculada a un anticipo y requiere revertir la operación original.');
            }

            // 9. Validar vinculaciones financieras
            if (
                nota.venta_id ||
                nota.recibo_id ||
                nota.recibo_id_2 ||
                nota.cc_id ||
                nota.ct_libro_diario_id
            ) {
                throw new UnprocessableEntityException('La nota tiene movimientos financieros vinculados y requiere una operación de reversión.');
            }

            // 10. Validar saldo disponible
            const monto = Math.round(Number(nota.monto) * 100);
            const saldoDisponible = Math.round(Number(nota.saldo_disponible) * 100);

            if (monto <= 0 || monto !== saldoDisponible) {
                throw new ConflictException('La nota de crédito ha sido utilizada total o parcialmente.');
            }

            // 11. Verificar aplicaciones activas
            const aplicaciones = await manager.getRepository(NotaCreditoClienteAplicaciones).count({
                where: {
                    nota_credito_cliente_id: nota.id,
                    estado: 1,
                },
            });

            if (aplicaciones > 0) {
                throw new ConflictException('La nota de crédito tiene aplicaciones activas. Debes revertirlas antes de anular.');
            }

            // 12. Registrar anulación
            const ahora = new Date();

            nota.estado = 3;
            nota.saldo_disponible = '0.00';
            nota.fecha_anulacion = ahora;
            nota.user_anulacion_id = userId;
            nota.motivo_anulacion = motivoAnulacion;
            nota.updated_at = ahora;

            const anulada = await repository.save(nota);

            return {
                nota: anulada,
                nueva_anulacion: true,
            };
        });

        // 13. Registrar evento después del commit
        if (resultado.nueva_anulacion) {
            this.logger.log(`Nota de crédito anulada: ${resultado.nota.codigo}. Usuario: ${userId}`);
        }

        // 14. Responder al frontend
        return {
            success: true,
            message: resultado.nueva_anulacion
                ? 'Nota de crédito anulada correctamente.'
                : 'La nota de crédito ya se encontraba anulada.',
            data: {
                slug: resultado.nota.slug,
                codigo: resultado.nota.codigo,
                estado: Number(resultado.nota.estado),
                estado_nombre: 'ANULADA',
                monto: Number(resultado.nota.monto),
                saldo_disponible: Number(resultado.nota.saldo_disponible),
                fecha_anulacion: resultado.nota.fecha_anulacion,
                motivo_anulacion: resultado.nota.motivo_anulacion,
                permite_anular: false,
            },
        };
    }
}
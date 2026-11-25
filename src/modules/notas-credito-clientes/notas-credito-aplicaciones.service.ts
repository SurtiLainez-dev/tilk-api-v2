import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { fechaHonduras } from '../../common/helpers/fecha.helper.js';

export interface AplicacionNotaPreparada {
    notaId: string;
    anticipoId: string | null;
    anterior: number;
    aplicado: number;
    nuevo: number;
}

@Injectable()
export class NotasCreditoAplicacionesService {

    private centavos(valor: unknown): number {
        const texto = String(valor ?? '');

        if (!/^\d+(\.\d{1,2})?$/.test(texto)) throw new BadRequestException('Importe de nota de crédito inválido.');

        const resultado = Math.round(Number(texto) * 100);

        if (!Number.isSafeInteger(resultado)) throw new BadRequestException('Importe fuera del límite permitido.');

        return resultado;
    }

    async preparar(manager: EntityManager, clienteSlug: string, slugs: string[], total: string, operacionId: string): Promise<AplicacionNotaPreparada[]> {

        if (!manager.queryRunner?.isTransactionActive) throw new ConflictException('Se requiere una transacción activa.');

        if (!slugs.length || new Set(slugs).size !== slugs.length) throw new BadRequestException('Selecciona notas de crédito válidas.');

        const formas = await manager.query('SELECT id FROM forma_pagos WHERE id = 12 LIMIT 1');

        if (!formas.length) throw new BadRequestException('La forma de pago 12 no existe.');

        const clientes = await manager.query(`
            SELECT id
            FROM clientes
            WHERE slug = ?
            LIMIT 1
            FOR UPDATE
        `, [clienteSlug]);

        if (!clientes.length) throw new BadRequestException('Cliente inválido.');

        const clienteId = String(clientes[0].id);

        const existentes = await manager.query(`
            SELECT id
            FROM nota_credito_cliente_aplicaciones
            WHERE operacion_uuid = ?
            LIMIT 1
        `, [operacionId]);

        if (existentes.length) throw new ConflictException('Esta operación ya fue aplicada.');

        const { fecha } = fechaHonduras();

        const notas = await manager.query(`
            SELECT id, slug, anticipo_cliente_id, saldo_disponible
            FROM nota_credito_clientes
            WHERE cliente_id = ?
              AND slug IN (${slugs.map(() => '?').join(',')})
              AND tipo = 1
              AND estado = 1
              AND modalidad = 'SALDO_FAVOR'
              AND uso = 'GENERAL'
              AND venta_id IS NULL
              AND saldo_disponible > 0
              AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= ?)
            ORDER BY id
            FOR UPDATE
        `, [clienteId, ...slugs, fecha]);

        if (notas.length !== slugs.length) throw new BadRequestException('Una o más notas no están disponibles para este cliente.');

        const porSlug = new Map<string, any>(
            notas.map((nota: any) => [String(nota.slug).toLowerCase(), nota])
        );

        let pendiente = this.centavos(total);

        if (pendiente <= 0) throw new BadRequestException('El total debe ser mayor que cero.');

        const aplicaciones: AplicacionNotaPreparada[] = [];

        for (const slug of slugs) {

            const nota = porSlug.get(slug.toLowerCase());

            if (!nota) throw new BadRequestException('Nota de crédito inválida.');

            const anterior = this.centavos(nota.saldo_disponible);
            const aplicado = Math.min(anterior, pendiente);

            if (aplicado === 0) continue;

            aplicaciones.push({
                notaId: String(nota.id),
                anticipoId: nota.anticipo_cliente_id == null ? null : String(nota.anticipo_cliente_id),
                anterior,
                aplicado,
                nuevo: anterior - aplicado,
            });

            pendiente -= aplicado;
        }

        if (pendiente > 0) throw new BadRequestException('El saldo disponible de las notas seleccionadas no cubre el total de la factura.');

        return aplicaciones;
    }

    async aplicar(manager: EntityManager, aplicaciones: AplicacionNotaPreparada[], ventaId: string, cajaId: string, userId: string, operacionId: string): Promise<void> {

        if (!manager.queryRunner?.isTransactionActive || !aplicaciones.length) throw new ConflictException('No hay aplicaciones válidas en la transacción.');

        const ahora = new Date();
        const { fecha_hora_mysql } = fechaHonduras(ahora);

        for (const nota of aplicaciones) {

            const anterior = (nota.anterior / 100).toFixed(2);
            const aplicado = (nota.aplicado / 100).toFixed(2);
            const nuevo = (nota.nuevo / 100).toFixed(2);
            const liquidada = nota.nuevo === 0;

            // ACTUALIZAR SALDO DE LA NOTA DE CRÉDITO

            const actualizado = await manager.query(`
                UPDATE nota_credito_clientes
                SET saldo_disponible = ?,
                    saldo_anterior = ?,
                    saldo_nuevo = ?,
                    estado = ?,
                    fecha_liquidacion = ?,
                    updated_at = ?
                WHERE id = ?
                  AND estado = 1
                  AND saldo_disponible = ?
            `, [
                nuevo,
                anterior,
                nuevo,
                liquidada ? 2 : 1,
                liquidada ? fecha_hora_mysql : null,
                ahora,
                nota.notaId,
                anterior,
            ]);

            if (actualizado.affectedRows !== 1) throw new ConflictException('El saldo de la nota de crédito cambió.');

            // REGISTRAR APLICACIÓN

            const registro = await manager.query(`
                INSERT INTO nota_credito_cliente_aplicaciones (
                    slug,
                    nota_credito_cliente_id,
                    venta_id,
                    recibo_id,
                    caja_id,
                    user_id,
                    tipo_aplicacion,
                    monto,
                    saldo_anterior,
                    saldo_nuevo,
                    operacion_uuid,
                    concepto,
                    estado,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?, ?, NULL, ?, ?,
                    'VENTA_CONTADO',
                    ?, ?, ?, ?,
                    'PAGO DE VENTA DE CONTADO',
                    1, ?, ?
                )
            `, [
                randomUUID(),
                nota.notaId,
                ventaId,
                cajaId,
                userId,
                aplicado,
                anterior,
                nuevo,
                operacionId,
                ahora,
                ahora,
            ]);

            if (!registro.insertId) throw new ConflictException('No se pudo registrar la aplicación de la nota.');

            // ANTICIPO VINCULADO
            // Únicamente se establece el estado en 1.
            // No se modifica el monto ni los demás campos.

            if (liquidada && nota.anticipoId) {
                await manager.query(`
                    UPDATE anticipo_clientes
                    SET estado = 1
                    WHERE id = ?
                      AND gestion_saldo = 'NOTA_CREDITO'
                `, [nota.anticipoId]);
            }
        }
    }
}
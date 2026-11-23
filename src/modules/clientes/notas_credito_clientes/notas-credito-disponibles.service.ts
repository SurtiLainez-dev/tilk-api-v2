
import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class NotasCreditoDisponiblesService {
    constructor(private readonly dataSource: DataSource) {}

    async consultar(clienteId: string) {
        if (!/^[1-9]\d*$/.test(String(clienteId))) throw new BadRequestException('El cliente no es válido.');

        const notas = await this.dataSource.query(`
            SELECT
                nc.slug,
                nc.codigo,
                nc.referencia,
                nc.concepto,
                nc.motivo,
                nc.monto,
                nc.saldo_disponible,
                nc.created_at AS fecha,
                nc.fecha_vencimiento,
                nc.origen,
                nc.uso,
                nc.modalidad,
                c.slug AS cliente_slug,
                TRIM(CONCAT_WS(' ', c.nombres, c.apellidos)) AS cliente_nombre
            FROM nota_credito_clientes nc
            INNER JOIN clientes c ON c.id = nc.cliente_id
            WHERE nc.cliente_id = ?
                AND nc.tipo = 1
                AND nc.estado = 1
                AND nc.modalidad = 'SALDO_FAVOR'
                AND nc.uso = 'GENERAL'
                AND nc.venta_id IS NULL
                AND nc.saldo_disponible > 0
                AND nc.slug IS NOT NULL
                AND (nc.fecha_vencimiento IS NULL OR nc.fecha_vencimiento >= CURDATE())
            ORDER BY nc.created_at ASC, nc.id ASC
        `, [clienteId]);

        const data = notas.map((nota: any) => ({
            slug: String(nota.slug),
            codigo: nota.codigo ?? null,
            referencia: nota.referencia ?? null,
            concepto: nota.concepto ?? '',
            motivo: nota.motivo ?? null,
            monto: Number(nota.monto),
            saldo_disponible: Number(nota.saldo_disponible),
            fecha: nota.fecha,
            fecha_vencimiento: nota.fecha_vencimiento,
            origen: nota.origen,
            uso: nota.uso,
            modalidad: nota.modalidad,
            cliente: {
                slug: nota.cliente_slug,
                nombre_completo: nota.cliente_nombre,
            },
        }));

        const totalDisponible = data.reduce((total: number, nota: any) => total + nota.saldo_disponible, 0);

        return {
            success: true,
            message: 'Notas de crédito disponibles consultadas correctamente.',
            data: {
                cantidad: data.length,
                total_disponible: Math.round(totalDisponible * 100) / 100,
                notas: data,
            },
        };
    }
}

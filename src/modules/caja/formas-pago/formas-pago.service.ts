
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FormasPagoService {
    constructor(private readonly db: DataSource) {}

    async listar() {
        const rows = await this.db.query(`
      SELECT
        id,
        nombre,
        is_tarjeta,
        cuenta_banco_id
      FROM forma_pagos
      WHERE
        LOWER(TRIM(nombre)) = 'efectivo'
        OR COALESCE(is_tarjeta, 0) = 1
      ORDER BY
        CASE
          WHEN LOWER(TRIM(nombre)) = 'efectivo' THEN 0
          ELSE 1
        END,
        nombre ASC
    `);

        return {
            success: true,
            data: rows.map((forma: any) => ({
                id: String(forma.id),
                nombre: forma.nombre,
                is_tarjeta: Number(forma.is_tarjeta) === 1,
                tipo:
                    Number(forma.is_tarjeta) === 1
                        ? 'TARJETA'
                        : 'EFECTIVO',
            })),
        };
    }
}

import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
    NotaCreditoClienteContadores,
} from '../../database/entities/index.js';

@Injectable()
export class NotasCreditoContadoresService {

    async siguiente(
        manager: EntityManager,
        clienteId: string,
    ): Promise<number> {

        await manager.query(
            `
            INSERT INTO nota_credito_cliente_contadores (
                cliente_id,
                contador_actual,
                created_at,
                updated_at
            )
            VALUES (?, 0, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                cliente_id = cliente_id
            `,
            [clienteId],
        );

        const repository = manager.getRepository(
            NotaCreditoClienteContadores,
        );

        const registro = await repository.findOneOrFail({
            where: {
                cliente_id: clienteId,
            },
            lock: {
                mode: 'pessimistic_write',
            },
        });

        registro.contador_actual =
            Number(registro.contador_actual) + 1;

        registro.updated_at = new Date();

        await repository.save(registro);

        return registro.contador_actual;
    }
}
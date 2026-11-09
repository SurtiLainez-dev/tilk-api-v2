
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
} from 'typeorm';

export class CreateCajaSesiones1761790000000
    implements MigrationInterface
{
    name = 'CreateCajaSesiones1761790000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const tablaExiste = await queryRunner.hasTable('caja_sesiones');

        if (!tablaExiste) {
            await queryRunner.createTable(
                new Table({
                    name: 'caja_sesiones',
                    columns: [
                        {
                            name: 'id',
                            type: 'bigint',
                            unsigned: true,
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: 'increment',
                        },
                        {
                            name: 'caja_id',
                            type: 'bigint',
                            unsigned: true,
                        },
                        {
                            name: 'user_id',
                            type: 'bigint',
                            unsigned: true,
                        },
                        {
                            name: 'token_hash',
                            type: 'varchar',
                            length: '64',
                            isUnique: true,
                        },
                        {
                            name: 'expires_at',
                            type: 'datetime',
                        },
                        {
                            name: 'last_activity_at',
                            type: 'datetime',
                        },
                        {
                            name: 'revoked_at',
                            type: 'datetime',
                            isNullable: true,
                        },
                        {
                            name: 'revoked_by',
                            type: 'bigint',
                            unsigned: true,
                            isNullable: true,
                        },
                        {
                            name: 'revocation_reason',
                            type: 'varchar',
                            length: '100',
                            isNullable: true,
                        },
                        {
                            name: 'created_at',
                            type: 'datetime',
                            default: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );
        }

        const tabla = await queryRunner.getTable('caja_sesiones');

        if (!tabla) {
            throw new Error('No se pudo verificar la tabla caja_sesiones.');
        }

        const indices = [
            {
                name: 'IDX_caja_sesiones_caja',
                columnNames: ['caja_id', 'revoked_at'],
            },
            {
                name: 'IDX_caja_sesiones_usuario',
                columnNames: ['user_id'],
            },
            {
                name: 'IDX_caja_sesiones_expiracion',
                columnNames: ['expires_at'],
            },
        ];

        for (const indice of indices) {
            const existe = tabla.indices.some(
                (item) => item.name === indice.name,
            );

            if (!existe) {
                await queryRunner.createIndex(
                    'caja_sesiones',
                    new TableIndex(indice),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Evitamos eliminar automáticamente una tabla de sesiones
        // que podría contener información activa.
        throw new Error(
            'La reversión de caja_sesiones requiere revisión manual.',
        );
    }
}

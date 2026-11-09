
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
} from 'typeorm';

export class CreateCajaOperacionesPago1762040001000
    implements MigrationInterface
{
    name = 'CreateCajaOperacionesPago1762040001000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const nombre = 'caja_operaciones_pago';

        if (!(await queryRunner.hasTable(nombre))) {
            await queryRunner.createTable(
                new Table({
                    name: nombre,
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
                            name: 'operacion_uuid',
                            type: 'varchar',
                            length: '36',
                            isUnique: true,
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
                            name: 'venta_id',
                            type: 'bigint',
                            unsigned: true,
                        },
                        {
                            name: 'monto',
                            type: 'decimal',
                            precision: 15,
                            scale: 2,
                        },
                        {
                            name: 'estado',
                            type: 'varchar',
                            length: '30',
                            default: "'PENDIENTE'",
                        },
                        {
                            name: 'respuesta',
                            type: 'longtext',
                            isNullable: true,
                        },
                        {
                            name: 'error',
                            type: 'text',
                            isNullable: true,
                        },
                        {
                            name: 'created_at',
                            type: 'datetime',
                            default: 'CURRENT_TIMESTAMP',
                        },
                        {
                            name: 'updated_at',
                            type: 'datetime',
                            default: 'CURRENT_TIMESTAMP',
                            onUpdate: 'CURRENT_TIMESTAMP',
                        },
                    ],
                }),
                true,
            );
        }

        const tabla = await queryRunner.getTable(nombre);

        if (!tabla) {
            throw new Error(
                `No se pudo verificar ${nombre}.`,
            );
        }

        const indices = [
            {
                name: 'IDX_caja_pago_venta',
                columnNames: ['venta_id'],
            },
            {
                name: 'IDX_caja_pago_caja',
                columnNames: ['caja_id', 'created_at'],
            },
            {
                name: 'IDX_caja_pago_usuario',
                columnNames: ['user_id'],
            },
            {
                name: 'IDX_caja_pago_estado',
                columnNames: ['estado'],
            },
        ];

        for (const indice of indices) {
            const existe = tabla.indices.some(
                (i) => i.name === indice.name,
            );

            if (!existe) {
                await queryRunner.createIndex(
                    nombre,
                    new TableIndex(indice),
                );
            }
        }

        const tieneUnico =
            tabla.uniques.some(
                (u) =>
                    u.columnNames.length === 1 &&
                    u.columnNames.includes('operacion_uuid'),
            ) ||
            tabla.indices.some(
                (i) =>
                    i.isUnique &&
                    i.columnNames.length === 1 &&
                    i.columnNames.includes('operacion_uuid'),
            );

        if (!tieneUnico) {
            await queryRunner.createIndex(
                nombre,
                new TableIndex({
                    name: 'UQ_caja_pago_operacion_uuid',
                    columnNames: ['operacion_uuid'],
                    isUnique: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error(
            'La reversión de caja_operaciones_pago requiere revisión manual.',
        );
    }
}


import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableColumn,
    TableIndex,
} from 'typeorm';

export class CreateCajaSesionesDispositivos1762040000000
    implements MigrationInterface
{
    name = 'CreateCajaSesionesDispositivos1762040000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const nombre = 'caja_sesiones_dispositivos';

        const columnas: TableColumn[] = [
            new TableColumn({
                name: 'id',
                type: 'bigint',
                unsigned: true,
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
            }),
            new TableColumn({
                name: 'sesion_uuid',
                type: 'varchar',
                length: '36',
                isUnique: true,
            }),
            new TableColumn({
                name: 'token_hash',
                type: 'varchar',
                length: '64',
                isNullable: true,
                isUnique: true,
            }),
            new TableColumn({
                name: 'user_id',
                type: 'bigint',
                unsigned: true,
            }),
            new TableColumn({
                name: 'caja_id',
                type: 'bigint',
                unsigned: true,
            }),
            new TableColumn({
                name: 'sucursal_id',
                type: 'bigint',
                unsigned: true,
            }),
            new TableColumn({
                name: 'ip_address',
                type: 'varchar',
                length: '45',
                isNullable: true,
            }),
            new TableColumn({
                name: 'user_agent',
                type: 'varchar',
                length: '2048',
                isNullable: true,
            }),
            new TableColumn({
                name: 'navegador',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'navegador_version',
                type: 'varchar',
                length: '50',
                isNullable: true,
            }),
            new TableColumn({
                name: 'sistema_operativo',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'sistema_version',
                type: 'varchar',
                length: '50',
                isNullable: true,
            }),
            new TableColumn({
                name: 'tipo_dispositivo',
                type: 'varchar',
                length: '30',
                isNullable: true,
            }),
            new TableColumn({
                name: 'dispositivo',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'origen',
                type: 'varchar',
                length: '30',
                default: "'CAJA'",
            }),
            new TableColumn({
                name: 'fecha_inicio',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'fecha_expiracion',
                type: 'datetime',
            }),
            new TableColumn({
                name: 'fecha_ultimo_uso',
                type: 'datetime',
                isNullable: true,
            }),
            new TableColumn({
                name: 'fecha_cierre',
                type: 'datetime',
                isNullable: true,
            }),
            new TableColumn({
                name: 'motivo_cierre',
                type: 'varchar',
                length: '100',
                isNullable: true,
            }),
            new TableColumn({
                name: 'created_at',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
            }),
            new TableColumn({
                name: 'updated_at',
                type: 'datetime',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
            }),
        ];

        if (!(await queryRunner.hasTable(nombre))) {
            await queryRunner.createTable(
                new Table({
                    name: nombre,
                    columns: columnas,
                }),
                true,
            );
        } else {
            for (const columna of columnas) {
                if (!(await queryRunner.hasColumn(nombre, columna.name))) {
                    if (columna.name === 'id') {
                        throw new Error(
                            `${nombre} existe sin su columna primaria id. Requiere revisión manual.`,
                        );
                    }

                    await queryRunner.addColumn(nombre, columna);
                }
            }
        }

        const indices = [
            {
                name: 'IDX_caja_disp_usuario',
                columnNames: ['user_id', 'fecha_inicio'],
            },
            {
                name: 'IDX_caja_disp_caja',
                columnNames: ['caja_id', 'fecha_inicio'],
            },
            {
                name: 'IDX_caja_disp_sucursal',
                columnNames: ['sucursal_id'],
            },
            {
                name: 'IDX_caja_disp_expiracion',
                columnNames: ['fecha_expiracion'],
            },
        ];

        for (const indice of indices) {
            const tabla = await queryRunner.getTable(nombre);

            if (!tabla) {
                throw new Error(`No se pudo verificar ${nombre}.`);
            }

            if (!tabla.indices.some((i) => i.name === indice.name)) {
                await queryRunner.createIndex(
                    nombre,
                    new TableIndex(indice),
                );
            }
        }

        for (const columna of ['sesion_uuid', 'token_hash']) {
            const tabla = await queryRunner.getTable(nombre);

            if (!tabla) {
                throw new Error(`No se pudo verificar ${nombre}.`);
            }

            const tieneUnico =
                tabla.uniques.some(
                    (u) =>
                        u.columnNames.length === 1 &&
                        u.columnNames.includes(columna),
                ) ||
                tabla.indices.some(
                    (i) =>
                        i.isUnique &&
                        i.columnNames.length === 1 &&
                        i.columnNames.includes(columna),
                );

            if (!tieneUnico) {
                await queryRunner.createIndex(
                    nombre,
                    new TableIndex({
                        name: `UQ_caja_disp_${columna}`,
                        columnNames: [columna],
                        isUnique: true,
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error(
            'La reversión de caja_sesiones_dispositivos requiere revisión manual.',
        );
    }
}

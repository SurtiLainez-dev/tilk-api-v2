
import 'reflect-metadata';

import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as Entities from './entities/index.js';

interface ColumnaMysql {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    DATA_TYPE: string;
    COLUMN_TYPE: string;
    IS_NULLABLE: string;
    COLUMN_KEY: string;
    EXTRA: string;
}

function obtenerTipoEntity(tipo: unknown): string {
    if (tipo === Number) return 'number';
    if (tipo === String) return 'string';
    if (tipo === Boolean) return 'boolean';
    if (tipo === Date) return 'date';
    if (tipo === Buffer) return 'buffer';

    return String(tipo).toLowerCase();
}

function compararTipos(
    tipoEntity: string,
    tipoMysql: string,
): 'correcto' | 'advertencia' | 'diferente' {
    const equivalencias: Record<string, string[]> = {
        integer: ['int'],
        int: ['int'],
        varchar: ['varchar'],
        char: ['char'],
        text: ['text'],
        tinytext: ['tinytext'],
        mediumtext: ['mediumtext'],
        longtext: ['longtext'],
        datetime: ['datetime'],
        timestamp: ['timestamp'],
        date: ['date'],
        time: ['time'],
        boolean: ['tinyint', 'bit'],
        bool: ['tinyint', 'bit'],
        bigint: ['bigint'],
        smallint: ['smallint'],
        mediumint: ['mediumint'],
        tinyint: ['tinyint'],
        decimal: ['decimal', 'numeric'],
        numeric: ['decimal', 'numeric'],
        double: ['double'],
        float: ['float'],
        json: ['json'],
        blob: ['blob'],
        tinyblob: ['tinyblob'],
        mediumblob: ['mediumblob'],
        longblob: ['longblob'],
        binary: ['binary'],
        varbinary: ['varbinary'],
        enum: ['enum'],
        set: ['set'],
        year: ['year'],
        bit: ['bit'],
    };

    if (
        equivalencias[tipoEntity]?.includes(tipoMysql) ||
        tipoEntity === tipoMysql
    ) {
        return 'correcto';
    }

    if (tipoEntity === 'number') {
        const numericos = [
            'tinyint',
            'smallint',
            'mediumint',
            'int',
            'bigint',
            'decimal',
            'numeric',
            'float',
            'double',
        ];

        if (numericos.includes(tipoMysql)) {
            return 'advertencia';
        }
    }

    if (tipoEntity === 'string') {
        const textos = [
            'char',
            'varchar',
            'text',
            'tinytext',
            'mediumtext',
            'longtext',
            'enum',
            'set',
        ];

        if (textos.includes(tipoMysql)) {
            return 'advertencia';
        }
    }

    if (
        tipoEntity === 'date' &&
        ['date', 'datetime', 'timestamp'].includes(tipoMysql)
    ) {
        return 'advertencia';
    }

    if (
        tipoEntity === 'buffer' &&
        ['binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob'].includes(tipoMysql)
    ) {
        return 'advertencia';
    }

    return 'diferente';
}

async function verificarEntidades(): Promise<void> {
    // Cargar las variables de entorno.
    // No es necesario iniciar toda la aplicación NestJS.
    const configModule = ConfigModule.forRoot({
        envFilePath: '.env',
    });

    await configModule;

    const config = new ConfigService();
    const useSsl = config.get<string>('DB_SSL') === 'true';

    // Obtener solamente clases decoradas con @Entity().
    const targets = new Set(
        getMetadataArgsStorage().tables.map(table => table.target),
    );

    const entities = Object.values(Entities).filter(
        (value): value is new (...args: any[]) => any =>
            typeof value === 'function' && targets.has(value),
    );

    const dataSource = new DataSource({
        type: 'mysql',

        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.get('DB_PORT', 3306)),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_DATABASE'),

        charset: 'utf8mb4',
        timezone: 'Z',

        ssl: useSsl
            ? {
                ca: readFileSync(
                    resolve(process.cwd(), 'certs/ca-certificate.crt'),
                    'utf8',
                ),
                rejectUnauthorized: true,
            }
            : undefined,

        entities,

        // Nunca modificar producción desde el verificador.
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: false,
    });

    try {
        await dataSource.initialize();

        const database = config.getOrThrow<string>('DB_DATABASE');

        // Consulta de solo lectura.
        const columnas = await dataSource.query(
            `
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION
      `,
            [database],
        ) as ColumnaMysql[];

        const tablas = new Map<string, Map<string, ColumnaMysql>>();

        for (const columna of columnas) {
            if (!tablas.has(columna.TABLE_NAME)) {
                tablas.set(columna.TABLE_NAME, new Map());
            }

            tablas.get(columna.TABLE_NAME)!.set(
                columna.COLUMN_NAME,
                columna,
            );
        }

        let tablasCorrectas = 0;
        let tablasFaltantes = 0;
        let columnasCorrectas = 0;
        let columnasFaltantes = 0;
        let tiposCorrectos = 0;
        let diferenciasTipos = 0;
        let advertenciasTipos = 0;
        let diferenciasNullable = 0;
        let diferenciasUnsigned = 0;
        let diferenciasPrimary = 0;

        const errores: string[] = [];
        const advertencias: string[] = [];

        for (const entity of dataSource.entityMetadatas) {
            const tabla = entity.tableName;
            const columnasMysql = tablas.get(tabla);

            if (!columnasMysql) {
                tablasFaltantes++;
                errores.push(`[TABLA NO EXISTE] ${tabla}`);
                continue;
            }

            tablasCorrectas++;

            for (const columna of entity.columns) {
                const nombre = columna.databaseName;
                const columnaMysql = columnasMysql.get(nombre);

                if (!columnaMysql) {
                    columnasFaltantes++;

                    errores.push(
                        `[COLUMNA NO EXISTE] ${tabla}.${nombre}`,
                    );

                    continue;
                }

                columnasCorrectas++;

                // 1. Comparación de tipos.
                const tipoEntity = obtenerTipoEntity(columna.type);
                const tipoMysql = columnaMysql.DATA_TYPE.toLowerCase();

                const resultadoTipo = compararTipos(
                    tipoEntity,
                    tipoMysql,
                );

                if (resultadoTipo === 'correcto') {
                    tiposCorrectos++;
                } else if (resultadoTipo === 'advertencia') {
                    advertenciasTipos++;

                    advertencias.push(
                        `[TIPO INFERIDO] ${tabla}.${nombre} ` +
                        `Entity=${tipoEntity}, MySQL=${tipoMysql}`,
                    );
                } else {
                    diferenciasTipos++;

                    errores.push(
                        `[TIPO DIFERENTE] ${tabla}.${nombre} ` +
                        `Entity=${tipoEntity}, MySQL=${tipoMysql}`,
                    );
                }

                // 2. Comparación de nullable.
                const nullableMysql =
                    columnaMysql.IS_NULLABLE.toUpperCase() === 'YES';

                const nullableEntity = columna.isNullable;

                if (nullableMysql !== nullableEntity) {
                    diferenciasNullable++;

                    errores.push(
                        `[NULLABLE DIFERENTE] ${tabla}.${nombre} ` +
                        `Entity=${nullableEntity}, MySQL=${nullableMysql}`,
                    );
                }

                // 3. Comparación de unsigned.
                // Solo aplica a tipos enteros y decimales.
                const tiposNumericos = [
                    'tinyint',
                    'smallint',
                    'mediumint',
                    'int',
                    'bigint',
                    'decimal',
                    'numeric',
                    'float',
                    'double',
                ];

                if (tiposNumericos.includes(tipoMysql)) {
                    const unsignedMysql =
                        columnaMysql.COLUMN_TYPE.toLowerCase().includes('unsigned');

                    const unsignedEntity = columna.unsigned === true;

                    if (unsignedMysql !== unsignedEntity) {
                        diferenciasUnsigned++;

                        errores.push(
                            `[UNSIGNED DIFERENTE] ${tabla}.${nombre} ` +
                            `Entity=${unsignedEntity}, MySQL=${unsignedMysql}`,
                        );
                    }
                }

                // 4. Comparación de clave primaria.
                const primaryMysql =
                    columnaMysql.COLUMN_KEY.toUpperCase() === 'PRI';

                const primaryEntity = columna.isPrimary;

                if (primaryMysql !== primaryEntity) {
                    diferenciasPrimary++;

                    errores.push(
                        `[PRIMARY KEY DIFERENTE] ${tabla}.${nombre} ` +
                        `Entity=${primaryEntity}, MySQL=${primaryMysql}`,
                    );
                }
            }
        }

        console.log('');
        console.log('================================================');
        console.log('       TILK API V2 - VERIFICACION MYSQL');
        console.log('================================================');
        console.log(`Conexion MySQL: ${dataSource.isInitialized ? 'OK' : 'ERROR'}`);
        console.log(`Entidades cargadas: ${dataSource.entityMetadatas.length}`);
        console.log(`Tablas encontradas: ${tablasCorrectas}`);
        console.log(`Tablas faltantes: ${tablasFaltantes}`);
        console.log(`Columnas encontradas: ${columnasCorrectas}`);
        console.log(`Columnas faltantes: ${columnasFaltantes}`);
        console.log(`Tipos correctos: ${tiposCorrectos}`);
        console.log(`Tipos inferidos (advertencias): ${advertenciasTipos}`);
        console.log(`Tipos diferentes: ${diferenciasTipos}`);
        console.log(`Nullable diferentes: ${diferenciasNullable}`);
        console.log(`Unsigned diferentes: ${diferenciasUnsigned}`);
        console.log(`Primary Key diferentes: ${diferenciasPrimary}`);
        console.log('================================================');

        if (errores.length > 0) {
            console.log('\nERRORES ENCONTRADOS:\n');

            for (const error of errores) {
                console.log(error);
            }
        }

        if (advertencias.length > 0) {
            console.log('\nADVERTENCIAS DE TIPOS INFERIDOS:\n');

            for (const advertencia of advertencias) {
                console.log(advertencia);
            }
        }

        if (errores.length === 0 && advertencias.length === 0) {
            console.log('\nTodas las columnas verificadas coinciden.');
        }

        console.log('\nVerificacion finalizada. No se modifico MySQL.');

        if (errores.length > 0) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error('Error verificando entidades:', error);
        process.exitCode = 1;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

void verificarEntidades();

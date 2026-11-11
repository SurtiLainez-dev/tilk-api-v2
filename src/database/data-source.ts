
import 'reflect-metadata';
import 'dotenv/config';

import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as Entities from './entities/index.js';

const entityTargets = new Set(
    getMetadataArgsStorage().tables.map(table => table.target),
);

const registeredEntities = Object.values(Entities).filter(
    (value): value is new (...args: any[]) => any =>
        typeof value === 'function' && entityTargets.has(value),
);

const useSsl = process.env.DB_SSL === 'true';

export default new DataSource({
    type: 'mysql',

    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

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

    entities: registeredEntities,

    migrations: [
        process.env.NODE_ENV === 'production'
            ? 'dist/database/migrations/*.js'
            : 'src/database/migrations/*.ts',
    ],

    migrationsTableName: 'nest_migrations',

    synchronize: false,
    migrationsRun: false,
    dropSchema: false,

    logging: false,
});


import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as Entities from './entities/index.js';

// Identificar únicamente las clases decoradas con @Entity()
const entityTargets = new Set(
    getMetadataArgsStorage().tables.map((table) => table.target),
);

// Registrar las entidades exportadas por index.ts
const registeredEntities = Object.values(Entities).filter(
    (value): value is new (...args: any[]) => any =>
        typeof value === 'function' && entityTargets.has(value),
);

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (config: ConfigService) => {
                const useSsl = config.get<string>('DB_SSL') === 'true';

                return {
                    type: 'mysql' as const,

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

                    entities: registeredEntities,
                    autoLoadEntities: true,

                    // IMPORTANTE: no modificar la BD de producción
                    synchronize: false,
                    migrationsRun: false,
                    dropSchema: false,
                    logging: false,
                };
            },
        }),
    ],
})
export class DatabaseModule implements OnModuleInit {
    constructor(private readonly dataSource: DataSource) {}

    onModuleInit() {
        const metadata = this.dataSource.entityMetadatas;

        console.log('');
        console.log('==========================================');
        console.log('       TILK API V2 - DATABASE');
        console.log('==========================================');
        console.log(`Conexion MySQL: ${this.dataSource.isInitialized ? 'OK' : 'ERROR'}`);
        console.log(`Entidades exportadas y registradas: ${registeredEntities.length}`);
        console.log(`Entidades cargadas por TypeORM: ${metadata.length}`);
        console.log(`Tablas distintas: ${new Set(metadata.map(e => e.tableName)).size}`);
        console.log('==========================================');
        console.log('');
    }
}

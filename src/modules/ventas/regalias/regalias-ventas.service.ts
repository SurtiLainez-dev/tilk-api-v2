
import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager } from 'typeorm';
import { RegaliasVentasEntity } from '../../../database/entities/index.js';

export type CrearRegaliaVentaDto = Partial<
    Omit<RegaliasVentasEntity, 'id' | 'created_at' | 'updated_at'>
    >;

@Injectable()
export class RegaliasVentasService {
    constructor(private readonly dataSource: DataSource) {}

    async crearRegalia(
        dto: CrearRegaliaVentaDto,
        manager?: EntityManager,
    ): Promise<RegaliasVentasEntity> {
        if (!dto || typeof dto !== 'object' || Array.isArray(dto) || !Object.keys(dto).length) {
            throw new BadRequestException('Debes proporcionar los datos de la regalía.');
        }

        const ejecutar = async (db: EntityManager): Promise<RegaliasVentasEntity> => {
            const repository = db.getRepository(RegaliasVentasEntity);
            const permitidas = new Set(
                repository.metadata.columns
                    .filter(columna => !columna.isPrimary && !columna.isGenerated && !['created_at', 'updated_at'].includes(columna.propertyName))
                    .map(columna => columna.propertyName),
            );

            const datos: Record<string, unknown> = {};

            for (const [campo, valor] of Object.entries(dto)) {
                if (!permitidas.has(campo)) {
                    throw new BadRequestException(`El campo ${campo} no está permitido en la regalía.`);
                }

                if (valor !== undefined) datos[campo] = valor;
            }

            if (!Object.keys(datos).length) {
                throw new BadRequestException('No se proporcionaron campos válidos para registrar la regalía.');
            }

            const regalia = repository.create(datos as DeepPartial<RegaliasVentasEntity>);
            return repository.save(regalia);
        };

        return manager ? ejecutar(manager) : this.dataSource.transaction(ejecutar);
    }
}

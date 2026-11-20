import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
    TipoNotaCreditosEntity,
} from '../../database/entities/index.js';

@Injectable()
export class NotasCreditoClientesService {

    private readonly logger = new Logger(
        NotasCreditoClientesService.name,
    );

    constructor(

        @InjectRepository(TipoNotaCreditosEntity)
        private readonly tiposNotaCreditoRepository:
            Repository<TipoNotaCreditosEntity>,

    ) {}

    // ==========================================
    // OBTENER TIPOS DE NOTAS DE CRÉDITO
    // ==========================================

    async obtenerTipos() {

        try {

            const tipos =
                await this.tiposNotaCreditoRepository.find({

                    select: {
                        id: true,
                        nombre: true,
                    },

                    order: {
                        nombre: 'ASC',
                    },

                });

            return {

                success: true,

                total: tipos.length,

                data: tipos.map(tipo => ({

                    codigo: String(tipo.id),

                    nombre: tipo.nombre,

                })),

            };

        } catch (error) {

            this.logger.error(

                'Error al consultar los tipos de notas de crédito',

                error instanceof Error
                    ? error.stack
                    : String(error),

            );

            throw new InternalServerErrorException(

                'No se pudieron cargar los tipos de notas de crédito.',

            );

        }

    }

}
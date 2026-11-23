
    import {
        BadRequestException,
        Injectable,
        NotFoundException,
    } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { EntityManager, Repository } from 'typeorm';

    import { CobPortafolios } from '../../../database/entities/index.js';

    @Injectable()
    export class CobPortafoliosService {
        constructor(
            @InjectRepository(CobPortafolios)
            private readonly portafoliosRepository: Repository<CobPortafolios>,
        ) {}

        async obtenerPortafolio(
            sucursalId: string | number,
            userId?: string | number | null,
            manager?: EntityManager,
        ): Promise<CobPortafolios> {
            const sucursal = String(sucursalId ?? '').trim();
            const usuario = userId === null || userId === undefined ? null : String(userId).trim();

            if (!/^[1-9]\d*$/.test(sucursal)) {
                throw new BadRequestException('Debes proporcionar una sucursal válida.');
            }

            if (usuario !== null && !/^[1-9]\d*$/.test(usuario)) {
                throw new BadRequestException('El usuario proporcionado no es válido.');
            }

            const repository = manager
                ? manager.getRepository(CobPortafolios)
                : this.portafoliosRepository;

            if (usuario !== null) {
                const portafolioUsuario = await repository.findOne({
                    where: {
                        sucursal_id: sucursal,
                        user_id: usuario,
                    },
                    order: { id: 'ASC' },
                });

                if (portafolioUsuario) return portafolioUsuario;
            }

            const portafolioGerencial = await repository.findOne({
                where: {
                    sucursal_id: sucursal,
                    gerencial: 1,
                },
                order: { id: 'ASC' },
            });

            if (!portafolioGerencial) {
                throw new NotFoundException(
                    'No existe un portafolio gerencial configurado para esta sucursal.',
                );
            }

            return portafolioGerencial;
        }

        async obtenerPortafolioId(
            sucursalId: string | number,
            userId?: string | number | null,
            manager?: EntityManager,
        ): Promise<string> {
            const portafolio = await this.obtenerPortafolio(sucursalId, userId, manager);
            return String(portafolio.id);
        }
    }

import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cajas} from "../../database/entities/index.js";
import { Users} from "../../database/entities/index.js";
import { Colaboradors} from "../../database/entities/index.js";
import { Sucursals} from "../../database/entities/index.js";

@Injectable()
export class CajaService {
    constructor(
        @InjectRepository(Cajas)
        private readonly cajasRepository: Repository<Cajas>,

        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>,

        @InjectRepository(Colaboradors)
        private readonly colaboradoresRepository: Repository<Colaboradors>,
    ) {}



    async listarCajas(userId: string) {
        // 1. Obtener el usuario autenticado
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // 2. Obtener el colaborador asociado
        const colaboradorId = user.colaborador_id;

        if (!colaboradorId) {
            throw new NotFoundException(
                'El usuario no tiene un colaborador asociado',
            );
        }

        const colaborador = await this.colaboradoresRepository.findOne({
            where: { id: String(colaboradorId) },
        });

        if (!colaborador) {
            throw new NotFoundException('Colaborador no encontrado');
        }

        // 3. Obtener la sucursal del colaborador
        const sucursalId = colaborador.sucursal_id;

        if (!sucursalId) {
            throw new NotFoundException(
                'El colaborador no tiene una sucursal asignada',
            );
        }

        // 4. Consultar cajas y sus responsables
        const cajas = await this.cajasRepository
            .createQueryBuilder('caja')
            .leftJoin(
                Users,
                'usuario',
                'usuario.id = caja.user_id',
            )
            .leftJoin(
                Colaboradors,
                'responsable_colaborador',
                'responsable_colaborador.id = usuario.colaborador_id',
            )
            .select([
                'caja.id AS id',
                'caja.slug AS slug',
                'caja.sucursal_id AS sucursal_id',
                'caja.codigo AS codigo',
                'caja.num_caja AS num_caja',
                'caja.estado_cierre AS estado_cierre',
                'caja.activa AS activa',
                'caja.estado AS estado',
                'usuario.usuario AS usuario',
            ])
            .addSelect(
                `TRIM(CONCAT_WS(' ',
          responsable_colaborador.nombres,
          responsable_colaborador.apellidos
        ))`,
                'responsable',
            )
            .where('caja.sucursal_id = :sucursalId', {
                sucursalId: String(sucursalId),
            })
            .orderBy('caja.num_caja', 'ASC')
            .getRawMany();

        return {
            success: true,
            message: 'Cajas obtenidas correctamente',
            data: cajas,
        };
    }

    async listarCajasGenerales() {
        const cajas = await this.cajasRepository
            .createQueryBuilder('caja')
            .leftJoin(
                Users,
                'usuario',
                'usuario.id = caja.user_id',
            )
            .leftJoin(
                Colaboradors,
                'colaborador',
                'colaborador.id = usuario.colaborador_id',
            )
            .leftJoin(
                Sucursals,
                'sucursal',
                'sucursal.id = caja.sucursal_id',
            )
            .select([
                'caja.id AS id',
                'caja.slug AS slug',
                'caja.codigo AS codigo',
                'caja.num_caja AS num_caja',
                'caja.sucursal_id AS sucursal_id',
                'caja.user_id AS user_id',
                'caja.activa AS activa',
                'caja.estado AS estado',
                'caja.estado_cierre AS estado_cierre',
                'usuario.usuario AS usuario',
                'colaborador.id AS colaborador_id',
                'sucursal.nombre as sucursal'
            ])
            .addSelect(
                `TRIM(CONCAT_WS(' ',
        colaborador.nombres,
        colaborador.apellidos
      ))`,
                'responsable',
            )
            .orderBy('caja.num_caja', 'ASC')
            .addOrderBy('caja.id', 'ASC')
            .getRawMany()

        return {
            success: true,
            message: 'Cajas generales obtenidas correctamente',
            data: cajas,
        }
    }

    async obtenerCajaGeneralPorSlug(slug: string) {
        const caja = await this.cajasRepository
            .createQueryBuilder('caja')
            .leftJoin(
                Users,
                'usuario',
                'usuario.id = caja.user_id',
            )
            .leftJoin(
                Colaboradors,
                'colaborador',
                'colaborador.id = usuario.colaborador_id',
            )
            .leftJoin(
                Sucursals,
                'sucursal',
                'sucursal.id = caja.sucursal_id',
            )
            .select([
                'caja.id AS id',
                'caja.slug AS slug',
                'caja.codigo AS codigo',
                'caja.num_caja AS num_caja',
                'caja.sucursal_id AS sucursal_id',
                'caja.user_id AS user_id',
                'caja.activa AS activa',
                'caja.estado AS estado',
                'caja.estado_cierre AS estado_cierre',
                'usuario.id AS usuario_id',
                'usuario.usuario AS usuario',
                'colaborador.id AS colaborador_id',
                'colaborador.nombres AS colaborador_nombres',
                'colaborador.apellidos AS colaborador_apellidos',
                'colaborador.sucursal_id AS colaborador_sucursal_id',
                'sucursal.nombre as sucursal'
            ])
            .addSelect(
                `TRIM(CONCAT_WS(' ',
        colaborador.nombres,
        colaborador.apellidos
      ))`,
                'responsable',
            )
            .where('caja.slug = :slug', { slug })
            .getRawOne()

        if (!caja) {
            throw new NotFoundException(
                'No se encontró la caja solicitada',
            )
        }

        return {
            success: true,
            message: 'Caja general obtenida correctamente',
            data: caja,
        }
    }
}
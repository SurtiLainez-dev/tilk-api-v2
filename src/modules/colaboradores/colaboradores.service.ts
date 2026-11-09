
import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    Colaboradors,
    Users,
    Sucursals,
} from '../../database/entities/index.js';

export interface ColaboradorDisponible {
    // Identificador interno. No mostrar en pantalla.
    user_id: string | null;
    codigo: string | null;
    nombre: string;
    nombres: string;
    apellidos: string;
    usuario: string | null;
    email: string | null;
    sucursal: string;
}

@Injectable()
export class ColaboradoresService {
    constructor(
        @InjectRepository(Colaboradors)
        private readonly colaboradoresRepository:
            Repository<Colaboradors>,

        @InjectRepository(Users)
        private readonly usuariosRepository:
            Repository<Users>,

        @InjectRepository(Sucursals)
        private readonly sucursalesRepository:
            Repository<Sucursals>,
    ) {}

    // ==========================================
    // OBTENER SUCURSAL POR CÓDIGO
    // ==========================================
    private async obtenerSucursal(
        codigoSucursal: string,
    ): Promise<Sucursals> {
        const codigo = codigoSucursal?.trim();

        if (!codigo) {
            throw new BadRequestException(
                'Debes proporcionar el código de la sucursal.',
            );
        }

        const sucursal = await this.sucursalesRepository
            .createQueryBuilder('s')
            .where('s.abreviatura = :codigo', { codigo })
            .getOne();

        if (!sucursal) {
            throw new NotFoundException(
                'No se encontró la sucursal solicitada.',
            );
        }

        return sucursal;
    }

    // ==========================================
    // LISTAR COLABORADORES ACTIVOS POR SUCURSAL
    // ==========================================
    async listarActivosPorSucursal(
        codigoSucursal: string,
        soloConUsuarioActivo = true,
    ): Promise<{
        success: boolean;
        sucursal: string;
        total: number;
        data: ColaboradorDisponible[];
    }> {
        const sucursal =
            await this.obtenerSucursal(codigoSucursal);

        const consulta = this.colaboradoresRepository
            .createQueryBuilder('c')
            .leftJoin(
                Users,
                'u',
                'u.colaborador_id = c.id AND u.estado = :estadoUsuario',
                { estadoUsuario: 1 },
            )
            .select([
                'c.codigo AS codigo',
                'c.nombres AS nombres',
                'c.apellidos AS apellidos',
                'u.id AS user_id',
                'u.usuario AS usuario',
                'u.email AS email',
            ])
            .where('c.sucursal_id = :sucursalId', {
                sucursalId: sucursal.id,
            })
            .andWhere('c.estado = :estadoColaborador', {
                estadoColaborador: 1,
            })
            .orderBy('c.nombres', 'ASC')
            .addOrderBy('c.apellidos', 'ASC');

        // Si es true, solamente colaboradores
        // que tengan un usuario activo.
        if (soloConUsuarioActivo) {
            consulta.andWhere('u.id IS NOT NULL');
        }

        const registros = await consulta.getRawMany<{
            codigo: string | null;
            nombres: string;
            apellidos: string;
            user_id: string | null;
            usuario: string | null;
            email: string | null;
        }>();

        const data: ColaboradorDisponible[] =
            registros.map((registro) => ({
                user_id: registro.user_id !== null
                    ? String(registro.user_id)
                    : null,

                codigo: registro.codigo,

                nombre: [
                    registro.nombres,
                    registro.apellidos,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .trim(),

                nombres: registro.nombres,
                apellidos: registro.apellidos,
                usuario: registro.usuario,
                email: registro.email,
                sucursal: sucursal.nombre,
            }));

        return {
            success: true,
            sucursal: sucursal.nombre,
            total: data.length,
            data,
        };
    }

    // ==========================================
    // LISTAR COLABORADORES CON USUARIO ACTIVO
    // ==========================================
    async listarConUsuarioActivo(
        codigoSucursal: string,
    ) {
        return this.listarActivosPorSucursal(
            codigoSucursal,
            true,
        );
    }

    // ==========================================
    // VALIDAR USUARIO ACTIVO DE UNA SUCURSAL
    // ==========================================
    async validarUsuarioActivoDeSucursal(
        userId: string,
        sucursalId: string,
    ): Promise<boolean> {
        if (!userId || !sucursalId) {
            return false;
        }

        const cantidad = await this.usuariosRepository
            .createQueryBuilder('u')
            .innerJoin(
                Colaboradors,
                'c',
                'c.id = u.colaborador_id',
            )
            .where('u.id = :userId', { userId })
            .andWhere('u.estado = 1')
            .andWhere('c.estado = 1')
            .andWhere('c.sucursal_id = :sucursalId', {
                sucursalId,
            })
            .getCount();

        return cantidad > 0;
    }

    async listarConUsuarioActivoPorSucursalId(
        sucursalId: string,
    ) {
        const sucursal = await this.sucursalesRepository.findOne({
            where: { id: sucursalId },
        });

        if (!sucursal) {
            throw new NotFoundException('Sucursal no encontrada.');
        }

        const registros = await this.colaboradoresRepository
            .createQueryBuilder('c')
            .innerJoin(
                Users,
                'u',
                'u.colaborador_id = c.id AND u.estado = :estadoUsuario',
                { estadoUsuario: 1 },
            )
            .select([
                'u.id AS user_id',
                'u.usuario AS usuario',
                'u.email AS email',
                'c.codigo AS codigo',
                'c.nombres AS nombres',
                'c.apellidos AS apellidos',
            ])
            .where('c.sucursal_id = :sucursalId', { sucursalId })
            .andWhere('c.estado = 1')
            .orderBy('c.nombres', 'ASC')
            .addOrderBy('c.apellidos', 'ASC')
            .getRawMany();

        return {
            success: true,
            sucursal: sucursal.nombre,
            total: registros.length,
            data: registros.map((r) => ({
                user_id: String(r.user_id),
                codigo: r.codigo,
                nombre: `${r.nombres} ${r.apellidos}`.trim(),
                nombres: r.nombres,
                apellidos: r.apellidos,
                usuario: r.usuario,
                email: r.email,
                sucursal: sucursal.nombre,
            })),
        };
    }
}

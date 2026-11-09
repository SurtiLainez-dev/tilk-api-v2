
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Users } from '../../database/entities/index.js';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Users)
        private readonly usersRepository: Repository<Users>,
    ) {}

    // Obtener usuario por ID
    async obtenerPorId(userId: string): Promise<Users> {
        const usuario = await this.usersRepository.findOne({
            where: { id: userId } as any,
        });

        if (!usuario) {
            throw new NotFoundException('El usuario no existe');
        }

        return usuario;
    }

    // Obtener usuario y validar que tenga correo
    async obtenerConEmail(userId: string): Promise<Users> {
        const usuario = await this.obtenerPorId(userId);

        if (!usuario.email?.trim()) {
            throw new BadRequestException(
                'El usuario no tiene correo electrónico registrado',
            );
        }

        return usuario;
    }

    // Obtener únicamente el correo
    async obtenerEmail(userId: string): Promise<string> {
        const usuario = await this.obtenerConEmail(userId);

        return usuario.email.trim();
    }

    // Verificar si existe
    async existe(userId: string): Promise<boolean> {
        return this.usersRepository.exists({
            where: { id: userId } as any,
        });
    }
}

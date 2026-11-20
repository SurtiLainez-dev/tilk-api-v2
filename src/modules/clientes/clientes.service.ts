
import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ClientesService {
    constructor(private readonly dataSource: DataSource) {}

    async obtenerPorSlug(slug: string) {
        const clientes = await this.dataSource.query(
            `
      SELECT
        c.id,
        c.slug,
        c.nombres,
        c.apellidos,
        c.identidad,
        c.email
      FROM clientes c
      WHERE c.slug = ?
      LIMIT 1
      `,
            [slug],
        );

        if (!clientes.length) {
            throw new NotFoundException(
                'El cliente solicitado no existe.',
            );
        }

        const cliente = clientes[0];

        return {
            slug: cliente.slug,
            nombres: cliente.nombres,
            apellidos: cliente.apellidos,
            nombre_completo: [
                cliente.nombres,
                cliente.apellidos,
            ]
                .filter(Boolean)
                .join(' '),
            identidad: cliente.identidad,
            email: cliente.email,
        };
    }

    async obtenerIdInterno(slug: string): Promise<string> {
        const clientes = await this.dataSource.query(
            `
      SELECT id
      FROM clientes
      WHERE slug = ?
      LIMIT 1
      `,
            [slug],
        );

        if (!clientes.length) {
            throw new NotFoundException(
                'El cliente solicitado no existe.',
            );
        }

        return String(clientes[0].id);
    }
}

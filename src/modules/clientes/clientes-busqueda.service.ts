
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

interface ClienteFila {
    slug: string | null;
    nombres: string;
    apellidos: string | null;
    identidad: string;
    email: string | null;
    cod_pais: string | null;
    telefono: string | null;
}

@Injectable()
export class ClientesBusquedaService {
    private readonly logger = new Logger(ClientesBusquedaService.name);

    constructor(private readonly dataSource: DataSource) {}

    async buscar(termino: string) {
        const buscar = String(termino ?? '').trim();

        if (buscar.length < 3) {
            throw new BadRequestException(
                'Escribe al menos 3 caracteres para buscar clientes.',
            );
        }

        if (buscar.length > 100) {
            throw new BadRequestException(
                'La búsqueda no puede superar 100 caracteres.',
            );
        }

        try {
            const palabras = buscar.split(/\s+/).filter(Boolean);

            const condiciones = [
                'c.nombres LIKE ?',
                'c.apellidos LIKE ?',
                'c.identidad LIKE ?',
                "CONCAT_WS(' ', c.nombres, c.apellidos) LIKE ?",
            ];

            const parametros: unknown[] = [
                `%${buscar}%`,
                `%${buscar}%`,
                `%${buscar}%`,
                `%${buscar}%`,
            ];

            if (palabras.length > 1) {
                condiciones.push(
                    `(${palabras
                        .map(() =>
                            "(c.nombres LIKE ? OR c.apellidos LIKE ?)",
                        )
                        .join(' AND ')})`,
                );

                for (const palabra of palabras) {
                    parametros.push(`%${palabra}%`, `%${palabra}%`);
                }
            }

            const filas: ClienteFila[] = await this.dataSource.query(
                `
        SELECT
          c.slug,
          c.nombres,
          c.apellidos,
          c.identidad,
          c.email,
          (
            SELECT tc.cod_pais
            FROM telefonos_clientes tc
            WHERE tc.cliente_id = c.id
            ORDER BY tc.is_principal DESC, tc.id ASC
            LIMIT 1
          ) AS cod_pais,
          (
            SELECT tc.tel
            FROM telefonos_clientes tc
            WHERE tc.cliente_id = c.id
            ORDER BY tc.is_principal DESC, tc.id ASC
            LIMIT 1
          ) AS telefono
        FROM clientes c
        WHERE (${condiciones.join(' OR ')})
          AND c.slug IS NOT NULL
          AND c.slug <> ''
        ORDER BY
          CASE
            WHEN c.identidad = ? THEN 0
            WHEN c.identidad LIKE ? THEN 1
            WHEN c.nombres LIKE ? THEN 2
            ELSE 3
          END,
          c.nombres ASC,
          c.apellidos ASC
        LIMIT 30
        `,
                [
                    ...parametros,
                    buscar,
                    `${buscar}%`,
                    `${buscar}%`,
                ],
            );

            return {
                success: true,
                message: 'Consulta de clientes realizada correctamente.',
                data: filas.map((cliente) => ({
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
                    telefono_principal: cliente.telefono
                        ? {
                            cod_pais: cliente.cod_pais,
                            numero: cliente.telefono,
                        }
                        : null,
                })),
            };
        } catch (error) {
            this.logger.error(
                'Error buscando clientes',
                error instanceof Error ? error.stack : String(error),
            );

            throw new InternalServerErrorException(
                'No fue posible consultar los clientes.',
            );
        }
    }
}

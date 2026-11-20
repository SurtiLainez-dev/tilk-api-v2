
import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CajaSesionService } from '../caja-sesion.service.js';

export interface ContextoVentaContado {
    cajaId: string;
    sucursalId: string;
}

@Injectable()
export class CajaVentaContadoService {
    constructor(
        private readonly cajaSesionService: CajaSesionService,
        private readonly dataSource: DataSource,
    ) {}

    async obtenerContexto(
        token: string,
        userId: string,
    ): Promise<ContextoVentaContado> {
        if (!token?.trim() || !userId?.trim()) {
            throw new UnauthorizedException(
                'Se requiere una sesión de caja válida.',
            );
        }

        const sesion = await this.cajaSesionService.validarSesion(
            token.trim(),
            userId,
        );

        const cajaId = sesion?.data?.caja_id;

        if (!cajaId) {
            throw new UnauthorizedException(
                'No se pudo identificar la caja activa.',
            );
        }

        const cajas = await this.dataSource.query(
            `
      SELECT
        id,
        sucursal_id
      FROM cajas
      WHERE id = ?
      LIMIT 1
      `,
            [cajaId],
        );

        if (!cajas.length || !cajas[0].sucursal_id) {
            throw new UnauthorizedException(
                'La caja no tiene una sucursal válida.',
            );
        }

        return {
            cajaId: String(cajas[0].id),
            sucursalId: String(cajas[0].sucursal_id),
        };
    }
}

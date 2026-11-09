
import {
    Injectable,
    ForbiddenException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

@Injectable()
export class PermisosService {
    constructor(
        private readonly dataSource: DataSource,
    ) {}

    // ==========================================
    // VERIFICAR ACCESO A UN MÓDULO
    // Devuelve true o false
    // ==========================================
    async tieneAccesoModulo(
        userId: string | number,
        moduloKey: string,
    ): Promise<boolean> {
        if (
            userId === null ||
            userId === undefined ||
            !String(userId).trim() ||
            !moduloKey?.trim()
        ) {
            return false;
        }

        const resultado: Array<{ autorizado: string | number }> =
            await this.dataSource.query(
                `
        SELECT EXISTS (
          SELECT 1
          FROM inicio_modulo_users imu
          INNER JOIN inicio_modulos im
            ON im.id = imu.inicio_modulo_id
          WHERE imu.user_id = ?
            AND im.\`key\` = ?
            AND imu.active = 1
        ) AS autorizado
        `,
                [
                    String(userId),
                    moduloKey.trim(),
                ],
            );

        return Number(resultado[0]?.autorizado ?? 0) === 1;
    }

    // ==========================================
    // EXIGIR ACCESO A UN MÓDULO
    // Lanza 403 cuando no está autorizado
    // ==========================================
    async verificarAccesoModulo(
        userId: string | number,
        moduloKey: string,
    ): Promise<void> {
        const autorizado = await this.tieneAccesoModulo(
            userId,
            moduloKey,
        );

        if (!autorizado) {
            throw new ForbiddenException(
                `No tienes autorización para acceder al módulo ${moduloKey}.`,
            );
        }
    }
}

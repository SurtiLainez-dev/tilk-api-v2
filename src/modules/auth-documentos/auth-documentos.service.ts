import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuthDocumentosService {
    private readonly logger = new Logger(AuthDocumentosService.name);
    private readonly caracteres = '0123456789abcdefghijkLmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

    clave(longitud: number = 60): string {
        if (!Number.isInteger(longitud) || longitud < 1 || longitud > 65) throw new BadRequestException('La longitud del token no es válida.');

        let token = '';
        for (let i = 0; i < longitud; i++) token += this.caracteres[randomInt(this.caracteres.length)];
        return token;
    }

    async ejecutarClave(manager: EntityManager, userId: string): Promise<{ id: string; token: string; expiracion: Date }> {
        if (!/^[1-9]\d*$/.test(String(userId))) throw new BadRequestException('El usuario no es válido.');

        this.logger.debug(`[AUTH_DOCUMENTOS] Generando credencial. Usuario=${userId}`);

        for (let intento = 1; intento <= 5; intento++) {
            const token = this.clave(60);
            const existente = await manager.query('SELECT id FROM auth_documentos WHERE token = ? LIMIT 1', [token]);
            if (existente.length) continue;

            const ahora = new Date();
            const expiracion = new Date(ahora.getTime() + 3 * 60 * 60 * 1000);

            const resultado = await manager.query(`
                INSERT INTO auth_documentos (token, user_id, expiracion, estado, created_at, updated_at)
                VALUES (?, ?, ?, 0, ?, ?)
            `, [token, userId, this.fechaMySQL(expiracion), ahora, ahora]);

            this.logger.log(`[AUTH_DOCUMENTOS] Credencial creada. ID=${resultado.insertId}, usuario=${userId}`);

            return { id: String(resultado.insertId), token, expiracion };
        }

        throw new BadRequestException('No fue posible generar una credencial única.');
    }

    private fechaMySQL(fecha: Date): string {
        return fecha.toISOString().slice(0, 19).replace('T', ' ');
    }
}
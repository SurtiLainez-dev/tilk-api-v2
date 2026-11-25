import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { EntityManager } from 'typeorm';

export interface RegistrarDocumentoQr {
    url_verificacion: string;
    referencia: string;
    detalle: string;
    tipo: string;
    autor: string;
}

@Injectable()
export class VerificarDocumentosQrService {
    private readonly logger = new Logger(VerificarDocumentosQrService.name);
    private readonly caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

    generarToken(longitud: number = 15): string {
        let token = '';
        for (let i = 0; i < longitud; i++) token += this.caracteres[randomInt(this.caracteres.length)];
        return token;
    }

    async registrar(manager: EntityManager, datos: RegistrarDocumentoQr) {
        if (!datos.url_verificacion || !datos.referencia || !datos.tipo) throw new BadRequestException('Faltan datos de verificación del documento.');
        if (!/^[1-9]\d*$/.test(String(datos.autor))) throw new BadRequestException('El autor no es válido.');

        this.logger.log(`[QR] Registrando documento. Referencia=${datos.referencia}, tipo=${datos.tipo}`);

        for (let intento = 1; intento <= 5; intento++) {
            const token = this.generarToken();
            const existente = await manager.query('SELECT id FROM verificacion_documentos WHERE token = ? LIMIT 1', [token]);
            if (existente.length) continue;

            const ahora = new Date();

            const resultado = await manager.query(`
                INSERT INTO verificacion_documentos (url_verificacion, referencia, token, detalle, tipo, autor, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [datos.url_verificacion, datos.referencia, token, datos.detalle, datos.tipo, datos.autor, ahora, ahora]);

            this.logger.log(`[QR] Documento registrado. ID=${resultado.insertId}, referencia=${datos.referencia}`);

            return { id: String(resultado.insertId), token, referencia: datos.referencia, tipo: datos.tipo };
        }

        throw new ConflictException('No fue posible generar un token QR único.');
    }
}
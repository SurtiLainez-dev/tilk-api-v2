import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface DirectrizImpresion {
    id: string;
    inicio_contador: string;
    contador_actual: string;
    contador_inicial: string;
    contador_final: string;
    codigo_post_contador: string;
    fecha_emision: string | Date | null;
    fecha_final: string | Date | null;
    cai: string | null;
}

export interface CodigoDirectriz {
    codigo: string;
    directriz_id: string;
    contador_anterior: string;
    contador_generado: string;
    contador_inicial: string;
    contador_final: string;
    contador_actual: string;
    codigo_post_contador: string;
    cai: string | null;
    fecha_emision: string | Date | null;
    fecha_final: string | Date | null;
}

@Injectable()
export class PostearCuentaDirectrizService {
    private readonly logger = new Logger(PostearCuentaDirectrizService.name);

    private convertirContador(valor: string | number, campo: string): number {
        const texto = String(valor ?? '');
        if (!/^\d+$/.test(texto)) throw new BadRequestException(`El campo ${campo} no contiene un contador válido.`);

        const numero = Number(texto);
        if (!Number.isSafeInteger(numero)) throw new BadRequestException(`El contador ${campo} excede el límite permitido.`);

        return numero;
    }

    async obtenerDirectriz(manager: EntityManager, sucursalId: string | number, tipo: number = 1, bloquear: boolean = false): Promise<DirectrizImpresion> {
        if (!/^[1-9]\d*$/.test(String(sucursalId))) throw new BadRequestException('La sucursal no es válida.');
        if (!Number.isInteger(tipo) || tipo <= 0) throw new BadRequestException('El tipo de directriz no es válido.');

        this.logger.debug(`[DIRECTRIZ] Buscando sucursal=${sucursalId}, tipo=${tipo}, bloquear=${bloquear}`);

        try {
            const bloqueo = bloquear ? 'FOR UPDATE' : '';
            const registros = await manager.query(`
                SELECT id, inicio_contador, contador_actual, contador_inicial, contador_final,
                       codigo_post_contador, fecha_emision, fecha_final, cai
                FROM directrices__impresions
                WHERE estado = 1 AND sucursal_id = ? AND tipo = ?
                ORDER BY id ASC LIMIT 2 ${bloqueo}
            `, [sucursalId, tipo]);

            if (!registros.length) throw new NotFoundException(`No existe una directriz activa para la sucursal ${sucursalId}, tipo ${tipo}.`);
            if (registros.length > 1) throw new ConflictException('Existen varias directrices activas para la misma sucursal y tipo.');

            const directriz = registros[0];
            this.logger.debug(`[DIRECTRIZ] Encontrada ID=${directriz.id}, contador_actual=${directriz.contador_actual}`);

            return {
                id: String(directriz.id),
                inicio_contador: String(directriz.inicio_contador),
                contador_actual: String(directriz.contador_actual),
                contador_inicial: String(directriz.contador_inicial),
                contador_final: String(directriz.contador_final),
                codigo_post_contador: String(directriz.codigo_post_contador),
                fecha_emision: directriz.fecha_emision,
                fecha_final: directriz.fecha_final,
                cai: directriz.cai,
            };
        } catch (error) {
            this.logger.error(`[DIRECTRIZ] Error consultando sucursal=${sucursalId}, tipo=${tipo}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }

    generarCodigo(contadorActual: string | number, contadorInicial: string | number, codigoPostContador: string): string {
        const actual = this.convertirContador(contadorActual, 'contador_actual');
        const inicial = this.convertirContador(contadorInicial, 'contador_inicial');
        const contador = actual + inicial;

        if (!Number.isSafeInteger(contador)) throw new BadRequestException('El contador generado excede el límite permitido.');
        if (contador > 9999999) throw new ConflictException('El contador excede los 7 dígitos del código.');

        return `${codigoPostContador}${String(contador).padStart(7, '0')}`;
    }

    async prepararCodigo(manager: EntityManager, sucursalId: string | number, tipo: number = 1): Promise<CodigoDirectriz> {
        this.logger.log(`[DIRECTRIZ] Preparando código. Sucursal=${sucursalId}, tipo=${tipo}`);

        try {
            const directriz = await this.obtenerDirectriz(manager, sucursalId, tipo, true);
            const actual = this.convertirContador(directriz.contador_actual, 'contador_actual');
            const inicial = this.convertirContador(directriz.contador_inicial, 'contador_inicial');
            const final = this.convertirContador(directriz.contador_final, 'contador_final');
            const contadorGenerado = actual + inicial;

            if (contadorGenerado > final) throw new ConflictException('La directriz alcanzó el contador final permitido.');

            const codigo = this.generarCodigo(actual, inicial, directriz.codigo_post_contador);
            this.logger.log(`[DIRECTRIZ] Código preparado=${codigo}, directriz=${directriz.id}`);

            return {
                codigo,
                directriz_id: directriz.id,
                contador_anterior: directriz.contador_actual,
                contador_generado: String(contadorGenerado),
                contador_inicial: directriz.contador_inicial,
                contador_final: directriz.contador_final,
                contador_actual: directriz.contador_actual,
                codigo_post_contador: directriz.codigo_post_contador,
                cai: directriz.cai,
                fecha_emision: directriz.fecha_emision,
                fecha_final: directriz.fecha_final,
            };
        } catch (error) {
            this.logger.error(`[DIRECTRIZ] Error preparando código. Sucursal=${sucursalId}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }

    async actualizarContador(manager: EntityManager, codigo: CodigoDirectriz): Promise<void> {
        this.logger.log(`[DIRECTRIZ] Actualizando contador. Directriz=${codigo.directriz_id}, código=${codigo.codigo}`);

        try {
            const anterior = this.convertirContador(codigo.contador_anterior, 'contador_anterior');
            const siguiente = anterior + 1;

            const resultado = await manager.query(`
                UPDATE directrices__impresions
                SET contador_actual = ?, updated_at = ?
                WHERE id = ? AND contador_actual = ? AND estado = 1
            `, [String(siguiente), new Date(), codigo.directriz_id, codigo.contador_anterior]);

            if (resultado.affectedRows !== 1) throw new ConflictException('No se pudo actualizar el contador. La directriz pudo haber cambiado.');

            this.logger.log(`[DIRECTRIZ] Contador actualizado. Directriz=${codigo.directriz_id}, anterior=${anterior}, nuevo=${siguiente}`);
        } catch (error) {
            this.logger.error(`[DIRECTRIZ] Error actualizando contador. Directriz=${codigo.directriz_id}`, error instanceof Error ? error.stack : String(error));
            throw error;
        }
    }
}
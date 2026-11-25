import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PostearCuentaDirectrizService } from '../postear_cuenta/postear-cuenta-directriz.service.js';
import { PostearCuentaMontoLetrasService } from '../postear_cuenta/postear-cuenta-monto-letras.service.js';
import { fechaHonduras } from '../../../common/helpers/fecha.helper.js';

export interface CrearReciboAnticipo {
    user_id: string;
    sucursal_id: string;
    caja_id: string;
    total: string;
    observacion: string;
}

@Injectable()
export class CajaAnticiposRecibosService {
    private readonly logger = new Logger(CajaAnticiposRecibosService.name);

    constructor(
        private readonly directrizService: PostearCuentaDirectrizService,
        private readonly montoLetrasService: PostearCuentaMontoLetrasService,
    ) {}

    async crearRecibo(manager: EntityManager, datos: CrearReciboAnticipo) {
        if (!manager.queryRunner?.isTransactionActive) {
            throw new ConflictException('El recibo debe generarse dentro de una transacción.');
        }

        for (const [campo, valor] of [
            ['user_id', datos.user_id],
            ['sucursal_id', datos.sucursal_id],
            ['caja_id', datos.caja_id],
        ] as const) {
            if (!/^[1-9]\d*$/.test(valor)) throw new BadRequestException(`${campo} no es válido.`);
        }

        if (!/^\d{1,7}(\.\d{1,2})?$/.test(datos.total) || Number(datos.total) <= 0) {
            throw new BadRequestException('El total del recibo no es válido.');
        }

        const observacion = datos.observacion?.trim();

        if (!observacion || observacion.length > 150) {
            throw new BadRequestException('La observación no es válida.');
        }

        const total = Number(datos.total).toFixed(2);

        // Obtener y bloquear la directriz existente.
        const directriz = await this.directrizService.prepararCodigo(manager, datos.sucursal_id, 1);
        const codigo = directriz.codigo;

        const existentes = await manager.query(
            'SELECT id FROM recibos WHERE codigo = ? LIMIT 1',
            [codigo],
        );

        if (existentes.length) throw new ConflictException(`El recibo ${codigo} ya existe.`);

        const { fecha, hora, created_at, updated_at } = fechaHonduras();
        const pagoLetras = this.montoLetrasService.convertir(total);

        const resultado = await manager.query(`
            INSERT INTO recibos (
                venta_id, codigo, fecha, hora, observacion,
                total, user_id, pago, sucursal_id, caja_id,
                saldo_actual_venta, saldo_nuevo, file,
                total_capital, total_interes, total_mora,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            null, codigo, fecha, hora, observacion,
            total, datos.user_id, pagoLetras,
            datos.sucursal_id, datos.caja_id,
            total, '0.00', '1',
            0, 0, 0,
            created_at, updated_at,
        ]);

        if (!resultado.insertId) {
            throw new ConflictException('No se pudo crear el recibo del anticipo.');
        }

        const reciboId = String(resultado.insertId);

        // Actualizar contador después de guardar el recibo.
        await this.directrizService.actualizarContador(manager, directriz);

        this.logger.log(`[RECIBO_ANTICIPO] Recibo=${codigo}, total=${total}`);

        return {
            recibo_id: reciboId,
            codigo,
            fecha,
            hora,
            total,
            saldo_anterior: total,
            saldo_nuevo: '0.00',
            pago: pagoLetras,
        };
    }
}
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityManager } from 'typeorm';

export interface RegistrarAbonoEstadoCuenta {
    venta_id: string;
    recibo_codigo: string;
    monto: string | number;
    saldo_actual: string | number;
}

@Injectable()
export class PostearCuentaEstadoCuentaService {
    async registrarAbono(manager: EntityManager, datos: RegistrarAbonoEstadoCuenta) {
        const ventaId = String(datos.venta_id).trim();
        const reciboCodigo = String(datos.recibo_codigo).trim();
        const monto = Number(datos.monto);
        const saldoActual = Number(datos.saldo_actual);

        if (!/^\d+$/.test(ventaId)) throw new BadRequestException('La venta no es válida.');
        if (!reciboCodigo) throw new BadRequestException('El código del recibo es obligatorio.');
        if (!Number.isFinite(monto) || monto <= 0) throw new BadRequestException('El monto del abono no es válido.');
        if (!Number.isFinite(saldoActual) || saldoActual < 0) throw new BadRequestException('El saldo de la venta no es válido.');

        const montoAbono = monto.toFixed(2);
        const saldoVenta = saldoActual.toFixed(2);

        const venta = await manager.query('SELECT id, saldo_actual FROM ventas WHERE id = ? FOR UPDATE', [ventaId]);
        if (!venta.length) throw new BadRequestException('No se encontró la venta.');

        if (Number(venta[0].saldo_actual).toFixed(2) !== saldoVenta) {
            throw new BadRequestException('El saldo proporcionado no coincide con el saldo actual de la venta.');
        }

        const resultado = await manager.query(`
            INSERT INTO estado_cuentas
                (venta_id, tipo, monto, saldo, origen, referencia, detalle)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            ventaId,
            'CREDITO',
            montoAbono,
            saldoVenta,
            'ABONO',
            reciboCodigo,
            'Pago por medio de caja',
        ]);

        if (!resultado?.insertId) throw new InternalServerErrorException('No fue posible registrar el abono en el estado de cuenta.');

        return {
            success: true,
            estado_cuenta_id: String(resultado.insertId),
            venta_id: ventaId,
            tipo: 'CREDITO',
            monto: montoAbono,
            saldo: saldoVenta,
            origen: 'ABONO',
            referencia: reciboCodigo,
            detalle: 'Pago por medio de caja',
        };
    }
}
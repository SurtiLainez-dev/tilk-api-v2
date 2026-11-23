
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class VentasCodigoService {
    constructor(private readonly dataSource: DataSource) {}

    async generar(clienteId: string | number, sucursalId: string | number, manager?: EntityManager): Promise<string> {
        const db = manager ?? this.dataSource.manager;
        const cliente = String(clienteId ?? '').trim();
        const sucursal = String(sucursalId ?? '').trim();

        if (!/^[1-9]\d*$/.test(cliente)) throw new BadRequestException('El cliente no es válido.');
        if (!/^[1-9]\d*$/.test(sucursal)) throw new BadRequestException('La sucursal no es válida.');
        if (10 + sucursal.length > 15) throw new BadRequestException('El identificador de sucursal supera la longitud permitida para el código.');

        const clientes: { identidad: string | null }[] = await db.query(
            'SELECT identidad FROM clientes WHERE id = ? LIMIT 1',
            [cliente],
        );

        if (!clientes.length) throw new NotFoundException('No se encontró el cliente.');

        const identidad = String(clientes[0].identidad ?? '').trim();
        const prefijo = /[a-z]/i.test(identidad) ? '0000' : identidad.slice(0, 4);

        if (!/^\d{4}$/.test(prefijo)) throw new BadRequestException('La identidad del cliente debe contener al menos cuatro dígitos o letras.');

        for (let intento = 0; intento < 30; intento++) {
            const aleatorio = String(randomInt(0, 1_000_000)).padStart(6, '0');
            const codigo = `${prefijo}${aleatorio}${sucursal}`;

            const existentes: { id: string }[] = await db.query(
                'SELECT id FROM ventas WHERE cod = ? LIMIT 1',
                [codigo],
            );

            if (!existentes.length) return codigo;
        }

        throw new InternalServerErrorException('No fue posible generar un código de venta único.');
    }
}

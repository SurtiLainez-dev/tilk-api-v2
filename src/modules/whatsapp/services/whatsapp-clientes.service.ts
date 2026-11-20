
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    Clientes,
    VentasEntity,
    PagosContratos,
    FacturasContados,
    Articulos,
    Marcas,
} from '../../../database/entities/index.js';

@Injectable()
export class WhatsappClientesService {

    constructor(
        @InjectRepository(Clientes) private readonly clientesRepository: Repository<Clientes>,
        @InjectRepository(VentasEntity) private readonly ventasRepository: Repository<VentasEntity>,
        @InjectRepository(PagosContratos) private readonly pagosRepository: Repository<PagosContratos>,
        @InjectRepository(FacturasContados) private readonly facturasRepository: Repository<FacturasContados>,
        @InjectRepository(Articulos) private readonly articulosRepository: Repository<Articulos>,
        @InjectRepository(Marcas) private readonly marcasRepository: Repository<Marcas>,
    ) {}

    async identificarCliente(identidad: string) {
        const documento = identidad?.trim();

        if (!documento) return {
            success: false,
            encontrado: false,
            message: 'Debe proporcionar su número de identidad o pasaporte.',
        };

        const cliente = await this.clientesRepository.findOne({
            where: { identidad: documento },
            select: { id: true, slug: true, nombres: true, apellidos: true },
        });

        if (!cliente) return {
            success: true,
            encontrado: false,
            message: 'Actualmente este número de identidad no existe en nuestra base de datos.',
        };

        return {
            success: true,
            encontrado: true,
            cliente: {
                slug: cliente.slug,
                nombre: [cliente.nombres, cliente.apellidos].filter(Boolean).join(' '),
            },
        };
    }

    async obtenerCuentasActivas(slug: string) {
        const cliente = await this.clientesRepository.findOne({
            where: { slug },
            select: { id: true, slug: true, nombres: true, apellidos: true },
        });

        if (!cliente) throw new NotFoundException('Cliente no encontrado');

        const ventas = await this.ventasRepository
            .createQueryBuilder('venta')
            .where('venta.cliente_id = :clienteId', { clienteId: cliente.id })
            .andWhere('venta.estado < :estado', { estado: 3 })
            .orderBy('venta.id', 'ASC')
            .getMany();

        const cuentas = await Promise.all(ventas.map(async (venta) => {
            const pago = await this.pagosRepository
                .createQueryBuilder('pago')
                .where('pago.venta_id = :ventaId', { ventaId: venta.id })
                .andWhere('pago.estado < :estado', { estado: 3 })
                .orderBy('pago.fecha_pago', 'ASC')
                .addOrderBy('pago.id', 'ASC')
                .getOne();

            const facturas = await this.facturasRepository.find({
                where: { venta_id: venta.id },
                select: { articulo_id: true, cantidad: true },
            });

            const articulos = await Promise.all(facturas.map(async (factura) => {
                const articulo = await this.articulosRepository.findOne({
                    where: { id: factura.articulo_id },
                    select: { nombre_articulo: true, modelo: true, marca_id: true },
                });

                if (!articulo) return null;

                const marca = await this.marcasRepository.findOne({
                    where: { id: articulo.marca_id },
                    select: { nombre: true },
                });

                return {
                    nombre: articulo.nombre_articulo,
                    modelo: articulo.modelo,
                    marca: marca?.nombre ?? null,
                    cantidad: factura.cantidad,
                };
            }));

            return {
                slug: venta.slug,
                numero_cuenta: venta.cod,
                estado: venta.estado,
                saldo_actual: Number(venta.saldo_actual),
                articulos: articulos.filter((articulo) => articulo !== null),
                siguiente_pago: pago ? {
                    fecha: pago.fecha_pago,
                    saldo_actual: Number(pago.saldo_actual),
                    mora: Number(pago.mora),
                    capital: Number(pago.capital),
                    interes: Number(pago.interes),
                } : null,
            };
        }));

        return {
            success: true,
            cliente: {
                slug: cliente.slug,
                nombre: [cliente.nombres, cliente.apellidos].filter(Boolean).join(' '),
            },
            total_cuentas: cuentas.length,
            cuentas,
        };
    }
}

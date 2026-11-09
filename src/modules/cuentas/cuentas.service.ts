import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConsultarCuentasDto} from "./dto/consultar-cuentas.dto.js";

// Ajustar según la ubicación real de tus entidades
import { VentasEntity, Clientes} from "../../database/entities/index.js";

export interface CuentaPendiente {
    slug: string;
    cod: string;
    nombres: string;
    apellidos: string | null;
    identidad: string;
    estado: number;
    saldo_actual: number;
}

@Injectable()
export class CuentasService {
    constructor(
        @InjectRepository(VentasEntity)
        private readonly ventasRepository: Repository<VentasEntity>,
    ) {}

    async obtenerCuentasPendientes(
        filtros: ConsultarCuentasDto,
    ) {
        const pagina = filtros.pagina ?? 1;
        const limite = filtros.limite ?? 20;

        const offset = (pagina - 1) * limite;

        const query = this.ventasRepository
            .createQueryBuilder('venta')
            .innerJoin(
                Clientes,
                'cliente',
                'cliente.id = venta.cliente_id',
            )
            .where('venta.estado IN (:...estados)', {
                estados: [1, 2],
            })
            .andWhere('venta.saldo_actual > :saldo', {
                saldo: 0,
            })
            .andWhere('venta.slug IS NOT NULL')
            .andWhere("venta.slug <> ''");

        // Buscar por venta o información del cliente
        if (filtros.buscar?.trim()) {
            const buscar = `%${filtros.buscar.trim()}%`;

            query.andWhere(
                `(
          venta.cod LIKE :buscar
          OR cliente.nombres LIKE :buscar
          OR cliente.apellidos LIKE :buscar
          OR cliente.identidad LIKE :buscar
          OR CONCAT(
            cliente.nombres,
            ' ',
            COALESCE(cliente.apellidos, '')
          ) LIKE :buscar
        )`,
                { buscar },
            );
        }

        // Filtrar por estado específico
        if (filtros.estado !== undefined) {
            query.andWhere('venta.estado = :estado', {
                estado: filtros.estado,
            });
        }

        const total = await query
            .clone()
            .getCount();

        const resultados = await query
            .select('venta.slug', 'slug')
            .addSelect('venta.cod', 'cod')
            .addSelect('cliente.nombres', 'nombres')
            .addSelect('cliente.apellidos', 'apellidos')
            .addSelect('cliente.identidad', 'identidad')
            .addSelect('venta.estado', 'estado')
            .addSelect('venta.saldo_actual', 'saldo_actual')
            .orderBy('venta.cod', 'DESC')
            .addOrderBy('venta.id', 'DESC')
            .offset(offset)
            .limit(limite)
            .getRawMany<{
                slug: string;
                cod: string;
                nombres: string;
                apellidos: string | null;
                identidad: string;
                estado: string | number;
                saldo_actual: string | number;
            }>();

        const cuentas: CuentaPendiente[] = resultados.map(
            (cuenta) => ({
                slug: cuenta.slug,
                cod: cuenta.cod,
                nombres: cuenta.nombres,
                apellidos: cuenta.apellidos,
                identidad: cuenta.identidad,
                estado: Number(cuenta.estado),
                saldo_actual: Number(cuenta.saldo_actual),
            }),
        );

        return {
            success: true,
            message: 'Cuentas pendientes obtenidas correctamente.',
            data: cuentas,
            pagination: {
                pagina,
                limite,
                total,
                total_paginas: Math.ceil(total / limite),
            },
        };
    }
}
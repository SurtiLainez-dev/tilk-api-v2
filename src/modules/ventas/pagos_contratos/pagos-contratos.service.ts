
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PagosContratos, VentasEntity } from '../../../database/entities/index.js';

export interface CrearPagoContratoDto {
    venta_id: string | number;
    pago_inicial: number;
    total_pago: number;
    total_abonado: number;
    saldo_actual: number;
    detalle: string;
    is_mora: number;
    mora: number;
    inicio_mora?: Date | string | null;
    capital: number;
    interes: number;
    fecha_pago: Date | string;
    is_cobro_mora: number;
    estado: number;
    saldo_antes?: number | null;
    saldo_despues?: number | null;
    saldo_capital?: number | null;
    saldo_intereses?: number | null;
    dias_mora?: number | null;
    dias_gracia?: number | null;
    saldo_cap?: number | null;
    proceso_pago_online?: number | null;
}

@Injectable()
export class PagosContratosService {
    constructor(
        @InjectRepository(PagosContratos)
        private readonly pagosContratosRepository: Repository<PagosContratos>,
    ) {}

    private validarId(valor: string | number, nombre: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${nombre} no es válido.`);
        return id;
    }

    private validarMonto(valor: unknown, nombre: string): number {
        if (valor === null || valor === undefined || valor === '') {
            throw new BadRequestException(`${nombre} es obligatorio.`);
        }

        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero < 0) {
            throw new BadRequestException(`${nombre} no es válido.`);
        }

        return Math.round((numero + Number.EPSILON) * 100) / 100;
    }

    private validarEntero(valor: unknown, nombre: string): number {
        const numero = Number(valor);
        if (valor === null || valor === undefined || valor === '' || !Number.isInteger(numero) || numero < 0) {
            throw new BadRequestException(`${nombre} no es válido.`);
        }
        return numero;
    }

    private validarFecha(valor: Date | string | null | undefined, nombre: string, requerida = false): Date | null {
        if (valor === null || valor === undefined || valor === '') {
            if (requerida) throw new BadRequestException(`${nombre} es obligatorio.`);
            return null;
        }

        const fecha = valor instanceof Date ? valor : new Date(valor);
        if (Number.isNaN(fecha.getTime())) throw new BadRequestException(`${nombre} no es válida.`);
        return fecha;
    }

    async crearPagoContrato(dto: CrearPagoContratoDto, manager?: EntityManager): Promise<PagosContratos> {
        if (!dto) throw new BadRequestException('Debes proporcionar los datos del pago.');

        const ventaId = this.validarId(dto.venta_id, 'La venta');
        const pagoInicial = this.validarMonto(dto.pago_inicial, 'El pago inicial');
        const totalPago = this.validarMonto(dto.total_pago, 'El total del pago');
        const totalAbonado = this.validarMonto(dto.total_abonado, 'El total abonado');
        const saldoActual = this.validarMonto(dto.saldo_actual, 'El saldo actual');
        const mora = this.validarMonto(dto.mora, 'La mora');
        const capital = this.validarMonto(dto.capital, 'El capital');
        const interes = this.validarMonto(dto.interes, 'El interés');
        const isMora = this.validarEntero(dto.is_mora, 'El indicador de mora');
        const isCobroMora = this.validarEntero(dto.is_cobro_mora, 'El indicador de cobro de mora');
        const estado = this.validarEntero(dto.estado, 'El estado');
        const fechaPago = this.validarFecha(dto.fecha_pago, 'La fecha del pago', true)!;
        const inicioMora = this.validarFecha(dto.inicio_mora, 'La fecha de inicio de mora');

        const detalle = String(dto.detalle ?? '').trim();
        if (!detalle || detalle.length > 40) {
            throw new BadRequestException('El detalle debe contener entre 1 y 40 caracteres.');
        }

        const opcionalMonto = (valor: number | null | undefined, nombre: string): number | null =>
            valor === null || valor === undefined ? null : this.validarMonto(valor, nombre);

        const opcionalEntero = (valor: number | null | undefined, nombre: string): number | null =>
            valor === null || valor === undefined ? null : this.validarEntero(valor, nombre);

        const ejecutar = async (db: EntityManager): Promise<PagosContratos> => {
            const venta = await db.getRepository(VentasEntity).findOne({ where: { id: ventaId } });
            if (!venta) throw new NotFoundException('No se encontró la venta asociada al pago.');

            const repository = db.getRepository(PagosContratos);


            const pago = repository.create({
                venta_id: ventaId,
                pago_inicial: pagoInicial,
                total_pago: totalPago,
                total_abonado: totalAbonado,
                saldo_actual: saldoActual,
                detalle,
                is_mora: isMora,
                mora,
                inicio_mora: inicioMora ? inicioMora.toISOString().slice(0, 10) : null,
                capital,
                interes,
                fecha_pago: fechaPago.toISOString().slice(0, 10),
                is_cobro_mora: isCobroMora,
                estado,
                saldo_antes: opcionalMonto(dto.saldo_antes, 'El saldo anterior'),
                saldo_despues: opcionalMonto(dto.saldo_despues, 'El saldo posterior'),
                saldo_capital: opcionalMonto(dto.saldo_capital, 'El saldo de capital'),
                saldo_intereses: opcionalMonto(dto.saldo_intereses, 'El saldo de intereses'),
                dias_mora: opcionalEntero(dto.dias_mora, 'Los días de mora'),
                dias_gracia: opcionalEntero(dto.dias_gracia, 'Los días de gracia'),
                saldo_cap: opcionalMonto(dto.saldo_cap, 'El saldo de capital pendiente'),
                proceso_pago_online: opcionalEntero(dto.proceso_pago_online, 'El proceso de pago en línea'),
                created_at: new Date(),
                updated_at: new Date(),
            });

            return repository.save(pago);
        };

        return manager ? ejecutar(manager) : this.pagosContratosRepository.manager.transaction(ejecutar);
    }
}

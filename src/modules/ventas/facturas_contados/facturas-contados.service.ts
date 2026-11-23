
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FacturasContados } from '../../../database/entities/index.js';

export interface CrearFacturaContadoDto {
    venta_id: string | number;
    articulo_id: string | number;
    cantidad: number;
    precio: number;
    total: number;
    is_remision: number;
    remision_articulo_id?: string | number | null;
    estado_articulo_id?: string | number | null;
    combo_id?: string | number | null;
}

@Injectable()
export class FacturasContadosService {
    constructor(
        @InjectRepository(FacturasContados)
        private readonly facturasRepository: Repository<FacturasContados>,
    ) {}

    private validarId(valor: string | number, campo: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${campo} no es válido.`);
        return id;
    }

    private validarIdOpcional(valor: string | number | null | undefined, campo: string): string | null | undefined {
        if (valor === undefined) return undefined;
        if (valor === null) return null;
        return this.validarId(valor, campo);
    }

    private validarMonto(valor: number, campo: string): number {
        if (valor === null || valor === undefined || !Number.isFinite(valor)) throw new BadRequestException(`${campo} es obligatorio.`);
        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero < 0) throw new BadRequestException(`${campo} no es válido.`);
        return Math.round((numero + Number.EPSILON) * 100) / 100;
    }

    async crearFacturaContado(dto: CrearFacturaContadoDto, manager?: EntityManager): Promise<FacturasContados> {
        if (!dto) throw new BadRequestException('Debes proporcionar los datos de la factura.');

        const ventaId = this.validarId(dto.venta_id, 'La venta');
        const articuloId = this.validarId(dto.articulo_id, 'El artículo');
        const cantidad = Number(dto.cantidad);
        const isRemision = Number(dto.is_remision);

        if (!Number.isInteger(cantidad) || cantidad <= 0) throw new BadRequestException('La cantidad debe ser un entero mayor que cero.');
        if (![0, 1].includes(isRemision)) throw new BadRequestException('El indicador is_remision debe ser 0 o 1.');

        const precio = this.validarMonto(dto.precio, 'El precio');
        const total = this.validarMonto(dto.total, 'El total');
        const remisionArticuloId = this.validarIdOpcional(dto.remision_articulo_id, 'La remisión');
        const estadoArticuloId = this.validarIdOpcional(dto.estado_articulo_id, 'El estado del artículo');
        const comboId = this.validarIdOpcional(dto.combo_id, 'El combo');

        if (isRemision === 1 && !remisionArticuloId) {
            throw new BadRequestException('Debes proporcionar remision_articulo_id cuando is_remision es 1.');
        }

        const ejecutar = async (db: EntityManager): Promise<FacturasContados> => {
            const repository = db.getRepository(FacturasContados);

            const factura = repository.create({
                venta_id: ventaId,
                articulo_id: articuloId,
                cantidad,
                precio,
                total,
                is_remision: isRemision,
                ...(remisionArticuloId !== undefined ? { remision_articulo_id: remisionArticuloId } : {}),
                ...(estadoArticuloId !== undefined ? { estado_articulo_id: estadoArticuloId } : {}),
                ...(comboId !== undefined ? { combo_id: comboId } : {}),
                created_at: new Date(),
                updated_at: new Date(),
            });

            return repository.save(factura);
        };

        return manager ? ejecutar(manager) : this.facturasRepository.manager.transaction(ejecutar);
    }
}

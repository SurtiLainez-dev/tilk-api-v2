
import {
    BadRequestException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
    HttpException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';

import {
    VentasEntity,
    Sucursals,
    Colaboradors,
    CobSegmentos,
    CobPortafolios,
} from '../../database/entities/index.js';

import { VentasCodigoService } from './ventas-codigo.service.js';
import { CobPortafoliosService } from '../cobros/portafolios/cob-portafolios.service.js';

interface CuentaActivaRow {
    slug: string | null;
    cod: string;
    tipo_venta: number;
    estado: number;
    total: number;
    saldo_actual: number;
    saldo_actual_cap: number;
    mora: number;
    pagando: number;
    dias_mora: number;
    fecha: Date | null;
    sucursal_nombre: string | null;
    sucursal_abreviatura: string | null;
    sucursal_codigo: number | null;
    colaborador_nombres: string | null;
    colaborador_apellidos: string | null;
    colaborador_codigo: string | null;
    segmento_nombre: string | null;
    segmento_alias: string | null;
    segmento_color: string | null;
    portafolio_nombre: string | null;
    portafolio_codigo: string | null;
}

type CamposGenerados = 'id' | 'slug' | 'cod' | 'cob_portafolio_id';

export type CrearVentaDto = Omit<
    Partial<VentasEntity>,
    CamposGenerados | 'cliente_id' | 'sucursal_id' | 'colaborador_id' | 'cob_segmento_id' | 'tipo_venta' | 'total' | 'saldo_actual' | 'estado' | 'num_cuotas' | 'is_aceptado' | 'tasa_mora' | 'estado_garantia'
    > & {
    cliente_id: string;
    sucursal_id: string;
    colaborador_id: string;
    cob_segmento_id: string;
    tipo_venta: number;
    total: number;
    saldo_actual: number;
    estado: number;
    num_cuotas: number;
    is_aceptado: number;
    tasa_mora: number;
    estado_garantia: number;
    portafolio_user_id?: string | number | null;
};

@Injectable()
export class VentasService {
    private readonly logger = new Logger(VentasService.name);

    constructor(
        @InjectRepository(VentasEntity)
        private readonly ventasRepository: Repository<VentasEntity>,
        private readonly dataSource: DataSource,
        private readonly ventasCodigoService: VentasCodigoService,
        private readonly cobPortafoliosService: CobPortafoliosService,
    ) {}

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    private dinero(valor: unknown): number {
        const numero = Number(valor ?? 0);
        return Math.round((numero + Number.EPSILON) * 100) / 100;
    }

    private nombreEstado(estado: number): string {
        switch (Number(estado)) {
            case 1: return 'AL DÍA';
            case 2: return 'EN MORA';
            default: return 'SIN CLASIFICAR';
        }
    }

    private nombreTipoVenta(tipo: number): string {
        switch (Number(tipo)) {
            case 1: return 'CONTADO';
            case 2: return 'CRÉDITO';
            default: return 'SIN CLASIFICAR';
        }
    }

    private validarId(valor: unknown, nombre: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${nombre} no es válido.`);
        return id;
    }

    private validarNumero(valor: unknown, nombre: string, minimo = 0): number {
        const numero = Number(valor);
        if (!Number.isFinite(numero) || numero < minimo) {
            throw new BadRequestException(`${nombre} no es válido.`);
        }
        return numero;
    }

    private async obtenerClienteId(clienteSlug: string): Promise<string> {
        const slug = clienteSlug?.trim();

        if (!slug || slug.length > 255) {
            throw new BadRequestException('El identificador del cliente no es válido.');
        }

        const clientes: { id: string }[] = await this.dataSource.query(
            'SELECT id FROM clientes WHERE slug = ? LIMIT 1',
            [slug],
        );

        if (!clientes.length) {
            throw new NotFoundException('No se encontró el cliente seleccionado.');
        }

        return String(clientes[0].id);
    }

    // ==========================================
    // CREAR VENTA GENÉRICA
    // ==========================================

    async crearVenta(dto: CrearVentaDto, manager?: EntityManager): Promise<VentasEntity> {
        if (!dto || typeof dto !== 'object') {
            throw new BadRequestException('Debes proporcionar los datos de la venta.');
        }

        const clienteId = this.validarId(dto.cliente_id, 'El cliente');
        const sucursalId = this.validarId(dto.sucursal_id, 'La sucursal');
        const colaboradorId = this.validarId(dto.colaborador_id, 'El colaborador');
        const segmentoId = this.validarId(dto.cob_segmento_id, 'El segmento');

        const tipoVenta = this.validarNumero(dto.tipo_venta, 'El tipo de venta', 1);
        const total = this.validarNumero(dto.total, 'El total');
        const saldoActual = this.validarNumero(dto.saldo_actual, 'El saldo actual');
        const estado = this.validarNumero(dto.estado, 'El estado', 1);
        const numCuotas = this.validarNumero(dto.num_cuotas, 'El número de cuotas');
        const isAceptado = this.validarNumero(dto.is_aceptado, 'El estado de aceptación');
        const tasaMora = this.validarNumero(dto.tasa_mora, 'La tasa de mora');
        const estadoGarantia = this.validarNumero(dto.estado_garantia, 'El estado de garantía');

        if (![tipoVenta, estado, numCuotas, isAceptado, estadoGarantia].every(Number.isInteger)) {
            throw new BadRequestException('Los campos de estado, tipo y cuotas deben ser enteros.');
        }

        if (total <= 0) throw new BadRequestException('El total de la venta debe ser mayor a cero.');
        if (saldoActual > total) throw new BadRequestException('El saldo actual no puede superar el total de la venta.');

        const ejecutar = async (db: EntityManager): Promise<VentasEntity> => {
            const repository = db.getRepository(VentasEntity);

            const [cliente, sucursal, colaborador, segmento] = await Promise.all([
                db.query('SELECT id FROM clientes WHERE id = ? LIMIT 1', [clienteId]),
                db.query('SELECT id FROM sucursals WHERE id = ? LIMIT 1', [sucursalId]),
                db.query('SELECT id, sucursal_id FROM colaboradors WHERE id = ? LIMIT 1', [colaboradorId]),
                db.query('SELECT id FROM cob_segmentos WHERE id = ? LIMIT 1', [segmentoId]),
            ]);

            if (!cliente.length) throw new NotFoundException('No se encontró el cliente.');
            if (!sucursal.length) throw new NotFoundException('No se encontró la sucursal.');
            if (!colaborador.length) throw new NotFoundException('No se encontró el colaborador.');
            if (!segmento.length) throw new NotFoundException('No se encontró el segmento.');

            if (String(colaborador[0].sucursal_id) !== sucursalId) {
                throw new BadRequestException('El colaborador no pertenece a la sucursal de la venta.');
            }

            const portafolioId = await this.cobPortafoliosService.obtenerPortafolioId(
                sucursalId,
                dto.portafolio_user_id ?? null,
                db,
            );

            const codigo = await this.ventasCodigoService.generar(clienteId, sucursalId, db);

            const {
                portafolio_user_id,
                cliente_id,
                sucursal_id,
                colaborador_id,
                cob_segmento_id,
                tipo_venta,
                total: totalDto,
                saldo_actual,
                estado: estadoDto,
                num_cuotas,
                is_aceptado,
                tasa_mora,
                estado_garantia,
                ...camposAdicionales
            } = dto;

            const venta = repository.create({
                ...camposAdicionales,
                slug: randomUUID(),
                cod: codigo,
                cliente_id: clienteId,
                sucursal_id: sucursalId,
                colaborador_id: colaboradorId,
                cob_segmento_id: segmentoId,
                cob_portafolio_id: portafolioId,
                tipo_venta: tipoVenta,
                total: this.dinero(total),
                saldo_actual: this.dinero(saldoActual),
                estado,
                num_cuotas: numCuotas,
                is_aceptado: isAceptado,
                tasa_mora: tasaMora,
                estado_garantia: estadoGarantia,
                created_at: dto.created_at ?? new Date(),
                updated_at: dto.updated_at ?? new Date(),
            });

            try {
                return await repository.save(venta);
            } catch (error: unknown) {
                const dbError = error as { code?: string };
                if (dbError.code === 'ER_DUP_ENTRY') {
                    throw new ConflictException('Ya existe una venta con el código generado.');
                }
                throw error;
            }
        };

        // Si viene de facturación, reutiliza su transacción.
        // Si se llama independientemente, crea una propia.
        return manager ? ejecutar(manager) : this.dataSource.transaction(ejecutar);
    }

    // ==========================================
    // OBTENER CUENTAS ACTIVAS DEL CLIENTE
    // ==========================================

    async obtenerCuentasActivas(clienteSlug: string) {
        try {
            const clienteId = await this.obtenerClienteId(clienteSlug);

            const cuentas = await this.ventasRepository
                .createQueryBuilder('venta')
                .leftJoin(Sucursals, 'sucursal', 'sucursal.id = venta.sucursal_id')
                .leftJoin(Colaboradors, 'colaborador', 'colaborador.id = venta.colaborador_id')
                .leftJoin(CobSegmentos, 'segmento', 'segmento.id = venta.cob_segmento_id')
                .leftJoin(CobPortafolios, 'portafolio', 'portafolio.id = venta.cob_portafolio_id')
                .select('venta.slug', 'slug')
                .addSelect('venta.cod', 'cod')
                .addSelect('venta.tipo_venta', 'tipo_venta')
                .addSelect('venta.estado', 'estado')
                .addSelect('venta.total', 'total')
                .addSelect('venta.saldo_actual', 'saldo_actual')
                .addSelect('venta.saldo_actual_cap', 'saldo_actual_cap')
                .addSelect('venta.mora', 'mora')
                .addSelect('venta.pagando', 'pagando')
                .addSelect('venta.dias_mora', 'dias_mora')
                .addSelect('venta.created_at', 'fecha')
                .addSelect('sucursal.nombre', 'sucursal_nombre')
                .addSelect('sucursal.abreviatura', 'sucursal_abreviatura')
                .addSelect('sucursal.cod', 'sucursal_codigo')
                .addSelect('colaborador.nombres', 'colaborador_nombres')
                .addSelect('colaborador.apellidos', 'colaborador_apellidos')
                .addSelect('colaborador.codigo', 'colaborador_codigo')
                .addSelect('segmento.nombre', 'segmento_nombre')
                .addSelect('segmento.alias', 'segmento_alias')
                .addSelect('segmento.color', 'segmento_color')
                .addSelect('portafolio.nombre', 'portafolio_nombre')
                .addSelect('portafolio.codigo', 'portafolio_codigo')
                .where('venta.cliente_id = :clienteId', { clienteId })
                .andWhere('venta.estado < :estado', { estado: 3 })
                .orderBy('venta.estado', 'DESC')
                .addOrderBy('venta.created_at', 'DESC')
                .addOrderBy('venta.id', 'DESC')
                .getRawMany<CuentaActivaRow>();

            const data = cuentas.map(cuenta => ({
                slug: cuenta.slug,
                cod: cuenta.cod,
                tipo_venta: Number(cuenta.tipo_venta),
                tipo_venta_nombre: this.nombreTipoVenta(cuenta.tipo_venta),
                estado: Number(cuenta.estado),
                estado_nombre: this.nombreEstado(cuenta.estado),
                total: this.dinero(cuenta.total),
                saldo_actual: this.dinero(cuenta.saldo_actual),
                saldo_actual_cap: this.dinero(cuenta.saldo_actual_cap),
                mora: this.dinero(cuenta.mora),
                pagando: this.dinero(cuenta.pagando),
                dias_mora: Number(cuenta.dias_mora ?? 0),
                fecha: cuenta.fecha,
                sucursal: cuenta.sucursal_nombre !== null ? {
                    nombre: cuenta.sucursal_nombre,
                    abreviatura: cuenta.sucursal_abreviatura,
                    codigo: cuenta.sucursal_codigo,
                } : null,
                colaborador: cuenta.colaborador_nombres !== null ? {
                    codigo: cuenta.colaborador_codigo,
                    nombres: cuenta.colaborador_nombres,
                    apellidos: cuenta.colaborador_apellidos,
                    nombre_completo: [
                        cuenta.colaborador_nombres,
                        cuenta.colaborador_apellidos,
                    ].filter(Boolean).join(' '),
                } : null,
                segmento: cuenta.segmento_nombre !== null ? {
                    nombre: cuenta.segmento_nombre,
                    alias: cuenta.segmento_alias,
                    color: cuenta.segmento_color,
                } : null,
                portafolio: cuenta.portafolio_nombre !== null ? {
                    nombre: cuenta.portafolio_nombre,
                    codigo: cuenta.portafolio_codigo,
                } : null,
            }));

            return {
                success: true,
                message: 'Cuentas activas consultadas correctamente.',
                total: data.length,
                resumen: {
                    cuentas_al_dia: data.filter(cuenta => cuenta.estado === 1).length,
                    cuentas_en_mora: data.filter(cuenta => cuenta.estado === 2).length,
                    saldo_actual: this.dinero(data.reduce((total, cuenta) => total + cuenta.saldo_actual, 0)),
                    saldo_actual_cap: this.dinero(data.reduce((total, cuenta) => total + cuenta.saldo_actual_cap, 0)),
                    mora: this.dinero(data.reduce((total, cuenta) => total + cuenta.mora, 0)),
                    pagando: this.dinero(data.reduce((total, cuenta) => total + cuenta.pagando, 0)),
                },
                data,
            };
        } catch (error: unknown) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                'Error consultando cuentas activas del cliente.',
                error instanceof Error ? error.stack : String(error),
            );

            throw new InternalServerErrorException(
                'No fue posible consultar las cuentas activas del cliente.',
            );
        }
    }
}

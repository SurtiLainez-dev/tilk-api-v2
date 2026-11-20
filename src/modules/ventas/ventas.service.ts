import {
    BadRequestException,
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
    HttpException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import {
    VentasEntity,
    Sucursals,
    Colaboradors,
    CobSegmentos,
    CobPortafolios,
} from '../../database/entities/index.js';

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

@Injectable()
export class VentasService {

    private readonly logger = new Logger(
        VentasService.name,
    );

    constructor(

        @InjectRepository(VentasEntity)
        private readonly ventasRepository:
            Repository<VentasEntity>,

        private readonly dataSource: DataSource,

    ) {}

    // ==========================================
    // FORMATEAR VALORES MONETARIOS
    // ==========================================

    private dinero(valor: unknown): number {

        const numero = Number(valor ?? 0);

        return Math.round(
            (numero + Number.EPSILON) * 100,
        ) / 100;

    }

    // ==========================================
    // NOMBRE DEL ESTADO DE LA CUENTA
    // ==========================================

    private nombreEstado(estado: number): string {

        switch (Number(estado)) {

            case 1:
                return 'AL DÍA';

            case 2:
                return 'EN MORA';

            default:
                return 'SIN CLASIFICAR';

        }

    }

    // ==========================================
    // NOMBRE DEL TIPO DE VENTA
    // ==========================================

    private nombreTipoVenta(tipo: number): string {

        switch (Number(tipo)) {

            case 1:
                return 'CONTADO';

            case 2:
                return 'CRÉDITO';

            default:
                return 'SIN CLASIFICAR';

        }

    }

    // ==========================================
    // OBTENER CLIENTE POR SLUG
    // ==========================================

    private async obtenerClienteId(
        clienteSlug: string,
    ): Promise<string> {

        const slug = clienteSlug?.trim();

        if (!slug || slug.length > 255) {

            throw new BadRequestException(
                'El identificador del cliente no es válido.',
            );

        }

        const clientes: { id: string }[] =
            await this.dataSource.query(
                `
                    SELECT id
                    FROM clientes
                    WHERE slug = ?
                    LIMIT 1
                `,
                [slug],
            );

        if (!clientes.length) {

            throw new NotFoundException(
                'No se encontró el cliente seleccionado.',
            );

        }

        return String(clientes[0].id);

    }

    // ==========================================
    // OBTENER CUENTAS ACTIVAS DEL CLIENTE
    // ==========================================

    async obtenerCuentasActivas(
        clienteSlug: string,
    ) {

        try {

            const clienteId =
                await this.obtenerClienteId(
                    clienteSlug,
                );

            const cuentas =
                await this.ventasRepository
                    .createQueryBuilder('venta')

                    // ==========================
                    // RELACIONES
                    // ==========================

                    .leftJoin(
                        Sucursals,
                        'sucursal',
                        'sucursal.id = venta.sucursal_id',
                    )

                    .leftJoin(
                        Colaboradors,
                        'colaborador',
                        'colaborador.id = venta.colaborador_id',
                    )

                    .leftJoin(
                        CobSegmentos,
                        'segmento',
                        'segmento.id = venta.cob_segmento_id',
                    )

                    .leftJoin(
                        CobPortafolios,
                        'portafolio',
                        'portafolio.id = venta.cob_portafolio_id',
                    )

                    // ==========================
                    // DATOS DE LA VENTA
                    // ==========================

                    .select('venta.slug', 'slug')

                    .addSelect(
                        'venta.cod',
                        'cod',
                    )

                    .addSelect(
                        'venta.tipo_venta',
                        'tipo_venta',
                    )

                    .addSelect(
                        'venta.estado',
                        'estado',
                    )

                    .addSelect(
                        'venta.total',
                        'total',
                    )

                    .addSelect(
                        'venta.saldo_actual',
                        'saldo_actual',
                    )

                    .addSelect(
                        'venta.saldo_actual_cap',
                        'saldo_actual_cap',
                    )

                    .addSelect(
                        'venta.mora',
                        'mora',
                    )

                    .addSelect(
                        'venta.pagando',
                        'pagando',
                    )

                    .addSelect(
                        'venta.dias_mora',
                        'dias_mora',
                    )

                    .addSelect(
                        'venta.created_at',
                        'fecha',
                    )

                    // ==========================
                    // SUCURSAL
                    // ==========================

                    .addSelect(
                        'sucursal.nombre',
                        'sucursal_nombre',
                    )

                    .addSelect(
                        'sucursal.abreviatura',
                        'sucursal_abreviatura',
                    )

                    .addSelect(
                        'sucursal.cod',
                        'sucursal_codigo',
                    )

                    // ==========================
                    // COLABORADOR
                    // ==========================

                    .addSelect(
                        'colaborador.nombres',
                        'colaborador_nombres',
                    )

                    .addSelect(
                        'colaborador.apellidos',
                        'colaborador_apellidos',
                    )

                    .addSelect(
                        'colaborador.codigo',
                        'colaborador_codigo',
                    )

                    // ==========================
                    // SEGMENTO
                    // ==========================

                    .addSelect(
                        'segmento.nombre',
                        'segmento_nombre',
                    )

                    .addSelect(
                        'segmento.alias',
                        'segmento_alias',
                    )

                    .addSelect(
                        'segmento.color',
                        'segmento_color',
                    )

                    // ==========================
                    // PORTAFOLIO
                    // ==========================

                    .addSelect(
                        'portafolio.nombre',
                        'portafolio_nombre',
                    )

                    .addSelect(
                        'portafolio.codigo',
                        'portafolio_codigo',
                    )

                    // ==========================
                    // FILTROS
                    // ==========================

                    .where(
                        'venta.cliente_id = :clienteId',
                        { clienteId },
                    )

                    .andWhere(
                        'venta.estado < :estado',
                        { estado: 3 },
                    )

                    // ==========================
                    // ORDENAMIENTO
                    // ==========================

                    .orderBy(
                        'venta.estado',
                        'DESC',
                    )

                    .addOrderBy(
                        'venta.created_at',
                        'DESC',
                    )

                    .addOrderBy(
                        'venta.id',
                        'DESC',
                    )

                    .getRawMany<CuentaActivaRow>();

            // ==================================
            // FORMATEAR RESPUESTA
            // ==================================

            const data = cuentas.map(cuenta => ({

                slug: cuenta.slug,

                cod: cuenta.cod,

                tipo_venta: Number(
                    cuenta.tipo_venta,
                ),

                tipo_venta_nombre:
                    this.nombreTipoVenta(
                        cuenta.tipo_venta,
                    ),

                estado: Number(
                    cuenta.estado,
                ),

                estado_nombre:
                    this.nombreEstado(
                        cuenta.estado,
                    ),

                total: this.dinero(
                    cuenta.total,
                ),

                saldo_actual: this.dinero(
                    cuenta.saldo_actual,
                ),

                saldo_actual_cap: this.dinero(
                    cuenta.saldo_actual_cap,
                ),

                mora: this.dinero(
                    cuenta.mora,
                ),

                pagando: this.dinero(
                    cuenta.pagando,
                ),

                dias_mora: Number(
                    cuenta.dias_mora ?? 0,
                ),

                fecha: cuenta.fecha,

                // ==============================
                // SUCURSAL
                // ==============================

                sucursal: cuenta.sucursal_nombre !== null
                    ? {

                        nombre:
                        cuenta.sucursal_nombre,

                        abreviatura:
                        cuenta.sucursal_abreviatura,

                        codigo:
                        cuenta.sucursal_codigo,

                    }
                    : null,

                // ==============================
                // COLABORADOR
                // ==============================

                colaborador:
                    cuenta.colaborador_nombres !== null
                        ? {

                            codigo:
                            cuenta.colaborador_codigo,

                            nombres:
                            cuenta.colaborador_nombres,

                            apellidos:
                            cuenta.colaborador_apellidos,

                            nombre_completo: [

                                cuenta.colaborador_nombres,
                                cuenta.colaborador_apellidos,

                            ].filter(Boolean).join(' '),

                        }
                        : null,

                // ==============================
                // SEGMENTO
                // ==============================

                segmento:
                    cuenta.segmento_nombre !== null
                        ? {

                            nombre:
                            cuenta.segmento_nombre,

                            alias:
                            cuenta.segmento_alias,

                            color:
                            cuenta.segmento_color,

                        }
                        : null,

                // ==============================
                // PORTAFOLIO
                // ==============================

                portafolio:
                    cuenta.portafolio_nombre !== null
                        ? {

                            nombre:
                            cuenta.portafolio_nombre,

                            codigo:
                            cuenta.portafolio_codigo,

                        }
                        : null,

            }));

            return {

                success: true,

                message:
                    'Cuentas activas consultadas correctamente.',

                total: data.length,

                resumen: {

                    cuentas_al_dia: data.filter(
                        cuenta => cuenta.estado === 1,
                    ).length,

                    cuentas_en_mora: data.filter(
                        cuenta => cuenta.estado === 2,
                    ).length,

                    saldo_actual: this.dinero(
                        data.reduce(
                            (total, cuenta) =>
                                total + cuenta.saldo_actual,
                            0,
                        ),
                    ),

                    saldo_actual_cap: this.dinero(
                        data.reduce(
                            (total, cuenta) =>
                                total + cuenta.saldo_actual_cap,
                            0,
                        ),
                    ),

                    mora: this.dinero(
                        data.reduce(
                            (total, cuenta) =>
                                total + cuenta.mora,
                            0,
                        ),
                    ),

                    pagando: this.dinero(
                        data.reduce(
                            (total, cuenta) =>
                                total + cuenta.pagando,
                            0,
                        ),
                    ),

                },

                data,

            };

        } catch (error: unknown) {

            if (error instanceof HttpException) {

                throw error;

            }

            this.logger.error(

                'Error consultando cuentas activas del cliente.',

                error instanceof Error
                    ? error.stack
                    : String(error),

            );

            throw new InternalServerErrorException(

                'No fue posible consultar las cuentas activas del cliente.',

            );

        }

    }

}
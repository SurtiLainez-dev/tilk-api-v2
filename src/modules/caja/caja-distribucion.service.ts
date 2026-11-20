
import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    VentasEntity,
    PagosContratos,
} from '../../database/entities/index.js';

// ==========================================
// TIPOS DE DISTRIBUCIÓN
// ==========================================

export type ConceptoDistribucion = 'MORA' | 'CAPITAL';

export interface DistribucionItem {
    tipo: ConceptoDistribucion;

    detalle: string;
    obligacion: string;

    pendiente: string;
    pagara: string;
    saldo: string;
    hay: string;

    saldo_cap_antes: string;
    mora_antes: string;
    saldo_actual_antes: string;

    abono_mora: string;
    abono_saldo_cap: string;
    abono_total: string;

    saldo_cap_despues: string;
    mora_despues: string;
    saldo_actual_despues: string;
}

@Injectable()
export class CajaDistribucionService {
    constructor(
        @InjectRepository(VentasEntity)
        private readonly ventasRepository:
            Repository<VentasEntity>,

        @InjectRepository(PagosContratos)
        private readonly pagosRepository:
            Repository<PagosContratos>,
    ) {}

    // ==========================================
    // CONVERSIÓN MONETARIA A CENTAVOS
    // ==========================================

    private aCentavos(valor: unknown): number {
        if (
            typeof valor !== 'string' &&
            typeof valor !== 'number'
        ) {
            throw new UnprocessableEntityException(
                'Se encontró un valor monetario inválido.',
            );
        }

        const texto = String(valor).trim();

        const coincidencia =
            /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(texto);

        if (!coincidencia) {
            throw new UnprocessableEntityException(
                `Valor monetario inválido: ${texto}`,
            );
        }

        const negativo =
            coincidencia[1] === '-' ? -1 : 1;

        const entero = Number(coincidencia[2]);

        const decimales = Number(
            (coincidencia[3] || '').padEnd(2, '0'),
        );

        const resultado =
            negativo * (entero * 100 + decimales);

        if (!Number.isSafeInteger(resultado)) {
            throw new UnprocessableEntityException(
                'El importe supera el límite permitido.',
            );
        }

        return resultado;
    }

    // ==========================================
    // FORMATO MONETARIO
    // ==========================================

    private dinero(centavos: number): string {
        const signo = centavos < 0 ? '-' : '';
        const absoluto = Math.abs(centavos);

        return (
            signo +
            Math.floor(absoluto / 100) +
            '.' +
            String(absoluto % 100).padStart(2, '0')
        );
    }

    // ==========================================
    // CONSULTAR DISTRIBUCIÓN
    // SOLO SIMULACIÓN - NO REGISTRA PAGOS
    // ==========================================

    async consultarDistribucion(
        ventaSlug: string,
        monto: string | number,
    ) {
        // ======================================
        // 1. VALIDAR DATOS
        // ======================================

        if (
            typeof ventaSlug !== 'string' ||
            !ventaSlug.trim()
        ) {
            throw new BadRequestException(
                'Debes proporcionar el slug de la venta.',
            );
        }

        const montoCentavos = this.aCentavos(monto);

        if (montoCentavos <= 0) {
            throw new BadRequestException(
                'El monto debe ser mayor que cero.',
            );
        }

        // ======================================
        // 2. CONSULTAR VENTA
        // ======================================

        const venta = await this.ventasRepository.findOne({
            where: {
                slug: ventaSlug.trim(),
            },
        });

        if (!venta) {
            throw new NotFoundException(
                'No se encontró la venta solicitada.',
            );
        }

        const saldoVenta = this.aCentavos(
            venta.saldo_actual,
        );

        if (saldoVenta < 0) {
            throw new UnprocessableEntityException(
                'La venta tiene un saldo negativo. Notifica a soporte.',
            );
        }

        if (montoCentavos > saldoVenta) {
            throw new BadRequestException(
                'El monto no puede superar el saldo actual de la venta.',
            );
        }

        // ======================================
        // 3. CONSULTAR OBLIGACIONES PENDIENTES
        // ======================================
        //
        // Estado 1: Al día
        // Estado 2: En mora
        //
        // Orden: ID ASC
        //
        // No se utiliza el campo detalle
        // para determinar el orden.
        // ======================================

        const registros = await this.pagosRepository
            .createQueryBuilder('pago')
            .where('pago.venta_id = :ventaId', {
                ventaId: venta.id,
            })
            .andWhere('pago.estado IN (:...estados)', {
                estados: [1, 2],
            })
            .orderBy('pago.id', 'ASC')
            .getMany();

        if (registros.length === 0) {
            throw new UnprocessableEntityException(
                'La venta no tiene obligaciones pendientes.',
            );
        }

        // ======================================
        // 4. DISTRIBUIR EL MONTO
        // ======================================

        let disponible = montoCentavos;

        const distribucion: DistribucionItem[] = [];

        let totalMora = 0;
        let totalCapital = 0;

        // ======================================
        // RECORRER OBLIGACIONES EN ORDEN
        // ======================================

        for (const registro of registros) {
            if (disponible <= 0) {
                break;
            }

            // ==================================
            // 4A. OBTENER SALDOS
            // ==================================

            const moraAntes = this.aCentavos(
                registro.mora ?? 0,
            );

            const saldoCapAntes = this.aCentavos(
                registro.saldo_cap ?? 0,
            );

            const saldoActualRegistrado = this.aCentavos(
                registro.saldo_actual,
            );

            // ==================================
            // VALIDAR SALDOS
            // ==================================

            if (
                moraAntes < 0 ||
                saldoCapAntes < 0 ||
                saldoActualRegistrado < 0
            ) {
                throw new UnprocessableEntityException(
                    `La obligación "${registro.detalle}" tiene saldos negativos.`,
                );
            }

            // ==================================
            // VALIDAR CONSISTENCIA
            // ==================================

            const saldoActualAntes =
                saldoCapAntes + moraAntes;

            if (
                saldoActualRegistrado !==
                saldoActualAntes
            ) {
                throw new UnprocessableEntityException(
                    `La obligación "${registro.detalle}" tiene una diferencia entre saldo_actual y saldo_cap + mora.`,
                );
            }

            if (saldoActualAntes === 0) {
                continue;
            }

            // ==================================
            // 4B. PAGAR PRIMERO LA MORA
            // ==================================

            let abonoMora = 0;

            if (
                Number(registro.is_mora) === 1 &&
                moraAntes > 0 &&
                disponible > 0
            ) {
                abonoMora = Math.min(
                    disponible,
                    moraAntes,
                );

                disponible -= abonoMora;
                totalMora += abonoMora;
            }

            const moraDespues =
                moraAntes - abonoMora;

            // ==================================
            // 4C. PAGAR DESPUÉS SALDO_CAP
            // ==================================

            let abonoSaldoCap = 0;

            if (
                disponible > 0 &&
                saldoCapAntes > 0
            ) {
                abonoSaldoCap = Math.min(
                    disponible,
                    saldoCapAntes,
                );

                disponible -= abonoSaldoCap;
                totalCapital += abonoSaldoCap;
            }

            const saldoCapDespues =
                saldoCapAntes - abonoSaldoCap;

            const saldoActualDespues =
                moraDespues + saldoCapDespues;

            const abonoTotal =
                abonoMora + abonoSaldoCap;

            if (abonoTotal === 0) {
                continue;
            }

            // ==================================
            // 4D. AGREGAR FILA DE MORA
            // ==================================

            if (abonoMora > 0) {
                distribucion.push({
                    tipo: 'MORA',

                    detalle: `Mora ${registro.detalle}`,
                    obligacion: registro.detalle,

                    pendiente: this.dinero(
                        moraAntes,
                    ),

                    pagara: this.dinero(
                        abonoMora,
                    ),

                    saldo: this.dinero(
                        moraDespues,
                    ),

                    hay: this.dinero(
                        montoCentavos -
                        totalMora -
                        totalCapital +
                        abonoSaldoCap,
                    ),

                    saldo_cap_antes: this.dinero(
                        saldoCapAntes,
                    ),

                    mora_antes: this.dinero(
                        moraAntes,
                    ),

                    saldo_actual_antes: this.dinero(
                        saldoActualAntes,
                    ),

                    abono_mora: this.dinero(
                        abonoMora,
                    ),

                    abono_saldo_cap: '0.00',

                    abono_total: this.dinero(
                        abonoMora,
                    ),

                    saldo_cap_despues: this.dinero(
                        saldoCapAntes,
                    ),

                    mora_despues: this.dinero(
                        moraDespues,
                    ),

                    saldo_actual_despues: this.dinero(
                        saldoActualAntes - abonoMora,
                    ),
                });
            }

            // ==================================
            // 4E. AGREGAR FILA DE CAPITAL
            // ==================================

            if (abonoSaldoCap > 0) {
                distribucion.push({
                    tipo: 'CAPITAL',

                    detalle: registro.detalle,
                    obligacion: registro.detalle,

                    pendiente: this.dinero(
                        saldoCapAntes,
                    ),

                    pagara: this.dinero(
                        abonoSaldoCap,
                    ),

                    saldo: this.dinero(
                        saldoCapDespues,
                    ),

                    hay: this.dinero(
                        disponible,
                    ),

                    saldo_cap_antes: this.dinero(
                        saldoCapAntes,
                    ),

                    mora_antes: this.dinero(
                        moraDespues,
                    ),

                    saldo_actual_antes: this.dinero(
                        saldoActualAntes - abonoMora,
                    ),

                    abono_mora: '0.00',

                    abono_saldo_cap: this.dinero(
                        abonoSaldoCap,
                    ),

                    abono_total: this.dinero(
                        abonoSaldoCap,
                    ),

                    saldo_cap_despues: this.dinero(
                        saldoCapDespues,
                    ),

                    mora_despues: this.dinero(
                        moraDespues,
                    ),

                    saldo_actual_despues: this.dinero(
                        saldoActualDespues,
                    ),
                });
            }
        }

        // ======================================
        // 5. VALIDAR DISTRIBUCIÓN COMPLETA
        // ======================================

        if (disponible !== 0) {
            throw new UnprocessableEntityException({
                message:
                    'No fue posible distribuir completamente el monto. Verifica los saldos y estados de las obligaciones.',

                monto_sin_distribuir: this.dinero(
                    disponible,
                ),
            });
        }

        // ======================================
        // 6. CALCULAR TOTALES
        // ======================================

        const totalDistribuido =
            totalMora + totalCapital;

        const saldoVentaEstimado =
            saldoVenta - totalDistribuido;

        // ======================================
        // 7. DEVOLVER SIMULACIÓN
        // ======================================

        return {
            success: true,

            mensaje:
                'Distribución calculada correctamente. El pago aún no ha sido registrado.',

            venta: {
                slug: venta.slug,
                codigo: venta.cod,

                saldo_actual: this.dinero(
                    saldoVenta,
                ),
            },

            resumen: {
                monto_solicitado: this.dinero(
                    montoCentavos,
                ),

                total_distribuido: this.dinero(
                    totalDistribuido,
                ),

                total_mora: this.dinero(
                    totalMora,
                ),

                total_capital: this.dinero(
                    totalCapital,
                ),

                total_abono_saldo_cap: this.dinero(
                    totalCapital,
                ),

                saldo_venta_estimado: this.dinero(
                    saldoVentaEstimado,
                ),
            },

            distribucion,

            simulacion: true,
            registrado: false,
        };
    }
}

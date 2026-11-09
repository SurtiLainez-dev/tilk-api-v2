
import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

type DbRow = Record<string, any>;

@Injectable()
export class CuentasDetalleService {
    constructor(private readonly db: DataSource) {}

    private numero(value: unknown): number {
        const n = Number(value ?? 0);
        return Number.isFinite(n) ? n : 0;
    }

    private dinero(value: unknown): number {
        return Math.round((this.numero(value) + Number.EPSILON) * 100) / 100;
    }

    private async obtenerVenta(slug: string): Promise<DbRow> {
        const rows = await this.db.query(
            `
      SELECT
        v.id,
        v.slug,
        v.cod,
        v.cliente_id,
        v.sucursal_id,
        v.estado,
        v.total,
        v.saldo_financiar,
        v.saldo_actual,
        v.saldo_actual_cap,
        v.pagando,
        v.dias_mora,
        v.cob_segmento_id,
        v.mora,
        v.prima,
        v.cuota,
        v.num_cuotas,
        v.fecha_prima,
        v.fecha_vencimiento,
        v.created_at,
        v.total_abonado,
        v.total_abonado_capital
      FROM ventas v
      WHERE v.slug = ?
      LIMIT 1
      `,
            [slug],
        );

        if (!rows.length) {
            throw new NotFoundException('No se encontró la venta solicitada.');
        }

        return rows[0];
    }

    private async obtenerCalculos(ventaId: string) {
        const rows = await this.db.query(
            `
      SELECT
        COALESCE(SUM(
          CASE
            WHEN estado IN (1, 2) AND saldo_actual > 0
            THEN saldo_actual ELSE 0
          END
        ), 0) AS saldo_actual,

        COALESCE(SUM(
          CASE
            WHEN estado IN (1, 2)
            THEN COALESCE(saldo_cap, 0)
            ELSE 0
          END
        ), 0) AS saldo_actual_cap,

        COALESCE(SUM(
          CASE
            WHEN estado = 2
            THEN COALESCE(saldo_cap, 0) + COALESCE(mora, 0)
            ELSE 0
          END
        ), 0) AS pagando,

        COALESCE(SUM(
          CASE
            WHEN estado = 2 AND saldo_actual > 0
            THEN saldo_actual ELSE 0
          END
        ), 0) AS saldo_en_mora,

        COALESCE(SUM(
          CASE
            WHEN estado = 2
            THEN COALESCE(saldo_cap, 0)
            ELSE 0
          END
        ), 0) AS saldo_capital_en_mora,

        COALESCE(SUM(
          CASE
            WHEN estado = 2
            THEN COALESCE(mora, 0)
            ELSE 0
          END
        ), 0) AS mora_en_cuotas,

        MIN(
          CASE
            WHEN estado = 2 THEN fecha_pago
            ELSE NULL
          END
        ) AS fecha_mora_mas_antigua,

        SUM(CASE WHEN estado IN (1, 2) THEN 1 ELSE 0 END)
          AS cuotas_activas,

        SUM(CASE WHEN estado = 2 THEN 1 ELSE 0 END)
          AS cuotas_en_mora,

        SUM(CASE WHEN estado = 1 THEN 1 ELSE 0 END)
          AS cuotas_al_dia,

        COUNT(*) AS total_cuotas
      FROM pagos_contratos
      WHERE venta_id = ?
      `,
            [ventaId],
        );

        const r = rows[0] ?? {};

        const fechaRows = await this.db.query(
            `
      SELECT
        COALESCE(
          GREATEST(
            DATEDIFF(
              CURDATE(),
              MIN(CASE WHEN estado = 2 THEN fecha_pago END)
            ),
            0
          ),
          0
        ) AS dias_mora
      FROM pagos_contratos
      WHERE venta_id = ?
      `,
            [ventaId],
        );

        return {
            saldo_actual: this.dinero(r.saldo_actual),
            saldo_actual_cap: this.dinero(r.saldo_actual_cap),
            pagando: this.dinero(r.pagando),
            saldo_en_mora: this.dinero(r.saldo_en_mora),
            saldo_capital_en_mora: this.dinero(r.saldo_capital_en_mora),
            mora_en_cuotas: this.dinero(r.mora_en_cuotas),
            fecha_mora_mas_antigua: r.fecha_mora_mas_antigua ?? null,
            dias_mora: this.numero(fechaRows[0]?.dias_mora),
            cuotas_activas: this.numero(r.cuotas_activas),
            cuotas_en_mora: this.numero(r.cuotas_en_mora),
            cuotas_al_dia: this.numero(r.cuotas_al_dia),
            total_cuotas: this.numero(r.total_cuotas),
        };
    }

    private async obtenerSegmento(diasMora: number) {
        const rows = await this.db.query(
            `
      SELECT id, nombre, alias, inicio, final, color
      FROM cob_segmentos
      WHERE ? BETWEEN inicio AND final
      ORDER BY inicio ASC, id ASC
      LIMIT 1
      `,
            [diasMora],
        );

        const segmento = rows[0];

        return segmento
            ? {
                id: String(segmento.id),
                nombre: segmento.nombre,
                alias: segmento.alias,
                inicio: this.numero(segmento.inicio),
                final: this.numero(segmento.final),
                color: segmento.color,
            }
            : null;
    }

    private async obtenerArticulos(ventaId: string) {
        const rows = await this.db.query(
            `
      SELECT
        a.codigo_sistema,
        a.nombre_articulo,
        a.modelo,
        m.nombre AS marca,
        fc.cantidad,
        fc.precio,
        fc.total
      FROM facturas_contados fc
      INNER JOIN articulos a ON a.id = fc.articulo_id
      LEFT JOIN marcas m ON m.id = a.marca_id
      WHERE fc.venta_id = ?
      ORDER BY fc.id ASC
      `,
            [ventaId],
        );

        return rows.map((r: DbRow) => ({
            slug: r.slug,
            codigo_sistema: r.codigo_sistema,
            nombre_articulo: r.nombre_articulo,
            modelo: r.modelo,
            marca: r.marca,
            cantidad: this.numero(r.cantidad),
            precio: this.dinero(r.precio),
            total: this.dinero(r.total),
        }));
    }

    private async obtenerCliente(clienteId: string) {
        const rows = await this.db.query(
            `
      SELECT
        c.slug,
        c.nombres,
        c.apellidos,
        c.identidad,
        c.rating,
        c.email,
        lc.monto_aprobado,
        lc.monto_disponible,
        lc.monto_utilizado,
        lc.estado AS estado_credito,
        lc.fecha_vencimiento AS vencimiento_credito
      FROM clientes c
      LEFT JOIN limite_credito_clientes lc
        ON lc.id = (
          SELECT l2.id
          FROM limite_credito_clientes l2
          WHERE l2.cliente_id = c.id
            AND l2.es_actual = 1
            AND l2.estado = 'ACTIVO'
          ORDER BY l2.id DESC
          LIMIT 1
        )
      WHERE c.id = ?
      LIMIT 1
      `,
            [clienteId],
        );

        const c = rows[0];

        if (!c) {
            return null;
        }

        return {
            slug: c.slug,
            nombres: c.nombres,
            apellidos: c.apellidos,
            identidad: c.identidad,
            rating: c.rating,
            email: c.email,
            credito: c.estado_credito
                ? {
                    estado: c.estado_credito,
                    aprobado: this.dinero(c.monto_aprobado),
                    disponible: this.dinero(c.monto_disponible),
                    utilizado: this.dinero(c.monto_utilizado),
                    fecha_vencimiento: c.vencimiento_credito,
                }
                : null,
        };
    }

    async detalle(slug: string) {
        const venta = await this.obtenerVenta(slug);

        const [cliente, articulos, calculos, auditoria] =
            await Promise.all([
                this.obtenerCliente(String(venta.cliente_id)),
                this.obtenerArticulos(String(venta.id)),
                this.obtenerCalculos(String(venta.id)),
                this.auditoria(slug),
            ]);

        return {
            success: true,
            data: {
                cliente,
                venta: {
                    slug: venta.slug,
                    cod: venta.cod,
                    estado: this.numero(venta.estado),
                    total: this.dinero(venta.total),
                    saldo_inicial: this.dinero(venta.saldo_financiar),
                    saldo_actual: calculos.saldo_actual,
                    saldo_en_mora: calculos.saldo_en_mora,
                    saldo_capital_en_mora: calculos.saldo_capital_en_mora,
                    saldo_actual_cap: calculos.saldo_actual_cap,
                    mora_en_cuotas: calculos.mora_en_cuotas,
                    para_ponerse_al_dia: calculos.pagando,
                    cuota: this.dinero(venta.cuota),
                    prima: this.dinero(venta.prima),
                    num_cuotas: this.numero(venta.num_cuotas),
                    fecha_prima: venta.fecha_prima,
                    fecha_vencimiento: venta.fecha_vencimiento,
                    dias_mora: calculos.dias_mora,
                    total_abonado: this.dinero(venta.total_abonado),
                    total_abonado_capital: this.dinero(
                        venta.total_abonado_capital,
                    ),
                },
                articulos,
                auditoria: {
                    correcto: auditoria.data.correcto,
                    puede_postear: auditoria.data.puede_postear,
                    diferencias: auditoria.data.diferencias,
                },
            },
        };
    }

    async planPagos(slug: string) {
        const venta = await this.obtenerVenta(slug);

        const rows = await this.db.query(
            `
      SELECT
        detalle,
        fecha_pago,
        pago_inicial,
        total_pago,
        total_abonado,
        saldo_actual,
        saldo_cap,
        saldo_capital,
        saldo_intereses,
        capital,
        interes,
        mora,
        is_mora,
        is_cobro_mora,
        dias_mora,
        dias_gracia,
        estado,
        saldo_antes,
        saldo_despues
      FROM pagos_contratos
      WHERE venta_id = ?
      ORDER BY fecha_pago ASC, id ASC
      `,
            [venta.id],
        );

        return {
            success: true,
            data: {
                venta_slug: venta.slug,
                venta_cod: venta.cod,
                total: rows.length,
                pagos: rows.map((p: DbRow) => ({
                    detalle: p.detalle,
                    fecha_pago: p.fecha_pago,
                    pago_inicial: this.dinero(p.pago_inicial),
                    total_pago: this.dinero(p.total_pago),
                    total_abonado: this.dinero(p.total_abonado),
                    saldo_actual: this.dinero(p.saldo_actual),
                    saldo_cap: this.dinero(p.saldo_cap),
                    saldo_capital: this.dinero(p.saldo_capital),
                    saldo_intereses: this.dinero(p.saldo_intereses),
                    capital: this.dinero(p.capital),
                    interes: this.dinero(p.interes),
                    mora: this.dinero(p.mora),
                    is_mora: this.numero(p.is_mora),
                    is_cobro_mora: this.numero(p.is_cobro_mora),
                    dias_mora: this.numero(p.dias_mora),
                    dias_gracia: this.numero(p.dias_gracia),
                    estado: this.numero(p.estado),
                    saldo_antes: p.saldo_antes,
                    saldo_despues: p.saldo_despues,
                })),
            },
        };
    }

    async recibos(slug: string) {
        const venta = await this.obtenerVenta(slug);

        const rows = await this.db.query(
            `
      SELECT
        codigo,
        referencia,
        fecha,
        hora,
        observacion,
        total,
        total_capital,
        total_interes,
        total_mora,
        pago,
        file,
        saldo_actual_venta,
        saldo_nuevo
      FROM recibos
      WHERE venta_id = ?
      ORDER BY fecha DESC, hora DESC, id DESC
      `,
            [venta.id],
        );

        return {
            success: true,
            data: {
                venta_slug: venta.slug,
                venta_cod: venta.cod,
                total: rows.length,
                recibos: rows.map((r: DbRow) => ({
                    codigo: r.codigo,
                    referencia: r.referencia,
                    fecha: r.fecha,
                    hora: r.hora,
                    observacion: r.observacion,
                    total: this.dinero(r.total),
                    total_capital: this.dinero(r.total_capital),
                    total_interes: this.dinero(r.total_interes),
                    total_mora: this.dinero(r.total_mora),
                    forma_pago: r.pago,
                    archivo: r.file,
                    saldo_anterior: this.dinero(r.saldo_actual_venta),
                    saldo_nuevo: this.dinero(r.saldo_nuevo),
                })),
            },
        };
    }

    async auditoria(slug: string) {
        const venta = await this.obtenerVenta(slug);
        const calculos = await this.obtenerCalculos(String(venta.id));

        const segmento = await this.obtenerSegmento(calculos.dias_mora);

        const diferencias: Array<{
            campo: string;
            almacenado: number | string | null;
            esperado: number | string | null;
            diferencia?: number;
            correcto: boolean;
        }> = [];

        const compararMonto = (
            campo: string,
            almacenado: unknown,
            esperado: number,
        ) => {
            const actual = this.dinero(almacenado);
            const diferencia = this.dinero(actual - esperado);

            diferencias.push({
                campo,
                almacenado: actual,
                esperado,
                diferencia,
                correcto: Math.abs(diferencia) <= 0.01,
            });
        };

        compararMonto(
            'saldo_actual',
            venta.saldo_actual,
            calculos.saldo_actual,
        );

        compararMonto(
            'saldo_actual_cap',
            venta.saldo_actual_cap,
            calculos.saldo_actual_cap,
        );

        compararMonto(
            'pagando',
            venta.pagando,
            calculos.pagando,
        );

        diferencias.push({
            campo: 'dias_mora',
            almacenado: this.numero(venta.dias_mora),
            esperado: calculos.dias_mora,
            correcto:
                this.numero(venta.dias_mora) === calculos.dias_mora,
        });

        const segmentoActual = venta.cob_segmento_id == null
            ? null
            : String(venta.cob_segmento_id);

        diferencias.push({
            campo: 'cob_segmento_id',
            almacenado: segmentoActual,
            esperado: segmento?.id ?? null,
            correcto: segmentoActual === (segmento?.id ?? null),
        });

        const inconsistencias = diferencias.filter(d => !d.correcto);

        return {
            success: true,
            data: {
                venta: {
                    slug: venta.slug,
                    cod: venta.cod,
                    estado: this.numero(venta.estado),
                },
                correcto: inconsistencias.length === 0,
                puede_postear: inconsistencias.length === 0,
                mensaje: inconsistencias.length
                    ? 'La cuenta presenta diferencias de saldos o segmento. Solicita una revisión antes de procesar el pago.'
                    : 'La auditoría no encontró diferencias en los campos verificados.',
                calculos: {
                    ...calculos,
                    segmento_esperado: segmento,
                },
                diferencias,
                inconsistencias,
            },
        };
    }
}

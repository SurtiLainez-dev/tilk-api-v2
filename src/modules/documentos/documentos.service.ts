
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
    ReciboPdfService,
    type DatosReciboPdf,
} from './caja/recibo-pdf.service.js';

interface ReciboRow {
    id: string;
    codigo: string;
    referencia: string | null;
    fecha: string | Date;
    hora: string;
    observacion: string | null;
    total: number;
    total_capital: number | null;
    total_interes: number | null;
    total_mora: number | null;
    pago: string;
    saldo_actual_venta: number;
    saldo_nuevo: number;
    user_id: string;
    caja_id: string | null;
    sucursal_id: string | null;
    venta_codigo: string | null;
    cliente_nombres: string | null;
    cliente_apellidos: string | null;
    sucursal_nombre: string | null;
    sucursal_abreviatura: string | null;
    sucursal_cod: number | null;
    sucursal_direccion: string | null;
    sucursal_telefono: string | null;
    sucursal_email: string | null;
}

interface MovimientoRow {
    tipo: number;
    detalle: string | null;
    total_capital: number | null;
    total_interes: number | null;
    total_mora: number | null;
    total: number | null;
    cuota_detalle: string | null;
    cuota_fecha_pago: string | null;
}

type FilaDinamica = Record<string, unknown>;

@Injectable()
export class DocumentosService {
    private readonly logger = new Logger(DocumentosService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly reciboPdfService: ReciboPdfService,
    ) {}

    private numero(
        valor: number | string | null | undefined,
    ): number {
        const n = Number(valor ?? 0);

        if (!Number.isFinite(n)) {
            throw new BadRequestException(
                'El recibo contiene un importe inválido.',
            );
        }

        return n;
    }

    private redondear(valor: number): number {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    private fechaTexto(fecha: string | Date): string {
        if (fecha instanceof Date) {
            return [
                fecha.getUTCFullYear(),
                String(fecha.getUTCMonth() + 1).padStart(2, '0'),
                String(fecha.getUTCDate()).padStart(2, '0'),
            ].join('-');
        }

        return String(fecha).slice(0, 10);
    }

    private texto(
        valor: unknown,
        defecto = '',
    ): string {
        if (valor === null || valor === undefined) {
            return defecto;
        }

        return String(valor).trim() || defecto;
    }

    private valorDe(
        fila: FilaDinamica | undefined,
        nombres: string[],
    ): string {
        if (!fila) return '';

        for (const nombre of nombres) {
            const valor = fila[nombre];

            if (
                valor !== null &&
                valor !== undefined &&
                String(valor).trim()
            ) {
                return String(valor).trim();
            }
        }

        return '';
    }

    private async consultarRegistro(
        tabla: 'users' | 'cajas',
        id: string | null,
    ): Promise<FilaDinamica | undefined> {
        if (!id) return undefined;

        const filas = await this.dataSource.query(
            `SELECT * FROM \`${tabla}\` WHERE id = ? LIMIT 1`,
            [id],
        ) as FilaDinamica[];

        return filas[0];
    }

    private letras(importe: number): string {
        const unidades = [
            'CERO', 'UNO', 'DOS', 'TRES', 'CUATRO',
            'CINCO', 'SEIS', 'SIETE', 'OCHO',
            'NUEVE', 'DIEZ', 'ONCE', 'DOCE',
            'TRECE', 'CATORCE', 'QUINCE',
            'DIECISÉIS', 'DIECISIETE',
            'DIECIOCHO', 'DIECINUEVE',
            'VEINTE', 'VEINTIUNO', 'VEINTIDÓS',
            'VEINTITRÉS', 'VEINTICUATRO',
            'VEINTICINCO', 'VEINTISÉIS',
            'VEINTISIETE', 'VEINTIOCHO',
            'VEINTINUEVE',
        ];

        const decenas = [
            '', '', '', 'TREINTA', 'CUARENTA',
            'CINCUENTA', 'SESENTA', 'SETENTA',
            'OCHENTA', 'NOVENTA',
        ];

        const centenas = [
            '', 'CIENTO', 'DOSCIENTOS',
            'TRESCIENTOS', 'CUATROCIENTOS',
            'QUINIENTOS', 'SEISCIENTOS',
            'SETECIENTOS', 'OCHOCIENTOS',
            'NOVECIENTOS',
        ];

        const convertir = (n: number): string => {
            if (n < 30) return unidades[n];

            if (n < 100) {
                const d = Math.floor(n / 10);
                const u = n % 10;

                return decenas[d] +
                    (u ? ` Y ${unidades[u]}` : '');
            }

            if (n === 100) return 'CIEN';

            if (n < 1000) {
                const c = Math.floor(n / 100);
                const resto = n % 100;

                return centenas[c] +
                    (resto ? ` ${convertir(resto)}` : '');
            }

            if (n < 1_000_000) {
                const miles = Math.floor(n / 1000);
                const resto = n % 1000;

                return (
                    (miles === 1
                        ? 'MIL'
                        : `${convertir(miles)} MIL`) +
                    (resto ? ` ${convertir(resto)}` : '')
                );
            }

            if (n < 1_000_000_000) {
                const millones = Math.floor(n / 1_000_000);
                const resto = n % 1_000_000;

                return (
                    (millones === 1
                        ? 'UN MILLÓN'
                        : `${convertir(millones)} MILLONES`) +
                    (resto ? ` ${convertir(resto)}` : '')
                );
            }

            throw new BadRequestException(
                'Importe demasiado grande para convertir a letras.',
            );
        };

        const centavosTotal = Math.round(importe * 100);
        const enteros = Math.floor(centavosTotal / 100);
        const centavos = centavosTotal % 100;

        const texto = convertir(enteros)
            .replace(/\bUNO(?=\s|$)/g, 'UN');

        return (
            `${texto} LEMPIRAS CON ` +
            `${String(centavos).padStart(2, '0')}/100`
        );
    }

    private async buscarQr(codigo: string): Promise<string> {
        const filas = await this.dataSource.query(
            `
            SELECT token
            FROM verificacion_documentos
            WHERE referencia = ?
            ORDER BY id DESC
            LIMIT 1
            `,
            [codigo],
        ) as Array<{ token: string | null }>;

        const token = filas[0]?.token?.trim();

        if (!token) {
            throw new NotFoundException(
                `No se encontró el token QR del recibo ${codigo}.`,
            );
        }

        return token;
    }

    async generarRecibo(codigo: string): Promise<Buffer> {
        const inicio = Date.now();
        const solicitudId = randomUUID().slice(0, 8);
        const prefijo = `[PDF:${solicitudId}]`;
        const codigoLimpio = codigo?.trim();

        let paso = 'INICIO';

        try {
            if (!codigoLimpio) {
                throw new BadRequestException(
                    'Código de recibo no proporcionado.',
                );
            }

            // ========================================
            // 1. CONSULTAR RECIBO
            // ========================================

            paso = 'CONSULTAR_RECIBO';

            this.logger.log(
                `${prefijo} Consultando recibo ${codigoLimpio}`,
            );

            const recibos = await this.dataSource.query(
                `
                SELECT
                    r.id,
                    r.codigo,
                    r.referencia,
                    r.fecha,
                    r.hora,
                    r.observacion,
                    r.total,
                    r.total_capital,
                    r.total_interes,
                    r.total_mora,
                    r.pago,
                    r.saldo_actual_venta,
                    r.saldo_nuevo,
                    r.user_id,
                    r.caja_id,
                    r.sucursal_id,

                    v.cod AS venta_codigo,

                    c.nombres AS cliente_nombres,
                    c.apellidos AS cliente_apellidos,

                    s.nombre AS sucursal_nombre,
                    s.abreviatura AS sucursal_abreviatura,
                    s.cod AS sucursal_cod,
                    s.direccion_completa AS sucursal_direccion,
                    s.telefono AS sucursal_telefono,
                    s.email AS sucursal_email

                FROM recibos r

                LEFT JOIN ventas v
                    ON v.id = r.venta_id

                LEFT JOIN clientes c
                    ON c.id = v.cliente_id

                LEFT JOIN sucursals s
                    ON s.id = COALESCE(
                        v.sucursal_id,
                        r.sucursal_id
                    )

                WHERE r.codigo = ?
                LIMIT 1
                `,
                [codigoLimpio],
            ) as ReciboRow[];

            const recibo = recibos[0];

            if (!recibo) {
                throw new NotFoundException(
                    `No existe el recibo ${codigoLimpio}.`,
                );
            }

            this.logger.log(
                `${prefijo} Recibo encontrado: ` +
                JSON.stringify({
                    codigo: recibo.codigo,
                    venta: recibo.venta_codigo,
                    sucursal: recibo.sucursal_nombre,
                    total: recibo.total,
                }),
            );

            // ========================================
            // 2. CONSULTAR CUERPO DEL RECIBO
            // ========================================

            paso = 'CONSULTAR_MOVIMIENTOS';

            const movimientos = await this.dataSource.query(
                `
                SELECT
                    cr.tipo,
                    cr.detalle,
                    cr.total_capital,
                    cr.total_interes,
                    cr.total_mora,
                    cr.total,
                    pc.detalle AS cuota_detalle,
                    pc.fecha_pago AS cuota_fecha_pago

                FROM cuerpo_recibos cr

                LEFT JOIN pagos_contratos pc
                    ON pc.id = cr.pagos_contrato_id

                WHERE cr.recibo_id = ?

                ORDER BY cr.id ASC
                `,
                [recibo.id],
            ) as MovimientoRow[];

            // ========================================
            // 3. CALCULAR IMPORTES DESDE CUERPO
            // ========================================

            let totalCapital = 0;
            let totalMora = 0;
            let totalMovimientos = 0;

            const movimientosPdf: DatosReciboPdf['movimientos'] = [];

            for (const movimiento of movimientos) {
                const tipo = Number(movimiento.tipo);
                const monto = this.numero(movimiento.total);

                totalMovimientos += monto;

                // Tipo 1 = Capital
                if (tipo === 1) {
                    totalCapital += monto;
                }

                // Tipo 2 = Mora
                if (tipo === 2) {
                    totalMora += monto;
                }

                const detalleOriginal = this.texto(
                    movimiento.detalle,
                    this.texto(
                        movimiento.cuota_detalle,
                        'Pago',
                    ),
                );

                // Evitar duplicar el prefijo si el
                // detalle ya lo contiene.
                const concepto = tipo === 2
                    ? (
                        /^\[Mora\]\s*-\s*/i.test(detalleOriginal)
                            ? detalleOriginal
                            : `[Mora] - ${detalleOriginal}`
                    )
                    : detalleOriginal;

                movimientosPdf.push({
                    concepto,
                    monto,
                });
            }

            totalCapital = this.redondear(totalCapital);
            totalMora = this.redondear(totalMora);
            totalMovimientos = this.redondear(totalMovimientos);

            const totalRecibo = this.redondear(
                this.numero(recibo.total),
            );

            // El total registrado en recibos debe
            // coincidir con la suma de cuerpo_recibos.
            if (
                Math.round(totalMovimientos * 100) !==
                Math.round(totalRecibo * 100)
            ) {
                this.logger.error(
                    `${prefijo} Diferencia de importes: ` +
                    JSON.stringify({
                        total_recibo: totalRecibo,
                        total_cuerpo: totalMovimientos,
                    }),
                );

                throw new InternalServerErrorException(
                    'El total del recibo no coincide con sus movimientos.',
                );
            }

            this.logger.log(
                `${prefijo} Desglose calculado: ` +
                JSON.stringify({
                    movimientos: movimientos.length,
                    capital: totalCapital,
                    mora: totalMora,
                    total: totalMovimientos,
                }),
            );

            // ========================================
            // 4. CONSULTAR CAJA Y USUARIO
            // ========================================

            paso = 'CONSULTAR_CAJA_USUARIO';

            const [cajaRegistro, usuarioRegistro] =
                await Promise.all([
                    this.consultarRegistro(
                        'cajas',
                        recibo.caja_id,
                    ),
                    this.consultarRegistro(
                        'users',
                        recibo.user_id,
                    ),
                ]);

            const cajaCodigo = this.valorDe(
                cajaRegistro,
                ['codigo', 'cod', 'abreviatura'],
            );

            const usuarioNombre = this.valorDe(
                usuarioRegistro,
                ['usuario', 'username', 'name', 'nombre'],
            );

            if (!cajaCodigo) {
                this.logger.warn(
                    `${prefijo} No se encontró código visible de caja.`,
                );
            }

            if (!usuarioNombre) {
                this.logger.warn(
                    `${prefijo} No se encontró nombre visible de usuario.`,
                );
            }

            // ========================================
            // 5. CONSULTAR TOKEN QR EXISTENTE
            // ========================================

            paso = 'CONSULTAR_QR';

            const qrToken = await this.buscarQr(
                recibo.codigo,
            );

            // ========================================
            // 6. PREPARAR DATOS DEL PDF
            // ========================================

            paso = 'PREPARAR_DATOS';

            const cliente = [
                recibo.cliente_nombres,
                recibo.cliente_apellidos,
            ].filter(Boolean).join(' ').trim();

            const sucursalCodigo =
                recibo.sucursal_abreviatura ||
                (recibo.sucursal_cod !== null
                    ? String(recibo.sucursal_cod)
                    : '');

            const datosPdf: DatosReciboPdf = {
                empresa: 'SURTIDORA LAÍNEZ',

                sucursal: this.texto(
                    recibo.sucursal_nombre,
                    'SUCURSAL NO DISPONIBLE',
                ),

                sucursal_codigo: sucursalCodigo,

                sucursal_direccion: this.texto(
                    recibo.sucursal_direccion,
                ),

                sucursal_telefono: this.texto(
                    recibo.sucursal_telefono,
                ),

                sucursal_email: this.texto(
                    recibo.sucursal_email,
                ),

                codigo: recibo.codigo,
                referencia: recibo.referencia,

                fecha: this.fechaTexto(recibo.fecha),
                hora: this.texto(recibo.hora),

                caja: cajaCodigo ||
                    (recibo.caja_id
                        ? `ID ${recibo.caja_id}`
                        : 'NO DISPONIBLE'),

                usuario: usuarioNombre ||
                    `ID ${recibo.user_id}`,

                cuenta: this.texto(
                    recibo.venta_codigo,
                ),

                cliente,
                comentario: recibo.observacion,
                pago: recibo.pago,

                // Detalle preparado según tipo.
                movimientos: movimientosPdf,

                // Total de todos los movimientos.
                total: totalMovimientos,

                // Suma de tipo = 1.
                total_capital: totalCapital,

                // Suma de tipo = 2.
                total_mora: totalMora,

                // Se conserva para compatibilidad
                // con otros usos de la interfaz.
                total_interes: this.numero(
                    recibo.total_interes,
                ),

                saldo_anterior: this.numero(
                    recibo.saldo_actual_venta,
                ),

                saldo_nuevo: this.numero(
                    recibo.saldo_nuevo,
                ),

                monto_letras: this.letras(
                    totalMovimientos,
                ),

                qr_token: qrToken,
            };

            // ========================================
            // 7. GENERAR PDF
            // ========================================

            paso = 'GENERAR_PDF';

            this.logger.log(
                `${prefijo} Generando PDF: ` +
                JSON.stringify({
                    codigo: datosPdf.codigo,
                    sucursal: datosPdf.sucursal,
                    caja: datosPdf.caja,
                    usuario: datosPdf.usuario,
                    movimientos: datosPdf.movimientos.length,
                    total: datosPdf.total,
                    capital: datosPdf.total_capital,
                    mora: datosPdf.total_mora,
                    qr_presente: Boolean(datosPdf.qr_token),
                }),
            );

            const pdf = await this.reciboPdfService.generar(
                datosPdf,
            );

            // ========================================
            // 8. VALIDAR PDF
            // ========================================

            paso = 'VALIDAR_PDF';

            if (
                pdf.subarray(0, 5).toString('ascii') !==
                '%PDF-'
            ) {
                throw new InternalServerErrorException(
                    'El archivo generado no es un PDF válido.',
                );
            }

            this.logger.log(
                `${prefijo} PDF generado correctamente. ` +
                `Bytes=${pdf.length}, ` +
                `Duración=${Date.now() - inicio}ms`,
            );

            return pdf;

        } catch (error: unknown) {
            const err = error instanceof Error
                ? error
                : new Error(String(error));

            this.logger.error(
                `${prefijo} ERROR en ${paso}: ${err.message}`,
                err.stack,
            );

            throw error;

        } finally {
            this.logger.log(
                `${prefijo} FIN ${Date.now() - inicio}ms`,
            );
        }
    }
}


import { BadRequestException, Injectable } from '@nestjs/common';

export interface ArticuloVentaContadoDto {
    articulo_id: string | number;
    cantidad: number | string;
    precio: number | string;
    total: number | string;
    remision_articulo_id?: string | number | null;
    serie_fabricante?: string | null;
    estado_articulo_id?: string | number | null;
    combo_id?: string | number | null;
    is_remision?: number | boolean;
    es_regalia?: boolean;
}

export interface CrearVentaContadoDto {
    operacion_id: string;
    cliente_slug: string;
    forma_pago_id: string | number;
    observacion?: string;
    sub_total: number | string;
    impuesto: number | string;
    total: number | string;
    monto_recibido?: number | string;
    articulos: ArticuloVentaContadoDto[];
}

export interface ArticuloVentaContadoValidado {
    articulo_id: string;
    cantidad: number;
    precio: string;
    total: string;
    remision_articulo_id: string | null;
    serie_fabricante: string | null;
    estado_articulo_id: string | null;
    combo_id: string | null;
    is_remision: 0 | 1;
    es_regalia: boolean;
}

export interface VentaContadoValidada {
    operacion_id: string;
    cliente_slug: string;
    forma_pago_id: string;
    observacion: string;
    sub_total: string;
    impuesto: string;
    total: string;
    monto_recibido: string | null;
    cambio: string;
    articulos: ArticuloVentaContadoValidado[];
}

@Injectable()
export class CajaVentaContadoValidacionService {
    private validarId(valor: unknown, campo: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${campo} no es válido.`);
        return id;
    }

    private validarIdOpcional(valor: unknown, campo: string): string | null {
        if (valor === undefined || valor === null || valor === '') return null;
        return this.validarId(valor, campo);
    }

    private centavos(valor: unknown, campo: string): number {
        const texto = String(valor ?? '').trim();
        const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(texto);

        if (!match) {
            throw new BadRequestException(`${campo} debe ser un importe válido con máximo dos decimales.`);
        }

        const entero = Number(match[1]);
        const decimales = Number((match[2] ?? '').padEnd(2, '0'));
        const resultado = entero * 100 + decimales;

        if (!Number.isSafeInteger(resultado)) {
            throw new BadRequestException(`${campo} excede el importe permitido.`);
        }

        return resultado;
    }

    private dinero(centavos: number): string {
        if (!Number.isSafeInteger(centavos) || centavos < 0) {
            throw new BadRequestException('Se detectó un importe monetario inválido.');
        }

        return `${Math.floor(centavos / 100)}.${String(centavos % 100).padStart(2, '0')}`;
    }

    private validarCantidad(valor: unknown, campo: string): number {
        const cantidad = Number(valor);

        if (
            (typeof valor !== 'string' && typeof valor !== 'number') ||
            String(valor).trim() === '' ||
            !/^[1-9]\d*$/.test(String(valor)) ||
            !Number.isSafeInteger(cantidad)
        ) {
            throw new BadRequestException(`${campo} debe ser un número entero mayor que cero.`);
        }

        return cantidad;
    }

    validar(datos: CrearVentaContadoDto): VentaContadoValidada {
        if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
            throw new BadRequestException('Debes proporcionar los datos de la venta.');
        }

        if (
            typeof datos.operacion_id !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(datos.operacion_id)
        ) {
            throw new BadRequestException('Debes proporcionar un UUID de operación válido.');
        }

        if (typeof datos.cliente_slug !== 'string' || !datos.cliente_slug.trim()) {
            throw new BadRequestException('Debes seleccionar un cliente válido.');
        }

        const formaPagoId = this.validarId(datos.forma_pago_id, 'La forma de pago');

        if (
            datos.observacion !== undefined &&
            (typeof datos.observacion !== 'string' || datos.observacion.length > 400)
        ) {
            throw new BadRequestException('La observación no puede superar los 400 caracteres.');
        }

        if (!Array.isArray(datos.articulos) || datos.articulos.length === 0) {
            throw new BadRequestException('La venta debe contener al menos un artículo.');
        }

        const articulos: ArticuloVentaContadoValidado[] = [];
        const remisionesUtilizadas = new Set<string>();
        let totalCalculado = 0;

        for (const [indice, articulo] of datos.articulos.entries()) {
            const numero = indice + 1;

            if (!articulo || typeof articulo !== 'object' || Array.isArray(articulo)) {
                throw new BadRequestException(`El artículo ${numero} no es válido.`);
            }

            const articuloId = this.validarId(articulo.articulo_id, `articulo_id del artículo ${numero}`);
            const cantidad = this.validarCantidad(articulo.cantidad, `La cantidad del artículo ${numero}`);
            const precioCentavos = this.centavos(articulo.precio, `El precio del artículo ${numero}`);
            const totalCentavos = this.centavos(articulo.total, `El total del artículo ${numero}`);

            if (!Number.isSafeInteger(cantidad * precioCentavos) || cantidad * precioCentavos !== totalCentavos) {
                throw new BadRequestException(`El total del artículo ${numero} no coincide con su cantidad y precio.`);
            }

            if (articulo.es_regalia !== undefined && typeof articulo.es_regalia !== 'boolean') {
                throw new BadRequestException(`La regalía del artículo ${numero} no es válida.`);
            }

            const esRegalia = articulo.es_regalia === true;

            if (esRegalia && (precioCentavos !== 0 || totalCentavos !== 0)) {
                throw new BadRequestException(`El artículo ${numero} es una regalía y debe tener precio y total cero.`);
            }

            if (!esRegalia && precioCentavos === 0) {
                throw new BadRequestException(`El artículo ${numero} tiene precio cero y no está identificado como regalía.`);
            }

            if (
                articulo.is_remision !== undefined &&
                articulo.is_remision !== 0 &&
                articulo.is_remision !== 1 &&
                articulo.is_remision !== false &&
                articulo.is_remision !== true
            ) {
                throw new BadRequestException(`is_remision del artículo ${numero} no es válido.`);
            }

            const remisionArticuloId = this.validarIdOpcional(
                articulo.remision_articulo_id,
                `remision_articulo_id del artículo ${numero}`,
            );

            if (remisionArticuloId) {
                if (remisionesUtilizadas.has(remisionArticuloId)) {
                    throw new BadRequestException(`La remisión ${remisionArticuloId} está repetida en la venta.`);
                }
                remisionesUtilizadas.add(remisionArticuloId);
            }

            if (
                articulo.serie_fabricante !== undefined &&
                articulo.serie_fabricante !== null &&
                typeof articulo.serie_fabricante !== 'string'
            ) {
                throw new BadRequestException(`La serie del fabricante del artículo ${numero} no es válida.`);
            }

            const serieFabricante = articulo.serie_fabricante?.trim() || null;

            if (serieFabricante && serieFabricante.length > 100) {
                throw new BadRequestException(`La serie del fabricante del artículo ${numero} supera los 100 caracteres.`);
            }

            if ((remisionArticuloId || serieFabricante) && cantidad !== 1) {
                throw new BadRequestException(
                    `El artículo ${numero} debe enviarse por unidad cuando tiene remisión o serie del fabricante.`,
                );
            }

            const estadoArticuloId = this.validarIdOpcional(
                articulo.estado_articulo_id,
                `estado_articulo_id del artículo ${numero}`,
            );

            if (!estadoArticuloId || !['1', '2', '3'].includes(estadoArticuloId)) {
                throw new BadRequestException(`El estado del artículo ${numero} es obligatorio y debe permitir la venta.`);
            }

            const comboId = this.validarIdOpcional(
                articulo.combo_id,
                `combo_id del artículo ${numero}`,
            );

            const isRemision: 0 | 1 = 1;

            totalCalculado += totalCentavos;

            if (!Number.isSafeInteger(totalCalculado)) {
                throw new BadRequestException('El total de la venta excede el límite permitido.');
            }

            articulos.push({
                articulo_id: articuloId,
                cantidad,
                precio: this.dinero(precioCentavos),
                total: this.dinero(totalCentavos),
                remision_articulo_id: remisionArticuloId,
                serie_fabricante: serieFabricante,
                estado_articulo_id: estadoArticuloId,
                combo_id: comboId,
                is_remision: isRemision,
                es_regalia: esRegalia,
            });
        }

        const totalVenta = this.centavos(datos.total, 'El total de la venta');
        const subTotal = this.centavos(datos.sub_total, 'El subtotal');
        const impuesto = this.centavos(datos.impuesto, 'El impuesto');

        if (totalVenta <= 0) {
            throw new BadRequestException('El total de la venta debe ser mayor que cero.');
        }

        if (totalCalculado !== totalVenta) {
            throw new BadRequestException('El total de la venta no coincide con la suma de los artículos.');
        }

        if (!Number.isSafeInteger(subTotal + impuesto) || subTotal + impuesto !== totalVenta) {
            throw new BadRequestException('El subtotal más el impuesto debe coincidir con el total de la venta.');
        }

        // El backend valida el monto recibido y calcula el cambio.
        // La identificación de efectivo se confirmará contra la tabla forma_pagos.
        const montoRecibido = datos.monto_recibido === undefined || datos.monto_recibido === null
            ? null
            : this.centavos(datos.monto_recibido, 'El monto recibido');

        if (montoRecibido !== null && montoRecibido < totalVenta) {
            throw new BadRequestException('El monto recibido no puede ser menor que el total de la venta.');
        }

        const cambio = montoRecibido === null ? 0 : montoRecibido - totalVenta;

        return {
            operacion_id: datos.operacion_id.toLowerCase(),
            cliente_slug: datos.cliente_slug.trim(),
            forma_pago_id: formaPagoId,
            observacion: datos.observacion ?? '',
            sub_total: this.dinero(subTotal),
            impuesto: this.dinero(impuesto),
            total: this.dinero(totalVenta),
            monto_recibido: montoRecibido === null ? null : this.dinero(montoRecibido),
            cambio: this.dinero(cambio),
            articulos,
        };
    }
}

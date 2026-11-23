
import {
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { PostearCuentaDirectrizService} from "../caja/postear_cuenta/postear-cuenta-directriz.service.js";

export interface SolicitarNumeracionFacturaDto {
    sucursal_id: string | number;
    tipo: number;
}

export interface NumeracionFactura {
    directriz_id: string;
    sucursal_id: string;
    tipo: number;
    contador_inicial: string;
    contador_final: string;
    contador_anterior: number;
    contador_actual: number;
    codigo_post_contador: string | null;
    cai: string | null;
    codigo: string;
}

@Injectable()
export class FacturacionVentasService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly directrizService: PostearCuentaDirectrizService,
    ) {}

    private validarId(valor: string | number, nombre: string): string {
        const id = String(valor ?? '').trim();
        if (!/^[1-9]\d*$/.test(id)) throw new BadRequestException(`${nombre} no es válido.`);
        return id;
    }

    async reservarNumeracion(
        dto: SolicitarNumeracionFacturaDto,
        manager: EntityManager,
    ): Promise<NumeracionFactura> {
        if (!manager?.queryRunner?.isTransactionActive) {
            throw new BadRequestException(
                'La numeración de facturas debe reservarse dentro de una transacción activa.',
            );
        }

        const sucursalId = this.validarId(dto.sucursal_id, 'La sucursal');
        const tipo = Number(dto.tipo);

        if (!Number.isSafeInteger(tipo) || tipo <= 0) {
            throw new BadRequestException('El tipo de directriz no es válido.');
        }

        // Reutilizar la lógica existente de Postear cuentas.
        // Este método debe consultar y bloquear la directriz.
        const directriz = await this.directrizService.prepararCodigo(
            manager,
            sucursalId,
            tipo,
        );

        // La actualización se realiza con el mismo método
        // utilizado al generar los recibos de Postear cuentas.
        await this.directrizService.actualizarContador(manager, directriz);

        return {
            directriz_id: String(directriz.directriz_id),
            sucursal_id: sucursalId,
            tipo,
            contador_inicial: String(directriz.contador_inicial),
            contador_final: String(directriz.contador_final),
            contador_anterior: Number(directriz.contador_actual),
            contador_actual: Number(directriz.contador_actual) + 1,
            codigo_post_contador: directriz.codigo_post_contador ?? null,
            cai: directriz.cai ?? null,
            codigo: directriz.codigo,
        };
    }

    async reservarNumeracionEnTransaccion(
        dto: SolicitarNumeracionFacturaDto,
    ): Promise<NumeracionFactura> {
        return this.dataSource.transaction(manager =>
            this.reservarNumeracion(dto, manager),
        );
    }
}

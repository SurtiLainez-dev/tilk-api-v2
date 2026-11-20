
import { Injectable } from '@nestjs/common';
import { CarritosConsultasService } from './carritos-consultas.service.js';

@Injectable()
export class CarritosService {
    constructor(
        private readonly consultas: CarritosConsultasService,
    ) {}

    buscarAbiertos(clienteSlug: string, sucursalId: string) {
        return this.consultas.buscarAbiertos(
            clienteSlug,
            sucursalId,
        );
    }

    obtenerDetalle(carritoSlug: string, sucursalId: string) {
        return this.consultas.obtenerDetalle(
            carritoSlug,
            sucursalId,
        );
    }
}

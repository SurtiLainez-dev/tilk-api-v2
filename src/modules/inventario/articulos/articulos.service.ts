
import { Injectable } from '@nestjs/common';
import { ArticulosSeriesService } from './articulos-series.service.js';

@Injectable()
export class ArticulosService {
    constructor(
        private readonly seriesService: ArticulosSeriesService,
    ) {}

    obtenerSeriesDisponibles(sucursalId: string) {
        return this.seriesService.consultarDisponibles(
            sucursalId,
        );
    }
}

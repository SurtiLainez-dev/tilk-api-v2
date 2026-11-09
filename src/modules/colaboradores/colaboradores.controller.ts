
import {
    Controller,
    Get,
    Param,
    Query,
    BadRequestException,
} from '@nestjs/common';

import { ColaboradoresService } from './colaboradores.service.js';

@Controller('colaboradores')
export class ColaboradoresController {
    constructor(
        private readonly colaboradoresService:
            ColaboradoresService,
    ) {}

    // ==========================================
    // COLABORADORES ACTIVOS DE UNA SUCURSAL
    // ==========================================
    // GET /api/colaboradores/sucursal/:codigo/activos
    // ==========================================
    @Get('sucursal/:codigo/activos')
    async listarActivosPorSucursal(
        @Param('codigo') codigo: string,
        @Query('con_usuario') conUsuario?: string,
    ) {
        if (!codigo?.trim()) {
            throw new BadRequestException(
                'Debes proporcionar el código de la sucursal.',
            );
        }

        const soloConUsuarioActivo =
            conUsuario !== 'false';

        return this.colaboradoresService
            .listarActivosPorSucursal(
                codigo,
                soloConUsuarioActivo,
            );
    }

    // ==========================================
    // COLABORADORES CON USUARIO ACTIVO
    // ==========================================
    // GET /api/colaboradores/sucursal/:codigo/usuarios-activos
    // ==========================================
    @Get('sucursal/:codigo/usuarios-activos')
    async listarConUsuarioActivo(
        @Param('codigo') codigo: string,
    ) {
        return this.colaboradoresService
            .listarConUsuarioActivo(codigo);
    }
    @Get('sucursal-id/:id/usuarios-activos')
    async listarUsuariosActivosPorSucursalId(
        @Param('id') sucursalId: string,
    ) {
        return this.colaboradoresService
            .listarConUsuarioActivoPorSucursalId(sucursalId);
    }
}

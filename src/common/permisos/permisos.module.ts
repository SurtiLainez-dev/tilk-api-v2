import { Module } from '@nestjs/common';


import { PermisosService } from './permisos.service.js';

@Module({
    providers: [
        PermisosService,
    ],
    exports: [
        PermisosService,
    ],
})
export class PermisosModule {}
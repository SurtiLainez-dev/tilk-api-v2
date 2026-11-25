import { Module, forwardRef } from '@nestjs/common';

import { DocumentosController } from './documentos.controller.js';
import { DocumentosService } from './documentos.service.js';
import { ReciboPdfService } from './caja/recibo-pdf.service.js';
import { DocumentosMultipartService } from './documentos-multipart.service.js';
import { CajaAnticiposPdfService } from './caja/caja-anticipos-pdf.service.js';
import { FacturaPdfService } from './caja/factura-pdf.service.js';
import { CajaCierresPdfService } from './caja/caja-cierres-pdf.service.js';

import { AuthModule } from '../../auth/auth.module.js';
import { CajaModule } from '../caja/caja.module.js';
import { PermisosModule } from '../../common/permisos/permisos.module.js';

@Module({
    imports: [
        AuthModule,
        PermisosModule,
        forwardRef(() => CajaModule),
    ],

    controllers: [
        DocumentosController,
    ],

    providers: [
        DocumentosService,
        ReciboPdfService,
        DocumentosMultipartService,
        CajaAnticiposPdfService,
        FacturaPdfService,
        CajaCierresPdfService,
    ],

    exports: [
        DocumentosService,
        ReciboPdfService,
        DocumentosMultipartService,
        CajaCierresPdfService,
    ],
})
export class DocumentosModule {}
import { Module } from '@nestjs/common';

import { DocumentosController } from './documentos.controller.js';
import { DocumentosService } from './documentos.service.js';
import { ReciboPdfService } from './caja/recibo-pdf.service.js';
import { DocumentosMultipartService } from './documentos-multipart.service.js';
import { CajaAnticiposPdfService} from "./caja/caja-anticipos-pdf.service.js";

import { AuthModule } from '../../auth/auth.module.js';

@Module({
    imports: [
        AuthModule,
    ],
    controllers: [
        DocumentosController,
    ],
    providers: [
        DocumentosService,
        ReciboPdfService,
        DocumentosMultipartService,
        CajaAnticiposPdfService
    ],
    exports: [
        DocumentosService,
        ReciboPdfService,
        DocumentosMultipartService,
    ],
})
export class DocumentosModule {}

import { Module } from '@nestjs/common';
import { AuthDocumentosService } from './auth-documentos.service.js';
import { VerificarDocumentosQrService } from './verificar-documentos-qr.service.js';

@Module({
    providers: [AuthDocumentosService, VerificarDocumentosQrService],
    exports: [AuthDocumentosService, VerificarDocumentosQrService],
})
export class AuthDocumentosModule {}

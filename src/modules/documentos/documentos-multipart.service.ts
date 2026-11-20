
import {
    BadRequestException,
    Injectable,
    PayloadTooLargeException,
    UnsupportedMediaTypeException,
} from '@nestjs/common';

export interface OpcionesDocumentoMultipart {
    campoArchivo?: string;
    tipoPermitido?: string;
    maxMB?: number;
}

export interface DocumentoMultipartProcesado {
    campos: Record<string, string>;
    archivo: Buffer;
}

@Injectable()
export class DocumentosMultipartService {

    procesarArchivo(
        archivo: Express.Multer.File | undefined,
        opciones: OpcionesDocumentoMultipart = {},
    ): Buffer {

        const maxMB = opciones.maxMB ?? 15;
        const tipoPermitido =
            opciones.tipoPermitido ?? 'application/pdf';

        if (!archivo) {
            throw new BadRequestException(
                'Debes adjuntar un comprobante PDF.',
            );
        }

        if (!archivo.buffer || archivo.buffer.length === 0) {
            throw new BadRequestException(
                'El archivo recibido está vacío.',
            );
        }

        const maxBytes = maxMB * 1024 * 1024;

        if (archivo.buffer.length > maxBytes) {
            throw new PayloadTooLargeException(
                `El archivo no puede superar ${maxMB} MB.`,
            );
        }

        if (archivo.mimetype !== tipoPermitido) {
            throw new UnsupportedMediaTypeException(
                'Solo se permiten archivos PDF.',
            );
        }

        // Verificar la firma real del documento PDF.
        const firma = archivo.buffer
            .subarray(0, 5)
            .toString('ascii');

        if (firma !== '%PDF-') {
            throw new BadRequestException(
                'El archivo no contiene un PDF válido.',
            );
        }

        return archivo.buffer;
    }

    procesar(
        archivo: Express.Multer.File | undefined,
        campos: Record<string, string>,
        opciones: OpcionesDocumentoMultipart = {},
    ): DocumentoMultipartProcesado {

        return {
            campos,
            archivo: this.procesarArchivo(
                archivo,
                opciones,
            ),
        };
    }
}

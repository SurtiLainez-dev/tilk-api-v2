import { Controller, Post, Body, Headers, Req, BadRequestException, UnauthorizedException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';

import type { AuthenticatedRequest } from '../../../auth/guards/passport-auth.guard.js';

import { CajaAnticiposService } from './caja-anticipos.service.js';
import { CrearAnticipoDto } from './dto/crear-anticipo.dto.js';

@Controller('caja/anticipos')
export class CajaAnticiposController {

    constructor(
        private readonly anticiposService: CajaAnticiposService,
    ) {}

    // ==========================================
    // REGISTRAR ANTICIPO
    // ==========================================

    @Post('registrar')
    @UseInterceptors(
        FileInterceptor('archivo', {
            limits: {
                fileSize: 15 * 1024 * 1024,
                files: 1,
            },
        }),
    )
    async registrar(
        @Req() request: AuthenticatedRequest,
        @Headers('x-caja-token') token: string,
        @Body() body: unknown,
        @UploadedFile() archivo?: Express.Multer.File,
    ) {

        // 1. Validar usuario autenticado.

        if (!request.user?.id) {
            throw new UnauthorizedException('No se pudo identificar al usuario autenticado.');
        }

        const userId = String(request.user.id);

        // 2. Validar token de caja.

        if (typeof token !== 'string' || !token.trim()) {
            throw new UnauthorizedException('No se recibió el token de sesión de caja.');
        }

        // 3. Validar cuerpo de la petición.

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new BadRequestException('Los datos del anticipo no son válidos.');
        }

        const datos = { ...body } as Record<string, unknown>;

        // 4. Normalizar campos.

        if (typeof datos.monto === 'number') {
            datos.monto = String(datos.monto);
        }

        if (typeof datos.forma_pago_id === 'number') {
            datos.forma_pago_id = String(datos.forma_pago_id);
        }

        const dto = plainToInstance(CrearAnticipoDto, datos);

        // 5. Validar DTO.

        try {

            await validateOrReject(dto, {
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
            });

        } catch (error) {

            if (Array.isArray(error)) {

                const mensajes = (error as ValidationError[]).flatMap(
                    registro => Object.values(registro.constraints ?? {}),
                );

                throw new BadRequestException(
                    mensajes.length ? mensajes : ['Los datos del anticipo no son válidos.'],
                );
            }

            throw error;
        }

        // 6. Validar documento adjunto opcional.
        // Pendiente conectar el almacenamiento en Spaces.
        // Evitar registrar el anticipo perdiendo su comprobante.

        if (archivo) {
            throw new BadRequestException(
                'El almacenamiento de documentos para anticipos todavía no está habilitado.',
            );
        }

        // 7. Procesar operación.

        return this.anticiposService.registrar(dto, token.trim(), userId);
    }
}
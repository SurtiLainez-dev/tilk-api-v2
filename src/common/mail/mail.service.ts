
import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';


@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly configService: ConfigService,
    ) {}

    async enviarCorreo(
        destinatario: string,
        asunto: string,
        contenidoHtml: string,
    ): Promise<void> {
        const host =
            this.configService.getOrThrow<string>('MAIL_HOST');

        const port = Number(
            this.configService.get<string>('MAIL_PORT', '587'),
        );

        const secureValue =
            this.configService.get<string>('MAIL_SECURE');

        const secure =
            secureValue === undefined
                ? port === 465
                : secureValue.toLowerCase() === 'true';

        const user =
            this.configService.get<string>('MAIL_USER') ||
            this.configService.getOrThrow<string>('MAIL_USERNAME');

        const password =
            this.configService.getOrThrow<string>('MAIL_PASSWORD');

        const fromAddress =
            this.configService.getOrThrow<string>(
                'MAIL_FROM_ADDRESS',
            );

        const fromName =
            this.configService.get<string>(
                'MAIL_FROM_NAME',
                'TILK',
            );

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            requireTLS: !secure,

            auth: {
                user,
                pass: password,
            },

            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
        });

        try {
            this.logger.log(
                `Iniciando envío SMTP hacia ${destinatario}`,
            );

            this.logger.log(
                `Servidor SMTP: ${host}:${port} | TLS: ${
                    secure ? 'SSL/TLS' : 'STARTTLS'
                }`,
            );

            const resultado = await transporter.sendMail({
                from: {
                    name: fromName,
                    address: fromAddress,
                },
                to: destinatario,
                subject: asunto,
                html: contenidoHtml,
            });

            this.logger.log('========== RESULTADO SMTP ==========');

            this.logger.log(
                `Message ID: ${resultado.messageId}`,
            );

            this.logger.log(
                `Destinatarios aceptados: ${JSON.stringify(
                    resultado.accepted,
                )}`,
            );

            this.logger.log(
                `Destinatarios rechazados: ${JSON.stringify(
                    resultado.rejected,
                )}`,
            );

            this.logger.log(
                `Destinatarios pendientes: ${JSON.stringify(
                    resultado.pending ?? [],
                )}`,
            );

            this.logger.log(
                `Respuesta SMTP: ${resultado.response ?? 'Sin respuesta'}`,
            );

            this.logger.log('====================================');

            const aceptados = (resultado.accepted ?? []).map(
                (email) => String(email).toLowerCase(),
            );

            if (
                !aceptados.includes(destinatario.trim().toLowerCase())
            ) {
                throw new Error(
                    'El servidor SMTP no aceptó el destinatario.',
                );
            }

            this.logger.log(
                'El servidor SMTP aceptó el correo para su entrega.',
            );
        } catch (error) {
            this.logger.error(
                'Error al enviar correo electrónico',
                error instanceof Error
                    ? error.stack
                    : String(error),
            );

            throw new InternalServerErrorException(
                'No fue posible enviar el correo electrónico',
            );
        } finally {
            transporter.close();
        }
    }


    async enviarNuevoPinCaja(
        email: string,
        pin: string,
        codigoCaja: string,
    ): Promise<void> {
        const ruta = join(
            process.cwd(),
            'dist',
            'common',
            'mail',
            'templates',
            'caja-pin.html',
        );

        const plantilla = await readFile(ruta, 'utf8');

        const html = plantilla
            .replaceAll('{{PIN}}', pin)
            .replaceAll('{{CAJA}}', codigoCaja);

        await this.enviarCorreo(
            email,
            'Surtidora Lainez | Nuevo PIN de Caja',
            html,
        );
    }
}

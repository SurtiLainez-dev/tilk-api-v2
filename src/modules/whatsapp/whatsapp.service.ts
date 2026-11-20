import {
    Injectable,
    Logger,
} from '@nestjs/common';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(
        WhatsappService.name,
    );

    async procesarWebhook(
        payload: Record<string, unknown>,
    ) {
        const evento = payload.event;

        this.logger.log(
            `Evento recibido de Chatwoot: ${evento}`,
        );

        if (evento === 'message_created') {
            this.logger.log('Nuevo evento de mensaje recibido');
        }

        return {
            success: true,
            received: true,
            event: evento ?? null,
        };
    }
}
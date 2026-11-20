import {
    Injectable,
    Logger,
    ServiceUnavailableException,
    InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatwootService {

    private readonly logger = new Logger(ChatwootService.name);

    constructor(
        private readonly configService: ConfigService,
    ) {}

    private async request<T>(
        path: string,
        method = 'GET',
        body?: Record<string, unknown>,
    ): Promise<T> {

        const baseUrl = this.configService
            .getOrThrow<string>('CHATWOOT_BASE_URL')
            .replace(/\/+$/, '');

        const token = this.configService
            .getOrThrow<string>('CHATWOOT_API_TOKEN');

        let response: Response;

        try {
            response = await fetch(`${baseUrl}${path}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'api_access_token': token,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(15000),
            });
        } catch {
            this.logger.error('No se pudo conectar con Chatwoot');

            throw new ServiceUnavailableException(
                'No se pudo establecer conexión con Chatwoot',
            );
        }

        if (!response.ok) {

            this.logger.error(
                `Chatwoot respondió con HTTP ${response.status}`,
            );

            throw new InternalServerErrorException(
                `Error de Chatwoot: HTTP ${response.status}`,
            );
        }

        return await response.json() as T;
    }

    private obtenerAccountId(): string {
        return this.configService
            .getOrThrow<string>('CHATWOOT_ACCOUNT_ID');
    }

    async comprobarConexion() {

        const accountId = this.obtenerAccountId();

        await this.request<unknown>(
            `/api/v1/accounts/${accountId}/inboxes`,
        );

        return {
            success: true,
            service: 'Chatwoot',
            status: 'CONNECTED',
            accountId,
            timestamp: new Date().toISOString(),
        };
    }

    async obtenerBandejas() {

        const accountId = this.obtenerAccountId();

        return this.request(
            `/api/v1/accounts/${accountId}/inboxes`,
        );
    }

    async enviarMensaje(
        conversationId: number,
        contenido: string,
    ) {

        const accountId = this.obtenerAccountId();

        return this.request(
            `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
            'POST',
            {
                content: contenido,
                message_type: 'outgoing',
                private: false,
                content_type: 'text',
            },
        );
    }
}
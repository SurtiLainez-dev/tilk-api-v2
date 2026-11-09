
import {
    Injectable,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedUser {
    id: number;
    usuario: string;
}

interface LaravelAuthResponse {
    success?: boolean;
    valid?: boolean;
    data?: {
        id?: number | string;
        usuario?: string;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
    ) {}

    async validarToken(token: string): Promise<AuthenticatedUser> {
        const baseUrl = this.configService.get<string>('LARAVEL_API_URL');
        const serviceKey = this.configService.get<string>('TILK_SERVICE_KEY');

        if (!baseUrl || !serviceKey) {
            throw new ServiceUnavailableException(
                'La autenticación no está configurada',
            );
        }

        const url = `${baseUrl.replace(/\/+$/, '')}/auth/validar-token`;

        let response: Response;

        try {
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'X-Tilk-Service-Key': serviceKey,
                },
                signal: AbortSignal.timeout(5000),
                redirect: 'error',
            });
        } catch {
            throw new ServiceUnavailableException(
                'No se pudo conectar con el servidor de autenticación',
            );
        }

        if (response.status === 401 || response.status === 403) {
            throw new UnauthorizedException(
                'Token inválido, vencido o revocado',
            );
        }

        if (!response.ok) {
            throw new ServiceUnavailableException(
                'El servidor de autenticación no está disponible',
            );
        }

        let result: LaravelAuthResponse;

        try {
            result = (await response.json()) as LaravelAuthResponse;
        } catch {
            throw new ServiceUnavailableException(
                'Respuesta inválida del servidor de autenticación',
            );
        }

        const userId = result.data?.id;
        const usuario = result.data?.usuario;

        if (
            result.success !== true ||
            result.valid !== true ||
            !/^[1-9]\d*$/.test(String(userId ?? '')) ||
            typeof usuario !== 'string' ||
            usuario.length === 0
        ) {
            throw new UnauthorizedException(
                'No se pudo validar la identidad del usuario',
            );
        }

        return {
            id: Number(userId),
            usuario,
        };
    }
}


import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
    S3Client,
    HeadBucketCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class SpacesService implements OnModuleInit {
    private readonly logger = new Logger(SpacesService.name);

    private readonly cliente: S3Client;
    private readonly bucket: string;
    private readonly region: string;
    private readonly endpoint: string;

    constructor(
        private readonly configService: ConfigService,
    ) {
        this.region = this.configService.get<string>(
            'DO_SPACES_REGION',
            'nyc3',
        );

        this.endpoint = this.configService.get<string>(
            'DO_SPACES_ENDPOINT',
            'https://nyc3.digitaloceanspaces.com',
        );

        this.bucket = this.configService.get<string>(
            'DO_SPACES_BUCKET',
            '',
        );

        const accessKeyId = this.configService.get<string>(
            'DO_SPACES_KEY',
            '',
        );

        const secretAccessKey = this.configService.get<string>(
            'DO_SPACES_SECRET',
            '',
        );

        if (!this.bucket || !accessKeyId || !secretAccessKey) {
            throw new Error(
                'DigitalOcean Spaces: faltan credenciales o bucket en .env',
            );
        }

        this.cliente = new S3Client({
            region: this.region,
            endpoint: this.endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: false,
            maxAttempts: 3,
        });
    }

    async onModuleInit(): Promise<void> {
        await this.verificarConexion();
    }

    async verificarConexion(): Promise<boolean> {
        try {
            await this.cliente.send(
                new HeadBucketCommand({
                    Bucket: this.bucket,
                }),
            );

            this.logger.log(
                'Conexión a DigitalOcean Spaces exitosa',
            );

            this.logger.log(`Bucket: ${this.bucket}`);
            this.logger.log(`Región: ${this.region}`);

            return true;
        } catch (error: unknown) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : 'Error desconocido';

            this.logger.error(
                `Error de conexión a DigitalOcean Spaces: ${mensaje}`,
            );

            throw error;
        }
    }

    getCliente(): S3Client {
        return this.cliente;
    }

    getBucket(): string {
        return this.bucket;
    }

    getRegion(): string {
        return this.region;
    }

    getEndpoint(): string {
        return this.endpoint;
    }

    /**
     * Genera una URL temporal para visualizar un
     * documento privado almacenado en Spaces.
     *
     * No verifica permisos de usuario.
     * La autenticación corresponde al controlador.
     */
    async generarUrlFirmada(
        path: string,
        duracion: number = 300,
    ): Promise<string> {
        if (typeof path !== 'string' || !path.trim()) {
            throw new BadRequestException(
                'Debes proporcionar la ruta del documento.',
            );
        }

        if (
            !Number.isInteger(duracion) ||
            duracion < 1 ||
            duracion > 3600
        ) {
            throw new BadRequestException(
                'La duración debe estar entre 1 y 3600 segundos.',
            );
        }

        const key = path.trim();

        // Aceptamos únicamente claves internas del bucket.
        // No aceptamos URLs completas ni rutas absolutas.
        if (
            key.length > 1024 ||
            key.startsWith('/') ||
            key.includes('\\') ||
            key.includes('?') ||
            key.includes('#') ||
            /[\u0000-\u001f\u007f]/.test(key) ||
            /^[a-z][a-z0-9+.-]*:\/\//i.test(key) ||
            key.split('/').some(
                segmento =>
                    !segmento ||
                    segmento === '.' ||
                    segmento === '..',
            )
        ) {
            throw new BadRequestException(
                'La ruta del documento no es válida.',
            );
        }

        const comando = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ResponseContentDisposition: 'inline',
        });

        return getSignedUrl(this.cliente, comando, {
            expiresIn: duracion,
        });
    }
}

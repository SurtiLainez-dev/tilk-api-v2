
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class WhatsappAuthGuard implements CanActivate {

    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const recibido = request.headers['x-whatsapp-secret'];
        const configurado = this.configService.get<string>('WHATSAPP_WEBHOOK_SECRET');

        if (!configurado || typeof recibido !== 'string') throw new UnauthorizedException('Integración WhatsApp no autorizada');

        const a = Buffer.from(recibido);
        const b = Buffer.from(configurado);

        if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Integración WhatsApp no autorizada');

        return true;
    }
}

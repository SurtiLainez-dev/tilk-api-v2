
import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import {AuthService, type AuthenticatedUser,} from '../auth.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

export interface AuthenticatedRequest extends Request {user: AuthenticatedUser;}

@Injectable()
export class PassportAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly authService: AuthService,
    ) {}

    async canActivate(context: ExecutionContext,): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();

        const authorization = request.headers.authorization;

        if (!authorization) {
            throw new UnauthorizedException(
                'No se proporcionó un token de autenticación',
            );
        }

        const match = /^Bearer ([^\s]+)$/i.exec(authorization);

        if (!match) {
            throw new UnauthorizedException(
                'El token debe enviarse como Bearer',
            );
        }

        const token = match[1];

        request.user = await this.authService.validarToken(token);

        return true;
    }
}


import { Controller, Get, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from './guards/passport-auth.guard.js';

@Controller('auth')
export class AuthController {
    @Get('me')
    obtenerUsuario(@Req() request: AuthenticatedRequest) {
        return {
            success: true,
            message: 'Usuario autenticado correctamente',
            data: request.user,
        };
    }
}

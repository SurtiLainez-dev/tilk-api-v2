
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PassportAuthGuard } from './guards/passport-auth.guard.js';

@Module({
    imports: [ConfigModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: PassportAuthGuard,
        },
    ],
    exports: [AuthService],
})
export class AuthModule {}

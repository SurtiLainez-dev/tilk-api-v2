
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';

import { AuthModule } from './auth/auth.module.js';
import { CajaModule } from './modules/caja/caja.module.js';
import { MailModule } from './common/mail/mail.module.js';
import { ColaboradoresModule } from './modules/colaboradores/colaboradores.module.js';
import { CuentasModule} from "./modules/cuentas/cuentas.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    DatabaseModule,
    AuthModule,
    CajaModule,
    MailModule,
    ColaboradoresModule,
    CuentasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

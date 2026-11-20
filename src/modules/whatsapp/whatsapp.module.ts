
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WhatsappController } from './whatsapp.controller.js';
import { WhatsappService } from './whatsapp.service.js';
import { ChatwootService } from './services/chatwoot.service.js';
import { WhatsappClientesService } from './services/whatsapp-clientes.service.js';
import { WhatsappAuthGuard } from './guards/whatsapp-auth.guard.js';

import {
    Clientes,
    VentasEntity,
    PagosContratos,
    FacturasContados,
    Articulos,
    Marcas,
} from '../../database/entities/index.js';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            Clientes,
            VentasEntity,
            PagosContratos,
            FacturasContados,
            Articulos,
            Marcas,
        ]),
    ],
    controllers: [WhatsappController],
    providers: [
        WhatsappService,
        ChatwootService,
        WhatsappClientesService,
        WhatsappAuthGuard,
    ],
    exports: [
        WhatsappService,
        ChatwootService,
        WhatsappClientesService,
    ],
})
export class WhatsappModule {}

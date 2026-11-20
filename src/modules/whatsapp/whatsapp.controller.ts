
import { Body, Controller, Get, Post, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator.js';
import { WhatsappAuth } from './decorators/whatsapp-auth.decorator.js';
import { WhatsappAuthGuard } from './guards/whatsapp-auth.guard.js';

import { WhatsappService } from './whatsapp.service.js';
import { ChatwootService } from './services/chatwoot.service.js';
import { WhatsappClientesService } from './services/whatsapp-clientes.service.js';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly chatwootService: ChatwootService,
        private readonly whatsappClientesService: WhatsappClientesService,
    ) {}

    @Public()
    @Get('health')
    @ApiOperation({ summary: 'Estado del módulo WhatsApp' })
    health() {
        return {
            success: true,
            module: 'WhatsApp',
            status: 'ONLINE',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('chatwoot/health')
    @ApiOperation({ summary: 'Comprobar conexión con Chatwoot' })
    async comprobarChatwoot() {
        return this.chatwootService.comprobarConexion();
    }

    @WhatsappAuth()
    @UseGuards(WhatsappAuthGuard)
    @Post('webhook/chatwoot')
    @HttpCode(200)
    @ApiOperation({ summary: 'Recepción de eventos de Chatwoot' })
    async recibirWebhook(@Body() payload: Record<string, unknown>) {
        return this.whatsappService.procesarWebhook(payload);
    }

    @Post('clientes/identificar')
    @HttpCode(200)
    @ApiOperation({ summary: 'Identificar cliente por identidad o pasaporte' })
    async identificarCliente(@Body('identidad') identidad: string) {
        return this.whatsappClientesService.identificarCliente(identidad);
    }

    @Get('clientes/:slug/cuentas')
    @ApiOperation({ summary: 'Consultar cuentas activas del cliente' })
    async obtenerCuentasActivas(@Param('slug') slug: string) {
        return this.whatsappClientesService.obtenerCuentasActivas(slug);
    }
}

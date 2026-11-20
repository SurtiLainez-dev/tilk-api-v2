
import { SetMetadata } from '@nestjs/common';

export const WHATSAPP_AUTH_KEY = 'whatsapp_auth';

export const WhatsappAuth = () => SetMetadata(WHATSAPP_AUTH_KEY, true);

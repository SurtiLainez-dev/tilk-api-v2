
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SpacesService } from './spaces.service.js';

@Global()
@Module({
    imports: [
        ConfigModule,
    ],

    providers: [
        SpacesService,
    ],

    exports: [
        SpacesService,
    ],
})
export class SpacesModule {}

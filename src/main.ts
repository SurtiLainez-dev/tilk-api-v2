import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TILK API v2')
      .setDescription('Backend modular de TILK con NestJS')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT || 3001);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://app.tilk.cloud',
      'https://test.app.tilk.cloud',
      'https://app.tilk.cloud',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Tilk-Client',
      'X-Frontend-Path',
    ],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');

  console.log(`TILK API v2 iniciada en puerto ${port}`);
}

bootstrap();

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import 'dotenv/config';
import * as morgan from 'morgan';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const basePath = 'api/photos';

  if (process.env.LOG_REQUESTS === 'true') {
    app.use(morgan.default('combined'));
  }

  app.useGlobalPipes(new ZodValidationPipe());
  app.enableCors({
    origin: process.env.ORIGIN_ALLOWED,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v'
  });
  app.setGlobalPrefix(basePath);

  const config = new DocumentBuilder()
    .setTitle('Photo Service API')
    .setDescription('API de gerenciamento de álbuns e fotos')
    .setVersion(process.env.npm_package_version as string)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();

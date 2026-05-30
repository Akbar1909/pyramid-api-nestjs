import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { FilesService } from './files/files.service';

function parseCorsOrigins(): string[] | boolean {
  const raw = process.env.FRONTEND_ORIGIN?.trim();
  if (!raw) {
    return [
      // `pyramid-app-next` public site (see package.json `next dev -p 3002`)
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'http://localhost:4001',
      'http://127.0.0.1:4001',
    ];
  }
  if (raw === '*') {
    return true;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pyramid College API')
    .setDescription('Authentication, profiles, and college services')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the `accessToken` from login or register.',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const files = app.get(FilesService);
  await files.ensureUploadDir();
  app.useStaticAssets(files.getUploadRoot(), {
    prefix: `${files.getPublicPrefix()}/`,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

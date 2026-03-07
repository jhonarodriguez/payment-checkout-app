import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Payment Checkout API')
    .setDescription(
      'API REST para procesamiento de pagos con tarjeta de crédito. ' +
        'Gestiona productos, transacciones, clientes y entregas.',
    )
    .setVersion('1.0')
    .addBearerAuth() // para documentar endpoints que requieran auth (futuro)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════╗
  ║  🚀 Backend corriendo en puerto ${port}   ║
  ║  📚 Swagger: http://localhost:${port}/api/docs ║
  ╚════════════════════════════════════════╝
  `);
}
bootstrap();

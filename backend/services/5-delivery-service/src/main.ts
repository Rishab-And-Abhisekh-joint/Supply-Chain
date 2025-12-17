import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://supply-chain-orcin.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Delivery Service API')
    .setDescription(
      'Manages last-mile delivery routes, drivers, vehicles, and real-time tracking. ' +
      'Provides endpoints for route optimization, driver assignment, stop management, ' +
      'proof of delivery, and delivery analytics.',
    )
    .setVersion('2.0')
    .addTag('delivery', 'Route, stop, and driver management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3004;
  await app.listen(port);
  
  console.log(`🚚 Delivery Service is running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation: ${await app.getUrl()}/api-docs`);
}

bootstrap();
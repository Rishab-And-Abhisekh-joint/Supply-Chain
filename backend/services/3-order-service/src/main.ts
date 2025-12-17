import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('OrderService');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3000',         // Local Next.js dev
      'http://localhost:5173',         // Local Vite dev
      'https://supply-chain-orcin.vercel.app', // Production frontend
      process.env.FRONTEND_URL,        // Custom frontend URL
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Order Service API')
    .setDescription(`
      Order Service manages the entire order lifecycle for the Supply Chain Platform.
      
      ## Features
      - Create and manage orders
      - Track order status through fulfillment
      - Process payments
      - Integration with Inventory, Delivery, and Notification services
      
      ## Order Status Flow
      PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
      
      ## Environment Variables
      - PORT: Service port (default: 3002)
      - DATABASE_URL: PostgreSQL connection string
      - INVENTORY_SERVICE_URL: URL to inventory service
      - DELIVERY_SERVICE_URL: URL to delivery service
      - NOTIFICATION_SERVICE_URL: URL to notification service
    `)
    .setVersion('1.0')
    .addTag('orders', 'Order management endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  
  logger.log(`🚀 Order Service is running on: ${await app.getUrl()}`);
  logger.log(`📚 Swagger documentation: ${await app.getUrl()}/api-docs`);
}

bootstrap();
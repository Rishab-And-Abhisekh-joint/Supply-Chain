import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation for all incoming requests
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set up Swagger for API documentation
  const config = new DocumentBuilder()
    .setTitle('Inventory Service API')
    .setDescription('Manages product catalog and stock levels.')
    .setVersion('1.0')
    .addTag('inventory')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Inventory Service is running on: ${await app.getUrl()}`);
}
bootstrap(); 
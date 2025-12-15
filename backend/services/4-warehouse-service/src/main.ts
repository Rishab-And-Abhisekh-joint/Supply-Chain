import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Warehouse Service API')
    .setDescription('Manages internal warehouse operations like receiving and picking.')
    .setVersion('1.0')
    .addTag('warehouse')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Warehouse Service is running on: ${await app.getUrl()}`);
}
bootstrap(); 
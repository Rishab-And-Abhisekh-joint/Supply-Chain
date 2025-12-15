import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryModule } from './delivery/delivery.module';
import { DeliveryRoute } from './delivery/entities/delivery-route.entity';
import { RouteStop } from './delivery/entities/route-stop.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [DeliveryRoute, RouteStop],
        // Enable synchronize to auto-create tables
        // For initial deployment, this creates the missing tables
        synchronize: true,
        // SSL configuration required for Render PostgreSQL
        ssl: configService.get<string>('NODE_ENV') === 'production' 
          ? { rejectUnauthorized: false } 
          : false,
      }),
    }),
    DeliveryModule,
  ],
})
export class AppModule {}
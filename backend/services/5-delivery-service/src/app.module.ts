import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeliveryModule } from './delivery/delivery.module';
import { DeliveryRoute } from './delivery/entities/delivery-route.entity';
import { RouteStop } from './delivery/entities/route-stop.entity';
import { Driver } from './delivery/entities/driver.entity';
import { Vehicle } from './delivery/entities/vehicle.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        // If DATABASE_URL is provided (Render deployment), use it
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [DeliveryRoute, RouteStop, Driver, Vehicle],
            synchronize: false, // Always false in production
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            logging: !isProduction,
          };
        }

        // Otherwise, use individual settings (local development)
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'delivery_db'),
          entities: [DeliveryRoute, RouteStop, Driver, Vehicle],
          synchronize: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          logging: !isProduction,
        };
      },
    }),
    DeliveryModule,
  ],
})
export class AppModule {}
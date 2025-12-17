import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WarehouseModule } from './warehouse/warehouse.module';
import { PickList } from './warehouse/entities/picklist.entity';
import { PickListItem } from './warehouse/entities/picklist-item.entity';
import { ReceivingRecord } from './warehouse/entities/receiving-record.entity';
import { ReceivingItem } from './warehouse/entities/receiving-item.entity';
import { WarehouseLocation } from './warehouse/entities/warehouse-location.entity';

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

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              PickList,
              PickListItem,
              ReceivingRecord,
              ReceivingItem,
              WarehouseLocation,
            ],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            ssl: configService.get<string>('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : false,
            logging: configService.get<string>('NODE_ENV') === 'development',
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'warehouse_db'),
          entities: [
            PickList,
            PickListItem,
            ReceivingRecord,
            ReceivingItem,
            WarehouseLocation,
          ],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          ssl: configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
    }),
    WarehouseModule,
  ],
})
export class AppModule {}

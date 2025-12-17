import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './notification/entities/notification.entity';
import { NotificationTemplate } from './notification/entities/notification-template.entity';
import { NotificationPreference } from './notification/entities/notification-preference.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [Notification, NotificationTemplate, NotificationPreference],
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
          database: configService.get<string>('DB_DATABASE', 'notification_db'),
          entities: [Notification, NotificationTemplate, NotificationPreference],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    NotificationModule,
  ],
})
export class AppModule {}
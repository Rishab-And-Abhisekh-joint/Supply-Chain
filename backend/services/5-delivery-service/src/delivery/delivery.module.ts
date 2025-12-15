import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { ConfigModule } from '@nestjs/config';
import { MappingService } from './integrations/mapping.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryRoute, RouteStop]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, MappingService],
})
export class DeliveryModule {} 
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';

import { DeliveryRoute } from './entities/delivery-route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Driver } from './entities/driver.entity';
import { Vehicle } from './entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryRoute,
      RouteStop,
      Driver,
      Vehicle,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';

import { PickList } from './entities/picklist.entity';
import { PickListItem } from './entities/picklist-item.entity';
import { ReceivingRecord } from './entities/receiving-record.entity';
import { ReceivingItem } from './entities/receiving-item.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PickList,
      PickListItem,
      ReceivingRecord,
      ReceivingItem,
      WarehouseLocation,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { PickList } from './entities/picklist.entity';
import { PickListItem } from './entities/picklist-item.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([PickList, PickListItem]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
})
export class WarehouseModule {} 
import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateReceivingDto } from './dto/create-receiving.dto';
import { CreatePickListDto } from './dto/create-picklist.dto';
import { UpdatePickListStatusDto } from './dto/update-picklist-status.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('warehouse')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post('receiving')
  @ApiOperation({ summary: 'Process a new receiving of stock from a supplier' })
  @ApiResponse({ status: 201, description: 'Stock successfully received and updated.'})
  receiveStock(@Body() createReceivingDto: CreateReceivingDto) {
    return this.warehouseService.receiveStock(createReceivingDto);
  }

  @Post('picklists')
  @ApiOperation({ summary: 'Generate a new picklist for an order' })
  @ApiResponse({ status: 201, description: 'Picklist successfully generated.'})
  generatePickList(@Body() createPickListDto: CreatePickListDto) {
    return this.warehouseService.generatePickList(createPickListDto);
  }

  @Get('picklists')
  @ApiOperation({ summary: 'Retrieve all picklists' })
  getAllPickLists() {
    return this.warehouseService.findAllPickLists();
  }

  @Get('picklists/:id')
  @ApiOperation({ summary: 'Retrieve a single picklist by ID' })
  getPickListById(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.findPickListById(id);
  }
  
  @Patch('picklists/:id/status')
  @ApiOperation({ summary: 'Update the status of a picklist' })
  updatePickListStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePickListStatusDto: UpdatePickListStatusDto,
  ) {
    return this.warehouseService.updatePickListStatus(id, updatePickListStatusDto.status);
  }
} 
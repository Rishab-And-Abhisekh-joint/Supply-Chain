// =============================================================================
// FILE: src/inventory/inventory.controller.ts
// ACTION: MODIFY - Add new endpoints
// =============================================================================

import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, ParseUUIDPipe, HttpStatus, HttpCode 
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { ReleaseStockDto } from './dto/release-stock.dto';
import { CommitStockDto } from './dto/commit-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // === EXISTING ENDPOINTS ===

  @Get()
  findAll(
    @Query('locationId') locationId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll({ locationId, category, search });
  }

  @Get('product/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.inventoryService.create(createProductDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.inventoryService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(id);
  }

  // === NEW ENDPOINTS FOR FRONTEND ===

  @Get('low-stock')
  getLowStock(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStock(threshold);
  }

  @Post('reserve')
  @HttpCode(HttpStatus.OK)
  reserveStock(@Body() dto: ReserveStockDto) {
    return this.inventoryService.reserveStock(dto);
  }

  @Post('release')
  @HttpCode(HttpStatus.OK)
  releaseStock(@Body() dto: ReleaseStockDto) {
    return this.inventoryService.releaseStock(dto);
  }

  @Post('commit')
  @HttpCode(HttpStatus.OK)
  commitStock(@Body() dto: CommitStockDto) {
    return this.inventoryService.commitStock(dto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  transferStock(@Body() dto: TransferStockDto) {
    return this.inventoryService.transferStock(dto);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  adjustStock(@Body() body: { productId: string; locationId: string; quantity: number; reason: string }) {
    return this.inventoryService.adjustStock(body.productId, body.locationId, {
      quantity: body.quantity,
      reason: body.reason,
    });
  }

  @Get('movements/:productId')
  getMovementHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.inventoryService.getMovementHistory(productId, locationId);
  }
}
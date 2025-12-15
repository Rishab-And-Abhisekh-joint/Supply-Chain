import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { PickList, PickListStatus } from './entities/picklist.entity';
import { CreateReceivingDto } from './dto/create-receiving.dto';
import { CreatePickListDto } from './dto/create-picklist.dto';

@Injectable()
export class WarehouseService {
  private inventoryServiceUrl: string;

  constructor(
    @InjectRepository(PickList)
    private readonly pickListRepository: Repository<PickList>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL');
  }

  async receiveStock(createReceivingDto: CreateReceivingDto): Promise<any> {
    const results = [];
    for (const item of createReceivingDto.items) {
      try {
        const stockAdjustmentUrl = `${this.inventoryServiceUrl}/products/stock/${item.productId}`;
        const response = await firstValueFrom(
          this.httpService.patch(stockAdjustmentUrl, { quantity: item.quantity })
        );
        results.push(response.data);
      } catch (error) {
        console.error(`Failed to update stock for product ${item.productId}:`, error.response?.data || error.message);
        throw new BadRequestException(`Failed to receive stock for product ${item.productId}.`);
      }
    }
    // In a real app, you would also create a `ReceivingSlip` entity here.
    return { message: 'Stock successfully received.', details: results };
  }

  async generatePickList(createPickListDto: CreatePickListDto): Promise<PickList> {
    const newPickList = this.pickListRepository.create({
      orderId: createPickListDto.orderId,
      status: PickListStatus.PENDING,
      items: createPickListDto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        // In a real system, you'd fetch location from an inventory system
        location: `Aisle ${Math.floor(Math.random() * 10) + 1}, Shelf ${Math.floor(Math.random() * 5) + 1}`
      }))
    });

    return this.pickListRepository.save(newPickList);
  }

  findAllPickLists(): Promise<PickList[]> {
    return this.pickListRepository.find({ relations: ['items'] });
  }

  async findPickListById(id: string): Promise<PickList> {
    const picklist = await this.pickListRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!picklist) {
      throw new NotFoundException(`Picklist with ID "${id}" not found.`);
    }
    return picklist;
  }

  async updatePickListStatus(id: string, status: PickListStatus): Promise<PickList> {
    const picklist = await this.findPickListById(id);
    picklist.status = status;
    
    // Here you could trigger an event to notify the Order Service
    // that the order is ready for shipping.
    // e.g., this.messagingService.publish('picklist.completed', { orderId: picklist.orderId });

    return this.pickListRepository.save(picklist);
  }
} 
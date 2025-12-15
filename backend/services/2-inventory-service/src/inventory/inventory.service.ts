import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
// import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    // private readonly messagingService: MessagingService, // For event publishing
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(newProduct);
    // await this.messagingService.publish('product.created', savedProduct);
    return savedProduct;
  }

  findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.preload({
        id: id,
        ...updateProductDto,
    });
    if (!product) {
        throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return this.productRepository.save(product);
  }

  async adjustStock(id: string, adjustStockDto: AdjustStockDto): Promise<Product> {
    const product = await this.findOne(id);
    product.stock += adjustStockDto.quantity;
    
    // Add logic for low stock alerts
    if (product.stock <= product.reorderLevel) {
      console.log(`LOW STOCK ALERT for ${product.name}`);
      // await this.messagingService.publish('stock.low', { productId: product.id, stock: product.stock });
    }

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
} 
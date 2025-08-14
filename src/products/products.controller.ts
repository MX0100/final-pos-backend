import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  BatchReservationRequestDto,
  BatchReservationResponseDto,
} from './dto/batch-reservation.dto';
import { Product } from './product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  create(@Body() input: CreateProductDto): Promise<Product> {
    return this.productsService.create(input);
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product by id' })
  update(
    @Param('id') id: string,
    @Body() input: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product by id' })
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  // Stock adjustment endpoint to be called by other modules (decoupled contract)
  @Post(':id/adjust-stock/:delta')
  @ApiOperation({
    summary: 'Adjust stock by delta (can be negative or positive)',
  })
  adjustStock(
    @Param('id') id: string,
    @Param('delta') delta: string,
  ): Promise<Product> {
    return this.productsService.adjustStock(id, Number(delta));
  }

  // Atomic batch reservation endpoint for high-concurrency scenarios
  @Post('reservations:batch')
  @ApiOperation({
    summary: 'Atomic batch stock reservation with SELECT FOR UPDATE',
  })
  batchReservation(
    @Body() dto: BatchReservationRequestDto,
  ): Promise<BatchReservationResponseDto> {
    return this.productsService.batchReservation(dto);
  }
}

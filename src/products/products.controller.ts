import { Body, Controller, Delete, Get, Param, Post, Put, Query, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BatchReservationRequestDto, BatchReservationResponseDto } from '../shared/dto/index';
import { Product } from './product.entity';
import { DeleteResponseDto, SingleResourceResponseDto, PaginatedResponseDto, SimpleSuccessResponseDto } from '../shared/dto';
import { BatchCreateProductsResponseDto } from './dto/batch-create-products.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BatchCreateProductsDto } from './dto/batch-create-products.dto';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a single product',
    description: 'Create a single product with validation and error handling',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: SingleResourceResponseDto,
  })
  create(@Body() input: CreateProductDto): Promise<SingleResourceResponseDto<Product>> {
    return this.productsService.create(input);
  }

  @Post('batch')
  @ApiOperation({
    summary: 'Create multiple products in batch',
    description: 'Create multiple products at once with partial success support.',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch creation completed (check results for individual success/failure)',
    type: BatchCreateProductsResponseDto,
  })
  batchCreate(@Body() dto: BatchCreateProductsDto): Promise<BatchCreateProductsResponseDto> {
    return this.productsService.batchCreate(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with pagination and filtering by category',
    description: 'Get a paginated list of products with optional category filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: PaginatedResponseDto,
  })
  findAll(@Query() query: ProductQueryDto): Promise<PaginatedResponseDto<Product>> {
    return this.productsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Get all product categories',
    description: 'Get a list of all unique product categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: SimpleSuccessResponseDto,
  })
  getCategories(): Promise<SimpleSuccessResponseDto<string[]>> {
    return this.productsService.getCategories();
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Get product by id or name',
    description: 'Get a product by its ID or name. The system will first try to find by ID, then by name if not found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: SingleResourceResponseDto,
  })
  findOne(@Param('identifier') identifier: string): Promise<SingleResourceResponseDto<Product>> {
    return this.productsService.findOne(identifier);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product by id',
    description: 'Update product fields. All provided fields will be updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: SingleResourceResponseDto,
  })
  update(@Param('id') id: string, @Body() input: UpdateProductDto): Promise<SingleResourceResponseDto<Product>> {
    return this.productsService.update(id, input);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product by id',
    description: 'Delete product and clean up any cart references. Returns 404 if product not found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    type: DeleteResponseDto,
  })
  remove(@Param('id') id: string): Promise<DeleteResponseDto> {
    return this.productsService.remove(id);
  }

  @Post(':id/adjust-stock/:delta')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Adjust single product stock (Cart quantity adjustment)',
    description: 'Adjust stock quantity for a single product. Use positive values to increase, negative to decrease. This is a relative change operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully',
    type: SingleResourceResponseDto,
  })
  adjustStock(@Param('id') id: string, @Param('delta') delta: string): Promise<SingleResourceResponseDto<Product>> {
    return this.productsService.adjustStock(id, Number(delta));
  }

  @Post('reservations/batch')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Batch stock reservation (Cart operations)',
    description:
      'Reserve/adjust stock for multiple products in cart operations.\n\n' +
      'Use cases:\n' +
      '1. Add multiple products to cart\n' +
      '2. Modify existing cart items\n\n' +
      'Modes:\n- All-or-nothing: All reservations succeed or fail together\n' +
      '- Partial acceptance: Some reservations may fail while others succeed',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch stock reservation completed',
    type: BatchReservationResponseDto,
  })
  batchReservation(@Body() dto: BatchReservationRequestDto): Promise<BatchReservationResponseDto> {
    return this.productsService.batchReservation(dto);
  }
}

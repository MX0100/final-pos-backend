import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { PRODUCT_SERVICE } from './interfaces/product-service.port';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { HttpProductService } from './services/products-api-http.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem]), HttpModule],
  controllers: [CartsController],
  providers: [CartsService, HttpProductService, { provide: PRODUCT_SERVICE, useClass: HttpProductService }],
})
export class CartsModule {}

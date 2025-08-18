import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { HttpProductService } from './services/products-api-http.service';
import { PRODUCT_SERVICE } from './interfaces/product-service.port';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem]), HttpModule],
  controllers: [CartsController],
  providers: [CartsService, { provide: PRODUCT_SERVICE, useClass: HttpProductService }],
})
export class CartsModule {}

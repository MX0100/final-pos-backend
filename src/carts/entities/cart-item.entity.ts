import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cart } from './cart.entity';

@Entity({ name: 'cart_items' })
@Unique('uq_cart_item_product', ['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @ApiProperty({ type: () => Cart })
  cart!: Cart;

  @Column({ type: 'uuid' })
  @ApiProperty()
  cartId!: string;

  @Column({ type: 'uuid' })
  @ApiProperty({ description: 'Reference to products module id' })
  productId!: string;

  @Column({ type: 'int' })
  @ApiProperty()
  quantity!: number;
}

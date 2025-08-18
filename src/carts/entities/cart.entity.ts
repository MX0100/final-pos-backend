import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id!: string;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  @ApiProperty({ type: () => [CartItem] })
  items!: CartItem[];

  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'active',
  })
  @ApiProperty({
    description: 'Cart status',
    enum: ['active', 'expired', 'paid'],
    default: 'active',
    example: 'active',
  })
  status!: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cart expiry time (updatedAt + 15 minutes)',
    example: '2024-01-15T10:45:00.000Z',
  })
  expiresAt?: Date | null;
}

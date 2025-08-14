import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier of the product' })
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  @ApiProperty({ maxLength: 64 })
  name!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  @ApiProperty({ required: false, maxLength: 2048 })
  description?: string | null;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Base64 data URL (<1MB)', maxLength: 1500000 })
  image!: string;

  @Column({ type: 'numeric' })
  @ApiProperty({ description: 'Price as numeric value' })
  price!: string;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Stock cannot be negative' })
  stock!: number;
}

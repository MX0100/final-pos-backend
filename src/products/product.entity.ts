import { Column, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';
import { IsInt, Min } from 'class-validator';
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
  @IsInt()
  @Min(0)
  stock!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @ApiProperty({
    description: 'Product category',
    maxLength: 64,
    example: 'Electronics',
    required: false,
  })
  category?: string | null;

  @VersionColumn()
  @ApiProperty({
    description: 'Version number for optimistic locking',
    example: 1,
    readOnly: true,
  })
  version!: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    description: 'Product creation timestamp (ISO 8601 format)',
    readOnly: true,
    example: '2025-08-18T00:42:48.123Z',
  })
  createdAt!: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @ApiProperty({
    description: 'Product last update timestamp (ISO 8601 format)',
    readOnly: true,
    example: '2025-08-18T00:42:48.123Z',
  })
  updatedAt!: Date;
}

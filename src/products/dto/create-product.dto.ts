import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, Validate } from 'class-validator';
import { IsDataUrlUnder1MB } from '../../shared/validators/is-dataurl-under-1mb.validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @ApiProperty({ maxLength: 64 })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @ApiProperty({ required: false, maxLength: 2048 })
  description?: string;

  @IsString()
  @Validate(IsDataUrlUnder1MB)
  @ApiProperty({ description: 'Base64 data URL (<1MB)' })
  image!: string;

  @ApiProperty({ description: 'Price as numeric value' })
  @IsNumber()
  price!: number;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ApiProperty({ minimum: 0 })
  stock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiProperty({
    description: 'Product category',
    maxLength: 64,
    example: 'Electronics',
    required: false,
  })
  category?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty() image: string;
  @ApiProperty() price: string;
  @ApiProperty() stock: number;
  @ApiPropertyOptional({ nullable: true }) category?: string | null;
  @ApiProperty() version: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

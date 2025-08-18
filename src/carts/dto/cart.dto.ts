import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() cartId!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() quantity!: number;
}

export class CartDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['active', 'expired', 'paid'] }) status!: string;
  @ApiProperty({ type: String, nullable: true }) expiresAt!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiProperty({ type: () => [CartItemDto], required: false }) items?: CartItemDto[];
}

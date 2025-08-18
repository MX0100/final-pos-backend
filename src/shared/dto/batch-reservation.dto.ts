import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, IsString, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity delta (positive=reserve, negative=release)' })
  @IsInt()
  qtyDelta!: number;

  @ApiProperty({ description: 'Operation ID for tracking', required: false })
  @IsString()
  opId?: string;
}

export class BatchReservationRequestDto {
  @ApiProperty({ type: [ReservationItemDto], minItems: 1 })
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  @ArrayMinSize(1)
  items!: ReservationItemDto[];

  @ApiProperty({ description: 'All or nothing mode', default: false })
  @IsBoolean()
  allOrNothing?: boolean;
}

export class ReservationResultDto {
  @ApiProperty()
  productId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  qtyDelta!: number;

  @ApiProperty()
  opId?: string;

  @ApiProperty({ description: 'success | insufficient_stock | not_found' })
  status!: 'success' | 'insufficient_stock' | 'not_found';

  @ApiProperty()
  availableStock!: number;

  @ApiProperty({ required: false })
  error?: string;
}

export class BatchReservationResponseDto {
  @ApiProperty({ type: [ReservationResultDto] })
  results!: ReservationResultDto[];

  @ApiProperty()
  successCount!: number;

  @ApiProperty()
  errorCount!: number;
}

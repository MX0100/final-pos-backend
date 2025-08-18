import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({
    description: 'New quantity for the item (set to 0 to remove)',
    example: 3,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  quantity!: number;
}

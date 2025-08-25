import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuccessEnumValues } from '../enums/success.enum';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation result status',
    example: true,
    enum: SuccessEnumValues,
  })
  success!: boolean | 'partial';

  @ApiPropertyOptional({
    description: 'Response data payload',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Array of errors (only present when success is false or partial)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        target: { type: 'string' },
      },
    },
    example: undefined,
  })
  errors?: Array<{
    code: string;
    message: string;
    target: string;
  }>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: undefined,
    additionalProperties: true,
  })
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

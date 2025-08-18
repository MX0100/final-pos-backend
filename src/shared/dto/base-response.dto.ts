import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API response structure
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation result status',
    example: true,
    enum: [true, false, 'partial'],
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
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string', example: 'Field validation failed' },
        target: { type: 'string', example: 'field_name' },
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
    example: {
      timestamp: '2024-01-15T10:30:00.000Z',
      page: 1,
      limit: 10,
      total: 100,
    },
    additionalProperties: true,
  })
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

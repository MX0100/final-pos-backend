import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Single resource response (for create/update/get operations)
 */
export class SingleResourceResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation result status',
    example: true,
  })
  success!: true;

  @ApiProperty({
    description: 'The created/updated/retrieved resource',
  })
  data!: T;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Simple success response for basic operations like getting categories
 */
export class SimpleSuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation result status',
    example: true,
  })
  success!: true;

  @ApiProperty({
    description: 'Response data',
  })
  data!: T;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

/**
 * Delete operation response
 */
export class DeleteResponseDto {
  @ApiProperty({
    description: 'Operation result status',
    example: true,
  })
  success!: true;

  @ApiProperty({
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Resource deleted successfully' },
      deletedId: { type: 'string', example: 'uuid-string' },
    },
  })
  data!: {
    message: string;
    deletedId: string;
  };

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      timestamp: '2024-01-15T10:30:00.000Z',
    },
  })
  meta?: {
    timestamp?: string;
    [key: string]: any;
  };
}

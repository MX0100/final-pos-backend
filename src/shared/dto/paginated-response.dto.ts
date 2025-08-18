import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './base-response.dto';

/**
 * Paginated response for list endpoints
 */
export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  @ApiProperty({
    description: 'Paginated data array',
    type: 'array',
  })
  declare data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 10 },
      total: { type: 'number', example: 100 },
      totalPages: { type: 'number', example: 10 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false },
      timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
    },
  })
  declare meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    timestamp?: string;
    [key: string]: any;
  };
}

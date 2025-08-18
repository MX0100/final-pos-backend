import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from './base-response.dto';

/**
 * Batch operation response
 */
export class BatchOperationResponseDto<T = any> extends ApiResponseDto<{
  successful: T[];
  failed: Array<{ input: any; error: { code: string; message: string } }>;
}> {
  @ApiProperty({
    description: 'Batch operation results',
    type: 'object',
    properties: {
      successful: { type: 'array', description: 'Successfully processed items' },
      failed: {
        type: 'array',
        description: 'Failed items with error details',
        items: {
          type: 'object',
          properties: {
            input: { description: 'Original input data' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  declare data: {
    successful: T[];
    failed: Array<{ input: any; error: { code: string; message: string } }>;
  };

  @ApiProperty({
    description: 'Batch operation summary',
    type: 'object',
    properties: {
      total: { type: 'number', example: 10 },
      successful: { type: 'number', example: 8 },
      failed: { type: 'number', example: 2 },
      successRate: { type: 'number', example: 80 },
      timestamp: { type: 'string', format: 'date-time' },
    },
  })
  declare meta: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    timestamp: string;
    [key: string]: any;
  };
}

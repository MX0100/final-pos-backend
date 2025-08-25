import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as string | { message?: unknown };

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const responseMessage = (exceptionResponse as { message?: unknown }).message;
        if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (Array.isArray(responseMessage)) {
          message = responseMessage.join(', ');
        }
      }
    }

    this.logger.error(`${request.method} ${request.url} - ${status} - ${message}`);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error) {
      this.logger.error(exception.stack);
    }

    response.status(status).json({
      success: false,
      data: null,
      errors: [
        {
          code: this.getErrorCode(status),
          message,
          target: 'request',
        },
      ],
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: status,
      },
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      default:
        return status >= 500 ? 'INTERNAL_ERROR' : 'CLIENT_ERROR';
    }
  }
}

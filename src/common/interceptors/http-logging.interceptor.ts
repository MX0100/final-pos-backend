import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { method: string; url: string }>();
    const res = http.getResponse<{ statusCode: number }>();

    const method = req.method;
    const url = req.url;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`HTTP ${method} ${url} ${res.statusCode} ${duration}ms`);
      }),
      catchError((err: unknown) => {
        const duration = Date.now() - start;
        const error = err as { status?: number; message?: string };
        const status = error?.status ?? res.statusCode ?? 500;
        this.logger.error(`HTTP ${method} ${url} ${status} ${duration}ms - ${error?.message ?? 'Error'}`);
        throw err;
      }),
    );
  }
}

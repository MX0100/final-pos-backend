import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException, VersioningType } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'blob:'],
        },
      },
      hsts: true,
    }),
  );

  app.use(compression());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableShutdownHooks();

  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  const flattenValidationErrors = (errors: ValidationError[], parentPath = ''): Array<{ field: string; value: unknown; message: string }> => {
    const results: Array<{ field: string; value: unknown; message: string }> = [];
    for (const err of errors) {
      const isArrayIndex = /^\d+$/.test(err.property);
      const path = parentPath ? (isArrayIndex ? `${parentPath}[${err.property}]` : `${parentPath}.${err.property}`) : err.property;

      if (err.constraints && Object.keys(err.constraints).length > 0) {
        results.push({
          field: path,
          value: err.value as unknown,
          message: Object.values(err.constraints).join(', '),
        });
      }

      if (err.children && err.children.length > 0) {
        results.push(...flattenValidationErrors(err.children, path));
      }
    }
    return results;
  };

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const formattedErrors = flattenValidationErrors(errors);
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
          statusCode: 400,
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Final POS API')
    .setDescription('REST API for products and shopping carts with partial success support.')
    .setVersion('1.0.0')
    .addServer('/', 'API v1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

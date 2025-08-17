import { Controller, Get, HttpCode, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get('health')
  @ApiExcludeEndpoint()
  @HttpCode(200)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  health(): string {
    return 'OK';
  }
}

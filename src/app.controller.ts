import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getHello(): string {
    // Healthcheck route hidden from Swagger
    // This keeps Swagger focused on domain APIs.
    // Use /api/docs for API documentation UI.
    // Return a simple status message.
    // Comment kept concise as code is self-explanatory.
    // Enterprise-level English naming and comments follow throughout the codebase.
    // The app uses NestJS naming conventions.
    // (No sensitive info exposed.)
    return this.appService.getHello();
  }
}

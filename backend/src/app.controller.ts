import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'System health check',
    description: 'Returns server operational status, server timestamp, and local timezone (Asia/Seoul)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-09-27T14:30:00.000+09:00',
        timezone: 'Asia/Seoul',
      },
    },
  })
  getHealth(): { status: string; timestamp: string; timezone: string } {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ summary: 'Default ping endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }
}

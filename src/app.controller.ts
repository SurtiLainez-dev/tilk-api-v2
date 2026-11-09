
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Sistema')
@Controller()
export class AppController {

  @Get()
  @ApiOperation({
    summary: 'Información de TILK API v2',
  })
  getStatus() {
    return {
      success: true,
      application: 'TILK API v2',
      framework: 'NestJS',
      status: 'online',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @ApiOperation({
    summary: 'Estado del servidor',
  })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

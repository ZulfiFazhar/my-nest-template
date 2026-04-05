import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiResponse as IApiResponse,
  HealthCheckData,
} from '../../common/interfaces/api-response.interface';

@ApiTags('Health')
@Controller('api')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check with database connection' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  async check(): Promise<IApiResponse<HealthCheckData>> {
    const healthCheckResult = await this.healthService.checkHealth();

    const isDatabaseHealthy =
      healthCheckResult?.info?.database?.status === 'up';

    return {
      message: 'Health check successful',
      data: {
        status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
        database: isDatabaseHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    };
  }
}

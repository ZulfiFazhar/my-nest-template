import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth/decorators/public.decorator';
import { wrapResponse } from './common/utils/response.util';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Hello World endpoint' })
  @ApiResponse({ status: 200, description: 'Returns hello world message' })
  getHello() {
    return wrapResponse('Hello World!', {
      message: this.appService.getHello(),
    });
  }
}

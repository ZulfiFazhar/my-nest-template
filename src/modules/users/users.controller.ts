import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { wrapResponse, ResponseMessages } from '../../common/utils/response.util';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Get all users (User/Admin access)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async findAll() {
    const users = await this.usersService.findAll();
    // Return only safe user fields (no passwordHash, no TypeORM methods)
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      createdAt: user.createdAt,
    }));
    return wrapResponse(ResponseMessages.USERS_FETCHED, sanitizedUsers);
  }

  @Get('admin-only')
  @Roles('admin')
  @ApiOperation({ summary: 'Admin only endpoint' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async adminOnly() {
    return wrapResponse('Admin access granted', {
      message: 'This is only accessible by admins',
    });
  }
}

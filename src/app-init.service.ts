import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './modules/users/users.service';

@Injectable()
export class AppInitService implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    try {
      // Seed admin user on startup
      await this.usersService.seedAdmin();
      console.log('✅ Admin user seeded (if not exists)');
    } catch (error) {
      console.error('❌ Failed to seed admin user:', error);
    }
  }
}

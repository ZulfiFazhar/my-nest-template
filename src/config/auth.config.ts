import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || 'default-secret-change-in-production',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
}));

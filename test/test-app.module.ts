import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { AppInitService } from '../src/app-init.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { HealthModule } from '../src/modules/health/health.module';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { User } from '../src/modules/users/entities/user.entity';
import authConfig from '../src/config/auth.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true,
      logging: false,
    }),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppInitService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class TestAppModule {}

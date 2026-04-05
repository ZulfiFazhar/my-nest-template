import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TestAppModule } from './test-app.module';
import { ApiResponse } from '../src/common/interfaces/api-response.interface';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) should return Hello World in wrapped format', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    const body = response.body as ApiResponse<{ message: string }>;

    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('data');
    expect(body.message).toBe('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});

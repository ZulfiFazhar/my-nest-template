import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import {
  ApiResponse,
  HealthCheckData,
} from '../src/common/interfaces/api-response.interface';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api', () => {
    it('should return health check status', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer())
        .get('/api')
        .expect(200);
      const body = response.body as ApiResponse<HealthCheckData>;

      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('data');
      expect(body.message).toBe('Health check successful');
      expect(body.data).toHaveProperty('status');
      expect(body.data).toHaveProperty('database');
      expect(body.data).toHaveProperty('timestamp');
      expect(body.data).toHaveProperty('uptime');
      expect(['healthy', 'unhealthy']).toContain(body.data.status);
      expect(['connected', 'disconnected']).toContain(body.data.database);
    });
  });

  describe('GET /', () => {
    it('should return hello world', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const response = await request(app.getHttpServer()).get('/').expect(200);
      const body = response.body as ApiResponse<{ message: string }>;

      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('data');
      expect(body.message).toBe('Hello World!');
    });
  });
});

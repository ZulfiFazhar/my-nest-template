import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module';
import { ApiResponse } from '../src/common/interfaces/api-response.interface';

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    createdAt: string;
  };
  tokens: {
    accessToken: string;
  };
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    createdAt: string;
  };
  tokens: {
    accessToken: string;
  };
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  roles: string[];
  createdAt: string;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User',
          })
          .expect(201);

      const body = response.body as ApiResponse<RegisterResponse>;

      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('data');
      expect(body.message).toBe('User registered successfully');
      expect(body.data).toHaveProperty('user');
      expect(body.data).toHaveProperty('tokens');
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user.email).toBe('testuser@example.com');
      expect(body.data.user).not.toHaveProperty('passwordHash');
      expect(body.data.tokens).toHaveProperty('accessToken');
    });

    it('should return 409 when email already exists', async () => {
      // Register first time
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate User',
      });

      // Try to register again with same email
      const response = // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'duplicate@example.com',
            password: 'password123',
            name: 'Duplicate User',
          })
          .expect(409);

      const body = response.body as ApiResponse<unknown>;
      expect(body.message).toContain('Email already registered');
    });

    it('should return 400 when email is invalid', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 when password is too short', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'logintest@example.com',
        password: 'password123',
        name: 'Login Test User',
      });
    });

    it('should login with valid credentials', async () => {
      const response = // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'logintest@example.com',
            password: 'password123',
          })
          .expect(200);

      const body = response.body as ApiResponse<LoginResponse>;

      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('data');
      expect(body.message).toBe('Login successful');
      expect(body.data).toHaveProperty('tokens');
      expect(body.data.tokens).toHaveProperty('accessToken');
      expect(body.data.user.email).toBe('logintest@example.com');

      authToken = body.data.tokens.accessToken;
    });

    it('should return 401 with invalid credentials', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 when user does not exist', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 400 when email is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    beforeAll(async () => {
      // Register and login to get token
      const registerResponse = // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await request(app.getHttpServer()).post('/auth/register').send({
          email: 'metest@example.com',
          password: 'password123',
          name: 'Me Test User',
        });

      const body = registerResponse.body as ApiResponse<RegisterResponse>;
      authToken = body.data.tokens.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

      const body = response.body as ApiResponse<UserResponse>;

      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('data');
      expect(body.message).toBe('User fetched successfully');
      expect(body.data.email).toBe('metest@example.com');
      expect(body.data).not.toHaveProperty('passwordHash');
    });

    it('should return 401 without token', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

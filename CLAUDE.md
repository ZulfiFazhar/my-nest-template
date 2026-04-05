# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Development (watch mode)
npm run start:dev

# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# Unit tests
npm run test

# Unit tests (watch mode)
npm run test:watch

# Unit tests with coverage
npm run test:cov

# E2E tests (uses SQLite in-memory)
npm run test:e2e

# Run specific test file
npm run test -- path/to/file.spec.ts

# Run tests matching pattern
npm run test -- -t "pattern"
```

## Architecture

This is a NestJS (v11) TypeScript backend application using Node.js ESM modules (`module: nodenext`).

### API Structure

- **Base URL:** `http://localhost:3000/api`
- **Swagger Docs:** `http://localhost:3000/docs`
- **Health Check:** `GET /api` (returns `{message, data}` format)
- **Hello World:** `GET /` (root, non-prefixed)

### Module Structure

```
src/
├── main.ts                    # Bootstrap with Swagger, global pipes/interceptors
├── app.module.ts              # Root module: TypeORM, ConfigModule, all feature modules
├── app-init.service.ts        # Seeds admin user on startup
├── config/                    # Environment configuration
│   ├── auth.config.ts         # JWT_SECRET, JWT_EXPIRES_IN
│   └── database.config.ts     # PostgreSQL connection settings
├── common/
│   ├── interceptors/
│   │   └── transform-response.interceptor.ts  # Global response formatter
│   ├── interfaces/
│   │   └── api-response.interface.ts
│   └── utils/
│       └── response.util.ts   # wrapResponse() helper, ResponseMessages constants
└── modules/
    ├── auth/                  # Authentication module
    ├── users/                 # User management module
    └── health/                # Health check module
```

### Response Format Convention

All API responses follow a standardized format via `TransformResponseInterceptor`:

```json
{
  "message": "Success",
  "data": { ... }
}
```

Controllers use `wrapResponse()` from `src/common/utils/response.util.ts`:

```typescript
import { wrapResponse, ResponseMessages } from '../../common/utils/response.util';

@Controller('resource')
export class ResourceController {
  @Get()
  async findAll() {
    const data = await this.service.findAll();
    return wrapResponse(ResponseMessages.SUCCESS, data);
  }
}
```

### Authentication Flow

1. **Registration:** `POST /api/auth/register` → returns `{user, tokens}`
2. **Login:** `POST /api/auth/login` → returns `{user, tokens}`
3. **Protected Routes:** Use `@UseGuards(JwtAuthGuard)` or rely on global guard
4. **Public Routes:** Mark with `@Public()` decorator to bypass JWT
5. **Role-Based Access:** Use `@Roles('admin')` + `RolesGuard`
6. **Current User:** Inject with `@CurrentUser()` decorator

### Database (TypeORM + PostgreSQL)

- **Entity:** `src/modules/users/entities/user.entity.ts`
- **Auto-hash:** Passwords hashed via `@BeforeInsert` hook using bcrypt
- **Synchronize:** Enabled in dev (`DATABASE_SYNCHRONIZE=true`)
- **Pre-seeded:** Admin user created on startup (`admin@example.com` / `admin123`)

### Key Patterns

**Global Guards (in AuthModule):**
- `JwtAuthGuard` - Applied to all routes except `@Public()`
- `RolesGuard` - Checks `@Roles()` metadata

**Dependency Injection:**
- Services use constructor injection
- TypeORM repositories use `@InjectRepository(Entity)`

**Configuration:**
- Use `ConfigService` with `getOrThrow<string>('key')` for required values
- Config files in `src/config/` loaded via `ConfigModule.forRoot({ load: [...] })`

### Testing

**Unit Tests:**
- Services: Mock dependencies with Jest mocks
- Controllers: Mock services, test `wrapResponse` calls
- Use `Test.createTestingModule()` from `@nestjs/testing`

**E2E Tests:**
- Use `test/test-app.module.ts` with SQLite in-memory database
- Import `TestAppModule` instead of `AppModule`
- Use `supertest` for HTTP assertions

**Test Database:**
- E2E tests use SQLite (`:memory:`) instead of PostgreSQL
- See `test/test-app.module.ts` for test configuration

### Docker

Files created but require local Docker:
- `Dockerfile` - Multi-stage build (dev & production)
- `docker-compose.yml` - App + PostgreSQL + Adminer
- `docker-compose.test.yml` - For CI/CD testing

Run locally:
```bash
docker compose up -d
curl http://localhost:3000/api
curl http://localhost:3000/docs
```

### Environment Variables

Required in `.env`:
```bash
# JWT
JWT_ACCESS_SECRET=your-secret
JWT_ACCESS_EXPIRES_IN=15m

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=myid_db
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true

# Server
PORT=3000
```

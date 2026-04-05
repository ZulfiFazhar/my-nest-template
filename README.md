# My Nest Template

A production-ready NestJS starter template with authentication, PostgreSQL integration, Swagger documentation, and standardized API responses.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Password hashing with bcrypt
  - Protected routes with guards

- **Database**
  - PostgreSQL with TypeORM
  - Auto database synchronization (dev mode)
  - Entity-based architecture

- **API Documentation**
  - Swagger/OpenAPI integration
  - Bearer token authentication in Swagger UI
  - Request/response examples

- **Code Quality**
  - ESLint + Prettier
  - Standardized API response format
  - Global validation pipes
  - Transform interceptors

- **Testing**
  - Unit tests with Jest
  - E2E tests with Supertest
  - SQLite in-memory for E2E
  - Coverage reports

- **Docker Support**
  - Docker Compose for local development
  - Multi-stage Dockerfile
  - Adminer for database management

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Database | PostgreSQL 16 |
| ORM | TypeORM |
| Authentication | Passport + JWT |
| API Docs | Swagger/OpenAPI |
| Testing | Jest + Supertest |
| Package Manager | Bun |

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (or use Docker)
- [Bun](https://bun.sh/) 1.3+ (recommended) or npm
- [PostgreSQL](https://www.postgresql.org/) 16+ (or use Docker)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd my-nest-template
```

### 2. Install dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m

# Server Configuration
PORT=3000

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=myid_db

# TypeORM Configuration
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true
```

### 4. Start PostgreSQL

**Option A: Using Docker**

```bash
docker compose up -d postgres
```

**Option B: Local PostgreSQL**

Ensure PostgreSQL is running on port 5432.

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The application will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/api

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Documentation

### Swagger UI

Access interactive API documentation at `http://localhost:3000/docs`

Features:
- Try out endpoints directly in the browser
- Bearer token authentication
- Request/response schemas
- Role-based endpoint grouping

### Authentication

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Access protected endpoint:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Pre-seeded User

An admin user is automatically created on startup:
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Roles**: admin, user

### Response Format

All API responses follow a standardized format:

```json
{
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch

# Run specific file
npm run test -- auth.service.spec.ts

# Run tests matching pattern
npm run test -- -t "should return"
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e
```

E2E tests use SQLite in-memory database for speed and isolation.

### Test Coverage

Coverage reports are generated in `coverage/` directory.

Current coverage:
- Services: ~95%
- Controllers: ~100%
- Overall: ~53%

## Docker Usage

### Development with Docker Compose

```bash
# Start all services (app + PostgreSQL + Adminer)
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| app | 3000 | NestJS API |
| postgres | 5432 | PostgreSQL database |
| adminer | 8080 | Database management UI |

Access Adminer: http://localhost:8080
- **Server**: postgres
- **Username**: postgres
- **Password**: postgres
- **Database**: myid_db

### Building Docker Image

```bash
# Development build
docker build --target development -t my-nest-template:dev .

# Production build
docker build --target production -t my-nest-template:prod .
```

## Project Structure

```
my-nest-template/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app-init.service.ts        # Startup tasks (seed admin)
│   ├── config/
│   │   ├── auth.config.ts         # JWT configuration
│   │   └── database.config.ts     # Database configuration
│   ├── common/
│   │   ├── interceptors/
│   │   │   └── transform-response.interceptor.ts
│   │   ├── interfaces/
│   │   │   └── api-response.interface.ts
│   │   └── utils/
│   │       └── response.util.ts   # Response helpers
│   └── modules/
│       ├── auth/                  # Authentication module
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/
│       │   │   ├── login.dto.ts
│       │   │   └── register.dto.ts
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   └── roles.guard.ts
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts
│       │   └── decorators/
│       │       ├── current-user.decorator.ts
│       │       ├── public.decorator.ts
│       │       └── roles.decorator.ts
│       ├── users/                 # Users module
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── users.module.ts
│       │   └── entities/
│       │       └── user.entity.ts
│       └── health/                # Health check module
│           ├── health.controller.ts
│           ├── health.service.ts
│           └── health.module.ts
├── test/
│   ├── auth.e2e-spec.ts           # Auth E2E tests
│   ├── health.e2e-spec.ts         # Health E2E tests
│   ├── app.e2e-spec.ts            # App E2E tests
│   └── test-app.module.ts         # Test configuration
├── docker-compose.yml             # Docker Compose config
├── docker-compose.test.yml        # Test Docker Compose
├── Dockerfile                     # Multi-stage Dockerfile
├── .env                           # Environment variables
└── README.md                      # This file
```

## Key Features

### Authentication Flow

1. **Registration**: `POST /api/auth/register`
   - Validates email and password
   - Hashes password with bcrypt
   - Returns user data and JWT token

2. **Login**: `POST /api/auth/login`
   - Validates credentials
   - Returns JWT access token
   - Token expires based on `JWT_ACCESS_EXPIRES_IN`

3. **Protected Routes**: Automatic JWT validation
   - Use `@Public()` decorator to skip authentication
   - Use `@CurrentUser()` to access authenticated user

4. **Role-Based Access**: `@Roles('admin')`
   - Combine with `RolesGuard`
   - Multiple roles supported

### Database

**User Entity** (`src/modules/users/entities/user.entity.ts`):
- UUID primary key
- Email (unique)
- Password hash (bcrypt)
- Name
- Roles array
- Created timestamp
- Auto-hashing on insert

**Password Security**:
- Bcrypt with salt rounds 10
- Automatic hashing via `@BeforeInsert` hook
- Password validation method on entity

### Response Interceptor

Global response transformation ensures consistent API format:

```typescript
// Controller returns data
return { id: 1, name: "John" };

// Client receives:
{
  "message": "Success",
  "data": { "id": 1, "name": "John" },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users"
}
```

Use `wrapResponse()` for custom messages:

```typescript
import { wrapResponse, ResponseMessages } from '../../common/utils/response.util';

return wrapResponse(ResponseMessages.SUCCESS, data);
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `npm run start:dev` | Run in development mode with hot reload |
| `npm run start:prod` | Run compiled app in production mode |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:cov` | Run unit tests with coverage report |
| `npm run test:e2e` | Run end-to-end tests |

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Hello World |
| GET | `/api` | Health check with DB status |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Protected Endpoints (Requires JWT)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/auth/me` | Any authenticated user | Get current user |
| GET | `/api/users` | user, admin | List all users |
| GET | `/api/users/admin-only` | admin only | Admin-only endpoint |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `JWT_ACCESS_SECRET` | - | JWT signing secret (required) |
| `JWT_ACCESS_EXPIRES_IN` | 15m | JWT expiration time |
| `DATABASE_HOST` | localhost | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_USERNAME` | postgres | Database user |
| `DATABASE_PASSWORD` | postgres | Database password |
| `DATABASE_NAME` | myid_db | Database name |
| `DATABASE_SYNCHRONIZE` | true | Auto-create schema (dev only) |
| `DATABASE_LOGGING` | true | Log SQL queries |

## Contributing

### Code Style

- ESLint with TypeScript support
- Prettier for formatting
- Single quotes, trailing commas
- Strict TypeScript mode

### Adding New Features

1. Create module in `src/modules/`
2. Add tests in `src/**/*.spec.ts`
3. Add E2E tests in `test/`
4. Update Swagger decorators
5. Run tests: `npm run test && npm run test:e2e`

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps

# View logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d postgres
```

### JWT Errors

- Ensure `JWT_ACCESS_SECRET` is set in `.env`
- Check token format: `Bearer YOUR_TOKEN`
- Verify token hasn't expired

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

## License

MIT

## Support

For issues and feature requests, please create an issue in the repository.

# NestJS Authentication Template Usage

## Description

Use this skill when working with the NestJS authentication template (my-nest-template). This template provides JWT authentication, PostgreSQL integration, TypeORM, Swagger docs, RBAC, and standardized API responses.

## When to Apply

Apply this skill when:
- Setting up a new project based on this template
- Extending authentication features (oauth, refresh tokens, password reset)
- Adding new modules that integrate with auth system
- Working with TypeORM entities and repositories
- Implementing role-based access control
- Adding Swagger documentation to new endpoints
- Creating standardized API responses

## Template Architecture

### Core Principles

1. **Modular Architecture**: Each feature is a module under `src/modules/`
2. **Standardized Responses**: All responses use `{message, data, timestamp, path}` format
3. **Global Guards**: JWT and Roles guards applied globally via APP_GUARD
4. **Public Decorator**: Use `@Public()` to bypass authentication
5. **Response Wrapper**: Use `wrapResponse()` for consistent message formatting

### Module Structure Pattern

```
src/modules/{feature}/
  {feature}.module.ts
  {feature}.controller.ts
  {feature}.service.ts
  dto/
    create-{feature}.dto.ts
    update-{feature}.dto.ts
  entities/
    {feature}.entity.ts
```

## Authentication System

### Current Implementation

- **Strategy**: JWT with Passport
- **Token Storage**: In-memory (client-side bearer token)
- **Password Hashing**: Bcrypt with auto-hash on entity insert
- **Roles**: Array-based (`['user']`, `['admin', 'user']`)

### Key Files

| File | Purpose |
|------|---------|
| `src/modules/auth/strategies/jwt.strategy.ts` | JWT validation logic |
| `src/modules/auth/guards/jwt-auth.guard.ts` | Route protection with @Public() support |
| `src/modules/auth/guards/roles.guard.ts` | Role checking against @Roles() metadata |
| `src/modules/auth/decorators/public.decorator.ts` | Mark routes as public |
| `src/modules/auth/decorators/roles.decorator.ts` | Define required roles |
| `src/modules/auth/decorators/current-user.decorator.ts` | Inject current user into handlers |

### Extending Authentication

**Add OAuth (Google/GitHub):**

1. Install packages:
   ```bash
   bun add @nestjs/passport passport-google-oauth20
   bun add -D @types/passport-google-oauth20
   ```

2. Create strategy:
   ```typescript
   // src/modules/auth/strategies/google.strategy.ts
   @Injectable()
   export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
     constructor(configService: ConfigService) {
       super({
         clientID: configService.get('GOOGLE_CLIENT_ID'),
         clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
         callbackURL: '/auth/google/callback',
         scope: ['email', 'profile'],
       });
     }

     async validate(accessToken: string, refreshToken: string, profile: any) {
       // Find or create user
       return user;
     }
   }
   ```

3. Add to AuthModule providers

**Add Refresh Tokens:**

1. Extend User entity:
   ```typescript
   @Column({ nullable: true })
   refreshTokenHash: string;
   ```

2. Add to AuthService:
   ```typescript
   async generateTokens(user: User) {
     const [accessToken, refreshToken] = await Promise.all([
       this.jwtService.signAsync(payload, { expiresIn: '15m' }),
       this.jwtService.signAsync({ sub: user.id }, { expiresIn: '7d' }),
     ]);
     // Hash and store refresh token
     return { accessToken, refreshToken };
   }
   ```

## Database Patterns

### TypeORM Best Practices

**Entity Definition:**
```typescript
@Entity('table_name')
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;  // Soft delete
}
```

**Repository Pattern:**
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Entity)
    private readonly repository: Repository<Entity>,
  ) {}

  async findAll(): Promise<Entity[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<Entity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Entity>): Promise<Entity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
```

**Relations:**
```typescript
// One-to-Many
@ManyToOne(() => User, user => user.posts)
@JoinColumn({ name: 'user_id' })
author: User;

// Many-to-One
@OneToMany(() => Post, post => post.author)
posts: Post[];

// Many-to-Many
@ManyToMany(() => Tag)
@JoinTable()
tags: Tag[];
```

### Migrations (Production)

Disable `synchronize` in production, use migrations:

```bash
# Generate migration
npx typeorm migration:generate -n migration_name

# Run migrations
npx typeorm migration:run
```

## Creating New Modules

### Step-by-Step

1. **Generate Module Structure:**
   ```bash
   mkdir -p src/modules/feature/{dto,entities}
   ```

2. **Create Entity:**
   ```typescript
   // src/modules/feature/entities/feature.entity.ts
   import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

   @Entity('features')
   export class Feature {
     @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column()
     name: string;
   }
   ```

3. **Create DTOs:**
   ```typescript
   // src/modules/feature/dto/create-feature.dto.ts
   import { IsString, IsNotEmpty } from 'class-validator';

   export class CreateFeatureDto {
     @IsString()
     @IsNotEmpty()
     name: string;
   }
   ```

4. **Create Service:**
   ```typescript
   // src/modules/feature/feature.service.ts
   @Injectable()
   export class FeatureService {
     constructor(
       @InjectRepository(Feature)
       private readonly repository: Repository<Feature>,
     ) {}

     async create(dto: CreateFeatureDto) {
       const feature = this.repository.create(dto);
       return this.repository.save(feature);
     }
   }
   ```

5. **Create Controller:**
   ```typescript
   // src/modules/feature/feature.controller.ts
   @ApiTags('Features')
   @Controller('features')
   export class FeatureController {
     constructor(private readonly service: FeatureService) {}

     @Post()
     @ApiOperation({ summary: 'Create feature' })
     async create(@Body() dto: CreateFeatureDto) {
       const data = await this.service.create(dto);
       return wrapResponse(ResponseMessages.CREATED, data);
     }
   }
   ```

6. **Create Module:**
   ```typescript
   // src/modules/feature/feature.module.ts
   @Module({
     imports: [TypeOrmModule.forFeature([Feature])],
     controllers: [FeatureController],
     providers: [FeatureService],
     exports: [FeatureService],
   })
   export class FeatureModule {}
   ```

7. **Add to AppModule:**
   ```typescript
   imports: [
     // ... other modules
     FeatureModule,
   ]
   ```

## API Response Patterns

### Standard Response

```typescript
@Get()
async findAll() {
  const data = await this.service.findAll();
  return wrapResponse(ResponseMessages.SUCCESS, data);
}
```

### With Pagination

```typescript
@Get()
async findAll(@Query() query: PaginationDto) {
  const { page = 1, limit = 10 } = query;
  const [data, total] = await this.service.findAll({
    skip: (page - 1) * limit,
    take: limit,
  });

  return wrapResponse(ResponseMessages.SUCCESS, {
    items: data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

### Error Handling

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const data = await this.service.findOne(id);
  if (!data) {
    throw new NotFoundException('Resource not found');
  }
  return wrapResponse(ResponseMessages.SUCCESS, data);
}
```

## Swagger Documentation

### Controller Level

```typescript
@ApiTags('Features')
@ApiBearerAuth('JWT-auth')
@Controller('features')
export class FeatureController {
  // endpoints...
}
```

### Method Level

```typescript
@Get()
@ApiOperation({
  summary: 'List all features',
  description: 'Returns paginated list of features',
})
@ApiResponse({
  status: 200,
  description: 'Features retrieved successfully',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
async findAll() {
  // ...
}
```

### DTO Documentation

```typescript
export class CreateFeatureDto {
  @ApiProperty({
    description: 'Feature name',
    example: 'My Feature',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Feature description',
    example: 'Optional description',
  })
  @IsOptional()
  description?: string;
}
```

## Testing Patterns

### Unit Test Structure

```typescript
describe('FeatureService', () => {
  let service: FeatureService;
  let repository: MockRepository<Feature>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        {
          provide: getRepositoryToken(Feature),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    repository = module.get(getRepositoryToken(Feature));
  });

  describe('create', () => {
    it('should create and return feature', async () => {
      const dto = { name: 'Test' };
      const expected = { id: '1', name: 'Test' };

      repository.create!.mockReturnValue(expected);
      repository.save!.mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
    });
  });
});
```

### E2E Test Structure

```typescript
describe('FeatureController (e2e)', () => {
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

  it('/features (POST)', () => {
    return request(app.getHttpServer())
      .post('/features')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test' })
      .expect(201);
  });
});
```

## Common Tasks

### Add New Role

1. Update `UserRole` type in `user.entity.ts`:
   ```typescript
   export type UserRole = 'user' | 'admin' | 'moderator';
   ```

2. Use in controller:
   ```typescript
   @Roles('moderator')
   @Get('moderated-content')
   async getModeratedContent() {}
   ```

### Add Field to User

1. Update entity:
   ```typescript
   @Column({ nullable: true })
   avatarUrl: string;
   ```

2. Update DTOs as needed
3. Update service methods
4. Tests will use SQLite, production uses PostgreSQL

### Implement Soft Delete

1. Add to entity:
   ```typescript
   @DeleteDateColumn({ name: 'deleted_at' })
   deletedAt: Date;
   ```

2. Use TypeORM's soft delete:
   ```typescript
   await this.repository.softDelete(id);
   ```

3. Exclude deleted by default:
   ```typescript
   async findAll() {
     return this.repository.find({
       where: { deletedAt: IsNull() },
     });
   }
   ```

### Add File Upload

1. Install packages:
   ```bash
   bun add @nestjs/platform-express multer
   bun add -D @types/multer
   ```

2. Configure in module:
   ```typescript
   imports: [
     MulterModule.register({
       dest: './uploads',
     }),
   ]
   ```

3. Use in controller:
   ```typescript
   @Post('upload')
   @UseInterceptors(FileInterceptor('file'))
   uploadFile(@UploadedFile() file: Express.Multer.File) {
     return wrapResponse('File uploaded', { filename: file.filename });
   }
   ```

## Docker Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Run migrations in container
docker compose exec app npx typeorm migration:run

# Access PostgreSQL
docker compose exec postgres psql -U postgres -d myid_db

# Reset everything
docker compose down -v
```

## Environment Variables Reference

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| NODE_ENV | development | production | Environment mode |
| DATABASE_SYNCHRONIZE | true | false | Auto-create schema |
| DATABASE_LOGGING | true | false | Log SQL queries |
| JWT_ACCESS_EXPIRES_IN | 15m | 15m | Token expiration |

## Troubleshooting Template Issues

### Issue: Database connection fails
**Solution:** Check `.env` DATABASE_HOST. Use `localhost` for local, `postgres` for Docker.

### Issue: JWT validation fails
**Solution:** Ensure `JWT_ACCESS_SECRET` is set. Check token format in Authorization header.

### Issue: Swagger not showing all endpoints
**Solution:** Verify `@ApiTags()` and `@Controller()` decorators are present.

### Issue: Tests failing with DB error
**Solution:** E2E tests use SQLite. Ensure `test/test-app.module.ts` is imported, not `AppModule`.

### Issue: Changes not reflecting
**Solution:** NestJS dev mode (`start:dev`) should auto-reload. If not, restart the server.

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    name: 'Test User',
    roles: ['user'] as UserRole[],
    createdAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              if (key === 'auth.jwtAccessSecret') return 'test-secret';
              if (key === 'auth.jwtAccessExpiresIn') return '15m';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        mockUser,
        'password',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const token = 'jwt-token';
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(token);

      const result = await service.login('test@example.com', 'password');

      expect(result.user).toBeDefined();
      expect(result.tokens.accessToken).toBe(token);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should create user and return tokens on successful registration', async () => {
      const newUser: User = { ...mockUser, email: registerDto.email };
      const token = 'jwt-token';

      usersService.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValue(token);

      const result = await service.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.tokens.accessToken).toBe(token);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.create).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
        ['user'],
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.create.mockRejectedValue(new ConflictException());

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return user without passwordHash', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('1');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      const result = await service.getCurrentUser('999');

      expect(result).toBeNull();
    });
  });
});

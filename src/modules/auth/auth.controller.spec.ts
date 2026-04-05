import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestUser } from './strategies/jwt.strategy';
import { wrapResponse, ResponseMessages } from '../../common/utils/response.util';

jest.mock('../../common/utils/response.util');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['user'],
    createdAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'jwt-token',
  };

  const mockRequestUser: RequestUser = {
    userId: '1',
    email: 'test@example.com',
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Setup wrapResponse mock
    (wrapResponse as jest.Mock).mockImplementation((message, data) => ({
      message,
      data,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return wrapped response on successful login', async () => {
      const loginResult = { user: mockUser, tokens: mockTokens };
      authService.login.mockResolvedValue(loginResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(wrapResponse).toHaveBeenCalledWith(ResponseMessages.LOGIN_SUCCESS, loginResult);
      expect(result).toEqual({
        message: ResponseMessages.LOGIN_SUCCESS,
        data: loginResult,
      });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    };

    it('should return wrapped response on successful registration', async () => {
      const registerResult = { user: mockUser, tokens: mockTokens };
      authService.register.mockResolvedValue(registerResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(wrapResponse).toHaveBeenCalledWith(ResponseMessages.REGISTER_SUCCESS, registerResult);
      expect(result).toEqual({
        message: ResponseMessages.REGISTER_SUCCESS,
        data: registerResult,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return wrapped response with current user', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockRequestUser);

      expect(authService.getCurrentUser).toHaveBeenCalledWith(mockRequestUser.userId);
      expect(wrapResponse).toHaveBeenCalledWith(ResponseMessages.USER_FETCHED, mockUser);
      expect(result).toEqual({
        message: ResponseMessages.USER_FETCHED,
        data: mockUser,
      });
    });

    it('should return wrapped response with null when user not found', async () => {
      authService.getCurrentUser.mockResolvedValue(null);

      const result = await controller.getCurrentUser(mockRequestUser);

      expect(wrapResponse).toHaveBeenCalledWith(ResponseMessages.USER_FETCHED, null);
      expect(result).toEqual({
        message: ResponseMessages.USER_FETCHED,
        data: null,
      });
    });
  });
});

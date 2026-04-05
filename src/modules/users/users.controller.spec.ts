import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  wrapResponse,
  ResponseMessages,
} from '../../common/utils/response.util';
import { User, UserRole } from './entities/user.entity';

jest.mock('../../common/utils/response.util');

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'user1@example.com',
      name: 'User 1',
      passwordHash: 'hash',
      roles: ['user'] as UserRole[],
      createdAt: new Date(),
      hashPassword: jest.fn(),
      validatePassword: jest.fn(),
    },
    {
      id: '2',
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: 'hash',
      roles: ['admin', 'user'] as UserRole[],
      createdAt: new Date(),
      hashPassword: jest.fn(),
      validatePassword: jest.fn(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    // Setup wrapResponse mock
    (wrapResponse as jest.Mock).mockImplementation(
      (message: string, data: unknown) => ({
        message,
        data,
      }),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return wrapped response with sanitized users', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.findAll).toHaveBeenCalled();
      expect(wrapResponse).toHaveBeenCalledWith(
        ResponseMessages.USERS_FETCHED,
        expect.arrayContaining([
          expect.objectContaining({
            id: '1',
            email: 'user1@example.com',
            name: 'User 1',
            roles: ['user'],
          }),
        ]),
      );
      expect(result).toEqual({
        message: ResponseMessages.USERS_FETCHED,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.arrayContaining([
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expect.not.objectContaining({ passwordHash: expect.anything() }),
        ]),
      });
    });

    it('should sanitize users by removing passwordHash', async () => {
      usersService.findAll.mockResolvedValue(mockUsers);

      await controller.findAll();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sanitizedData: unknown[] =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (wrapResponse as jest.Mock).mock.calls[0][1];

      sanitizedData.forEach((item) => {
        const user = item as {
          passwordHash: unknown;
          hashPassword: unknown;
          validatePassword: unknown;
        };
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('hashPassword');
        expect(user).not.toHaveProperty('validatePassword');
      });
    });
  });

  describe('adminOnly', () => {
    it('should return wrapped response for admin access', () => {
      const result = controller.adminOnly();

      expect(wrapResponse).toHaveBeenCalledWith(
        'Admin access granted',
        expect.objectContaining({
          message: 'This is only accessible by admins',
        }),
      );
      expect(result).toEqual({
        message: 'Admin access granted',
        data: {
          message: 'This is only accessible by admins',
        },
      });
    });
  });
});

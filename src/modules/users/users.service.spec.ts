import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    passwordHash: 'hashedpassword',
    name: 'Test User',
    roles: ['user'] as UserRole[],
    createdAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockUser);
      repository.save!.mockResolvedValue(mockUser);

      const result = await service.create(
        'test@example.com',
        'password123',
        'Test User',
        ['user'],
      );

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      repository.findOne!.mockResolvedValue(mockUser);

      await expect(
        service.create('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);

      const result = await service.validatePassword(mockUser, 'password123');

      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);

      const result = await service.validatePassword(mockUser, 'wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [mockUser];
      repository.find!.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('seedAdmin', () => {
    it('should create admin user if not exists', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue({
        ...mockUser,
        email: 'admin@example.com',
        roles: ['admin', 'user'],
      });
      repository.save!.mockResolvedValue({
        ...mockUser,
        email: 'admin@example.com',
        roles: ['admin', 'user'],
      });

      await service.seedAdmin();

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should not create admin if already exists', async () => {
      repository.findOne!.mockResolvedValue({
        ...mockUser,
        email: 'admin@example.com',
      });

      await service.seedAdmin();

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});

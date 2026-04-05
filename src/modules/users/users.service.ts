import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(
    email: string,
    password: string,
    name: string,
    roles: UserRole[] = ['user'],
  ): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
      email,
      passwordHash: password, // Will be hashed by @BeforeInsert hook
      name,
      roles,
    });

    return this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return user.validatePassword(password);
  }

  // For testing purposes - create an admin user
  async seedAdmin(): Promise<void> {
    const existingAdmin = await this.findByEmail('admin@example.com');
    if (!existingAdmin) {
      await this.create('admin@example.com', 'admin123', 'Admin User', [
        'admin',
        'user',
      ]);
    }
  }

  // Get all users (for testing)
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}

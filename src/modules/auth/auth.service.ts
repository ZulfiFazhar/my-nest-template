import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await this.validateUser(email, password);
    const tokens = await this.generateTokens(user);

    const { id, email: userEmail, name, roles, createdAt } = user;
    return {
      user: { id, email: userEmail, name, roles, createdAt },
      tokens,
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    try {
      const user = await this.usersService.create(
        dto.email,
        dto.password,
        dto.name || dto.email.split('@')[0],
        ['user'],
      );

      const tokens = await this.generateTokens(user);

      const { id, email: userEmail, name, roles, createdAt } = user;
      return {
        user: { id, email: userEmail, name, roles, createdAt },
        tokens,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Could not create user');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('auth.jwtAccessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'auth.jwtAccessExpiresIn',
      ) as any,
    });

    return {
      accessToken,
    };
  }

  async getCurrentUser(userId: string): Promise<UserResponse | null> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }

    const { id, email, name, roles, createdAt } = user;
    return { id, email, name, roles, createdAt };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/user.entity';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  fullName: 'Test User',
  role: Role.OWNER,
  active: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validatePassword: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock_secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should return tokens on successful login', async () => {
    usersService.validatePassword.mockResolvedValue(mockUser as any);

    const result = await service.login('test@test.com', 'password');

    expect(result.accessToken).toBe('mock_token');
    expect(result.refreshToken).toBe('mock_token');
    expect(result.user).toEqual(mockUser);
    expect(jwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    usersService.validatePassword.mockResolvedValue(null);

    await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for inactive user', async () => {
    usersService.validatePassword.mockResolvedValue({ ...mockUser, active: false } as any);

    await expect(service.login('test@test.com', 'password')).rejects.toThrow(UnauthorizedException);
  });
});

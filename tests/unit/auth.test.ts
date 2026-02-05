import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
  },
}));

import prisma from '../../src/config/database';
import { AuthService } from '../../src/modules/auth/auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'EVENTEE' as const,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        createdAt: new Date(),
      });

      const result = await AuthService.register(input);

      expect(result.user.email).toBe(input.email);
      expect(result.user.role).toBe('EVENTEE');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw conflict error if user already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'EVENTEE' as const,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      await expect(AuthService.register(input)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login with valid credentials and return tokens', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'EVENTEE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      // Password should not be in the response
      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw error for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login({ email: 'wrong@example.com', password: 'password123' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12);

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'EVENTEE',
      });

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const payload = { userId: 'user-id-123', email: 'test@example.com', role: 'EVENTEE' };
      const refreshToken = jwt.sign(payload, 'test-refresh-secret', { expiresIn: '7d' });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-123',
        email: 'test@example.com',
        role: 'EVENTEE',
      });

      const result = await AuthService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });
  });
});

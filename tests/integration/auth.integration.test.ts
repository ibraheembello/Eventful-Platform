import request from 'supertest';
import app from '../../src/app';

// Mock Prisma
jest.mock('../../src/config/database', () => {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('password123', 12);

  return {
    __esModule: true,
    default: {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.email === 'existing@test.com') {
            return Promise.resolve({
              id: 'user-id-123',
              email: 'existing@test.com',
              password: hashedPassword,
              firstName: 'Existing',
              lastName: 'User',
              role: 'EVENTEE',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          if (where.id === 'user-id-123') {
            return Promise.resolve({
              id: 'user-id-123',
              email: 'existing@test.com',
              firstName: 'Existing',
              lastName: 'User',
              role: 'EVENTEE',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue({
          id: 'new-user-id',
          email: 'new@test.com',
          firstName: 'New',
          lastName: 'User',
          role: 'EVENTEE',
          createdAt: new Date(),
        }),
      },
    },
  };
});

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    call: jest.fn().mockResolvedValue([1, Date.now() + 60000]),
  },
}));

// Mock rate limiters as pass-through middleware
jest.mock('../../src/middleware/rateLimiter', () => {
  const pt = (_req: any, _res: any, next: any) => next();
  return { globalLimiter: pt, authLimiter: pt, paymentLimiter: pt };
});

describe('Auth API Integration', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'EVENTEE',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: '12',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for existing email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'EVENTEE',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'existing@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'existing@test.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('should return profile with valid token', async () => {
      // First login to get token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'existing@test.com',
        password: 'password123',
      });

      const token = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('existing@test.com');
    });
  });
});

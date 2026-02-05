import request from 'supertest';
import jwt from 'jsonwebtoken';

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

// Mock rate limiters as pass-through middleware so integration tests
// don't depend on a real Redis connection for the EVAL scripts.
const passThrough = (_req: any, _res: any, next: any) => next();
jest.mock('../../src/middleware/rateLimiter', () => ({
  globalLimiter: passThrough,
  authLimiter: passThrough,
  paymentLimiter: passThrough,
}));

// Mock data must be defined inside the factory because jest.mock is hoisted
// above all variable declarations. Referencing an outer variable would cause
// "Cannot access before initialization" at runtime.
jest.mock('../../src/config/database', () => {
  const events = [
    {
      id: 'event-1',
      title: 'Music Festival',
      description: 'Great music event',
      date: new Date('2026-06-15'),
      location: 'Lagos',
      price: 5000,
      capacity: 100,
      category: 'Music',
      creatorId: 'creator-id-123',
      creator: { id: 'creator-id-123', firstName: 'Test', lastName: 'Creator' },
      _count: { tickets: 10 },
    },
  ];

  return {
    __esModule: true,
    default: {
      event: {
        findMany: jest.fn().mockResolvedValue(events),
        findUnique: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id === 'event-1') {
            return Promise.resolve(events[0]);
          }
          return Promise.resolve(null);
        }),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({
            id: 'new-event-id',
            ...data,
            creator: { id: data.creatorId, firstName: 'Test', lastName: 'Creator', email: 'c@test.com' },
          })
        ),
        update: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({ id: 'event-1', ...data, creatorId: 'creator-id-123' })
        ),
        delete: jest.fn().mockResolvedValue({}),
      },
      ticket: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    },
  };
});

import app from '../../src/app';

const SECRET = process.env.JWT_ACCESS_SECRET || 'secret';

function generateToken(role: string, userId = 'creator-id-123') {
  return jwt.sign({ userId, email: 'test@test.com', role }, SECRET, { expiresIn: 3600 } as jwt.SignOptions);
}

describe('Events API Integration', () => {
  describe('GET /api/events', () => {
    it('should return a list of events (public)', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should accept pagination parameters', async () => {
      const res = await request(app).get('/api/events?page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details by ID', async () => {
      const res = await request(app).get('/api/events/event-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('should return 404 for non-existent event', async () => {
      const res = await request(app).get('/api/events/non-existent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/events', () => {
    it('should create event for authenticated creator', async () => {
      const token = generateToken('CREATOR');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Event',
          description: 'A new event',
          date: '2026-08-01T10:00:00.000Z',
          location: 'Abuja',
          price: 3000,
          capacity: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject event creation for EVENTEE role', async () => {
      const token = generateToken('EVENTEE', 'eventee-id');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Event',
          description: 'A new event',
          date: '2026-08-01T10:00:00.000Z',
          location: 'Abuja',
          price: 3000,
          capacity: 50,
        });

      expect(res.status).toBe(403);
    });

    it('should reject without authentication', async () => {
      const res = await request(app).post('/api/events').send({
        title: 'New Event',
        description: 'A new event',
        date: '2026-08-01T10:00:00.000Z',
        location: 'Abuja',
        price: 3000,
        capacity: 50,
      });

      expect(res.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const token = generateToken('CREATOR');

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Event',
          // missing required fields
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/events/:id/share', () => {
    it('should return share links for an event', async () => {
      const res = await request(app).get('/api/events/event-1/share');

      expect(res.status).toBe(200);
      expect(res.body.data.twitter).toBeDefined();
      expect(res.body.data.facebook).toBeDefined();
      expect(res.body.data.whatsapp).toBeDefined();
    });
  });
});

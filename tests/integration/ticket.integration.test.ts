import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

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

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    ticket: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'ticket-1',
          qrCode: 'qr-1',
          status: 'ACTIVE',
          event: { id: 'event-1', title: 'Event', date: new Date(), location: 'Lagos' },
          payment: { amount: 5000, status: 'SUCCESS' },
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue({
        id: 'ticket-1',
        qrCode: 'qr-1',
        status: 'ACTIVE',
        userId: 'eventee-id-123',
        event: {
          id: 'event-1',
          title: 'Event',
          creatorId: 'creator-id-123',
          creator: { id: 'creator-id-123', firstName: 'Test', lastName: 'Creator' },
        },
        user: { id: 'eventee-id-123', firstName: 'Test', lastName: 'Eventee', email: 'e@test.com' },
        payment: { amount: 5000 },
      }),
      findFirst: jest.fn().mockResolvedValue({
        id: 'ticket-1',
        status: 'ACTIVE',
        event: { creatorId: 'creator-id-123' },
        user: { id: 'eventee-id-123', firstName: 'Test', lastName: 'Eventee', email: 'e@test.com' },
      }),
      update: jest.fn().mockResolvedValue({
        id: 'ticket-1',
        status: 'USED',
        scannedAt: new Date(),
        event: { id: 'event-1', title: 'Event', date: new Date() },
        user: { id: 'eventee-id-123', firstName: 'Test', lastName: 'Eventee', email: 'e@test.com' },
      }),
    },
    event: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const SECRET = process.env.JWT_ACCESS_SECRET || 'secret';

function generateToken(role: string, userId: string) {
  return jwt.sign({ userId, email: 'test@test.com', role }, SECRET, { expiresIn: 3600 } as jwt.SignOptions);
}

describe('Tickets API Integration', () => {
  describe('GET /api/tickets', () => {
    it('should return user tickets when authenticated', async () => {
      const token = generateToken('EVENTEE', 'eventee-id-123');

      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket details for the ticket owner', async () => {
      const token = generateToken('EVENTEE', 'eventee-id-123');

      const res = await request(app)
        .get('/api/tickets/ticket-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('ticket-1');
    });
  });

  describe('POST /api/tickets/verify', () => {
    it('should verify a ticket for event creator', async () => {
      const token = generateToken('CREATOR', 'creator-id-123');

      // Create a valid QR token
      const qrPayload = {
        ticketId: 'ticket-1',
        eventId: 'event-1',
        userId: 'eventee-id-123',
        code: 'qr-code-123',
      };
      const qrToken = jwt.sign(qrPayload, SECRET, { expiresIn: '365d' });

      const res = await request(app)
        .post('/api/tickets/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ qrToken });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('USED');
    });

    it('should reject verification from non-creator', async () => {
      const token = generateToken('EVENTEE', 'eventee-id-123');

      const res = await request(app)
        .post('/api/tickets/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ qrToken: 'some-token' });

      expect(res.status).toBe(403);
    });
  });
});

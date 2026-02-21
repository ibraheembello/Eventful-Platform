import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Skip integration tests when DATABASE_URL is not available (CI environment)
const hasDatabase = !!process.env.DATABASE_URL;

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    quit: jest.fn().mockResolvedValue('OK'),
  },
}));

// Mock rate limiter as pass-through
jest.mock('../../src/middleware/rateLimiter', () => {
  const pt = (_req: any, _res: any, next: any) => next();
  return {
    globalLimiter: pt,
    authLimiter: pt,
    paymentLimiter: pt,
  };
});

// Mock Paystack API calls
jest.mock('../../src/config/paystack', () => ({
  paystackConfig: {
    secretKey: 'sk_test_mock',
    publicKey: 'pk_test_mock',
    baseUrl: 'https://api.paystack.co',
  },
}));

(hasDatabase ? describe : describe.skip)('Payment Integration Tests', () => {
  let eventeeToken: string;
  let creatorToken: string;
  let eventeeId: string;
  let creatorId: string;
  let eventId: string;
  let paymentReference: string;

  beforeAll(async () => {
    // Clean up
    await prisma.notification.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create eventee user
    const eventee = await prisma.user.create({
      data: {
        email: 'eventee@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Eventee',
        role: 'EVENTEE',
      },
    });
    eventeeId = eventee.id;

    // Create creator user
    const creator = await prisma.user.create({
      data: {
        email: 'creator@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Creator',
        role: 'CREATOR',
      },
    });
    creatorId = creator.id;

    // Create event
    const event = await prisma.event.create({
      data: {
        title: 'Payment Test Event',
        description: 'Event for payment testing',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Test Location',
        price: 5000,
        capacity: 100,
        category: 'Technology',
        creatorId: creator.id,
      },
    });
    eventId = event.id;

    // Generate tokens
    eventeeToken = jwt.sign(
      { userId: eventeeId, role: 'EVENTEE' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: 900 } as jwt.SignOptions
    );

    creatorToken = jwt.sign(
      { userId: creatorId, role: 'CREATOR' },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: 900 } as jwt.SignOptions
    );
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/payments/initialize', () => {
    it('should initialize payment for valid event', async () => {
      // Mock fetch for Paystack API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            authorization_url: 'https://checkout.paystack.com/test123',
            access_code: 'test_access_code',
            reference: 'test_reference',
          },
        }),
      }) as any;

      const response = await request(app)
        .post('/api/payments/initialize')
        .set('Authorization', `Bearer ${eventeeToken}`)
        .send({ eventId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('authorizationUrl');
      expect(response.body.data).toHaveProperty('reference');

      paymentReference = response.body.data.reference;
    });

    it('should fail when creator tries to buy ticket', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ eventId });

      expect(response.status).toBe(403);
    });

    it('should fail for invalid event ID format', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .set('Authorization', `Bearer ${eventeeToken}`)
        .send({ eventId: 'invalid-uuid' });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/payments/initialize')
        .send({ eventId });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/verify/:reference', () => {
    beforeEach(async () => {
      // Clean up tickets first (foreign key constraint), then payments
      const existingPayment = await prisma.payment.findUnique({
        where: { paystackReference: 'TEST-VERIFY-REF-123' },
      });
      if (existingPayment) {
        await prisma.ticket.deleteMany({ where: { paymentId: existingPayment.id } });
        await prisma.notification.deleteMany({ where: { userId: existingPayment.userId, eventId: existingPayment.eventId } });
      }
      await prisma.payment.deleteMany({
        where: { paystackReference: 'TEST-VERIFY-REF-123' },
      });

      // Create a pending payment for verification tests
      const payment = await prisma.payment.create({
        data: {
          amount: 5000,
          status: 'PENDING',
          paystackReference: 'TEST-VERIFY-REF-123',
          paystackAccessCode: 'test_access_code',
          paystackAuthUrl: 'https://checkout.paystack.com/test',
          userId: eventeeId,
          eventId,
        },
      });
      paymentReference = payment.paystackReference!;
    });

    it('should verify successful payment and create ticket', async () => {
      jest.setTimeout(15000);
      // Mock Paystack verification response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: true,
          data: {
            status: 'success',
            amount: 500000, // Paystack amount in kobo (5000 * 100)
            reference: paymentReference,
          },
        }),
      }) as any;

      const response = await request(app)
        .get(`/api/payments/verify/${paymentReference}`)
        .set('Authorization', `Bearer ${eventeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe('SUCCESS');
      expect(response.body.data.ticket).toBeDefined();
      expect(response.body.data.ticket.qrCode).toBeDefined();
    });

    it('should fail for non-existent payment reference', async () => {
      const response = await request(app)
        .get('/api/payments/verify/NON-EXISTENT-REF')
        .set('Authorization', `Bearer ${eventeeToken}`);

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/payments/verify/${paymentReference}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payments/creator', () => {
    it('should return creator payments with analytics', async () => {
      const response = await request(app)
        .get('/api/payments/creator')
        .set('Authorization', `Bearer ${creatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payments');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.payments)).toBe(true);
    });

    it('should fail when eventee tries to access creator payments', async () => {
      const response = await request(app)
        .get('/api/payments/creator')
        .set('Authorization', `Bearer ${eventeeToken}`);

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/payments/creator');

      expect(response.status).toBe(401);
    });
  });
});

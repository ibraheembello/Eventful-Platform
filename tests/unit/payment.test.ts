import crypto from 'crypto';

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqr'),
}));

// Mock Paystack config so the secret key is controlled by the test
jest.mock('../../src/config/paystack', () => ({
  paystackConfig: {
    secretKey: 'sk_test_123',
    publicKey: 'pk_test_123',
    baseUrl: 'https://api.paystack.co',
  },
}));

// Mock fetch
global.fetch = jest.fn();

import prisma from '../../src/config/database';
import { PaymentService } from '../../src/modules/payments/payment.service';

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_123';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  describe('initializePayment', () => {
    it('should initialize payment and return Paystack URL', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-123',
        title: 'Test Event',
        price: 5000,
        capacity: 100,
      });

      (prisma.ticket.count as jest.Mock).mockResolvedValue(10);
      (prisma.ticket.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        json: () =>
          Promise.resolve({
            status: true,
            data: {
              authorization_url: 'https://paystack.com/pay/test123',
              access_code: 'access-code-123',
              reference: 'ref-123',
            },
          }),
      });

      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        amount: 5000,
        status: 'PENDING',
        paystackReference: 'EVT-123',
      });

      const result = await PaymentService.initializePayment('user-123', 'event-123');

      expect(result.authorizationUrl).toContain('paystack.com');
      expect(result.payment.status).toBe('PENDING');
    });

    it('should throw error if event is sold out', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-123',
        price: 5000,
        capacity: 10,
      });

      (prisma.ticket.count as jest.Mock).mockResolvedValue(10);

      await expect(
        PaymentService.initializePayment('user-123', 'event-123')
      ).rejects.toThrow('Event is sold out');
    });

    it('should throw error if user already has a ticket', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-123',
        price: 5000,
        capacity: 100,
      });

      (prisma.ticket.count as jest.Mock).mockResolvedValue(5);
      (prisma.ticket.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-ticket' });

      await expect(
        PaymentService.initializePayment('user-123', 'event-123')
      ).rejects.toThrow('You already have a ticket for this event');
    });

    it('should throw error if event does not exist', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        PaymentService.initializePayment('user-123', 'non-existent')
      ).rejects.toThrow('Event not found');
    });
  });

  describe('handleWebhook', () => {
    it('should reject invalid webhook signature', async () => {
      const body = { event: 'charge.success', data: { reference: 'ref-123' } };

      await expect(
        PaymentService.handleWebhook(body, 'invalid-signature')
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should process valid webhook with correct signature', async () => {
      const body = {
        event: 'charge.success',
        data: {
          reference: 'ref-123',
          paid_at: new Date().toISOString(),
        },
      };

      const hash = crypto
        .createHmac('sha512', 'sk_test_123')
        .update(JSON.stringify(body))
        .digest('hex');

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        userId: 'user-123',
        eventId: 'event-123',
        status: 'PENDING',
      });

      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: 'payment-123',
        status: 'SUCCESS',
      });

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      (prisma.ticket.create as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        qrCode: 'qr-123',
        qrCodeData: 'token-data',
      });

      (prisma.ticket.update as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
      });

      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-123',
        defaultReminderValue: null,
      });

      const result = await PaymentService.handleWebhook(body, hash);

      expect(result.message).toBe('Webhook processed');
    });
  });

  describe('getCreatorPayments', () => {
    it('should return paginated creator payments', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        { id: 'event-1' },
        { id: 'event-2' },
      ]);

      (prisma.payment.findMany as jest.Mock).mockResolvedValue([
        { id: 'payment-1', amount: 5000, status: 'SUCCESS' },
      ]);

      (prisma.payment.count as jest.Mock).mockResolvedValue(1);

      const result = await PaymentService.getCreatorPayments('creator-123', 1, 10) as any;

      expect(result.payments).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

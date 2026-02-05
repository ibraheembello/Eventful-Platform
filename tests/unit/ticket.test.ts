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
  },
}));

// Mock Prisma
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    ticket: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

import prisma from '../../src/config/database';
import { TicketService } from '../../src/modules/tickets/ticket.service';
import { QRCodeService } from '../../src/modules/qrcode/qrcode.service';

describe('TicketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  describe('verifyTicket', () => {
    it('should verify a valid ticket and mark as used', async () => {
      const payload = {
        ticketId: 'ticket-123',
        eventId: 'event-123',
        userId: 'user-123',
        code: 'qr-code-123',
      };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '365d' });

      (prisma.ticket.findFirst as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        status: 'ACTIVE',
        event: { creatorId: 'creator-123' },
        user: { id: 'user-123', firstName: 'Test', lastName: 'User', email: 'test@test.com' },
      });

      (prisma.ticket.update as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        status: 'USED',
        scannedAt: new Date(),
        event: { id: 'event-123', title: 'Test Event', date: new Date() },
        user: { id: 'user-123', firstName: 'Test', lastName: 'User', email: 'test@test.com' },
      });

      const result = await TicketService.verifyTicket(token, 'creator-123');

      expect(result.status).toBe('USED');
      expect(result.scannedAt).toBeDefined();
    });

    it('should throw error for already used ticket', async () => {
      const payload = {
        ticketId: 'ticket-123',
        eventId: 'event-123',
        userId: 'user-123',
        code: 'qr-code-123',
      };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '365d' });

      (prisma.ticket.findFirst as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        status: 'USED',
        event: { creatorId: 'creator-123' },
        user: { id: 'user-123' },
      });

      await expect(TicketService.verifyTicket(token, 'creator-123')).rejects.toThrow(
        'This ticket has already been used'
      );
    });

    it('should throw error if creator does not own the event', async () => {
      const payload = {
        ticketId: 'ticket-123',
        eventId: 'event-123',
        userId: 'user-123',
        code: 'qr-code-123',
      };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '365d' });

      (prisma.ticket.findFirst as jest.Mock).mockResolvedValue({
        id: 'ticket-123',
        status: 'ACTIVE',
        event: { creatorId: 'other-creator' },
        user: { id: 'user-123' },
      });

      await expect(TicketService.verifyTicket(token, 'creator-123')).rejects.toThrow(
        'You can only verify tickets for your own events'
      );
    });

    it('should throw error for invalid QR token', async () => {
      await expect(TicketService.verifyTicket('invalid-token', 'creator-123')).rejects.toThrow(
        'Invalid QR code'
      );
    });
  });

  describe('getUserTickets', () => {
    it('should return paginated user tickets', async () => {
      const mockTickets = [
        { id: 'ticket-1', event: { title: 'Event 1' }, payment: { amount: 5000 } },
        { id: 'ticket-2', event: { title: 'Event 2' }, payment: { amount: 10000 } },
      ];

      (prisma.ticket.findMany as jest.Mock).mockResolvedValue(mockTickets);
      (prisma.ticket.count as jest.Mock).mockResolvedValue(2);

      const result = await TicketService.getUserTickets('user-123', 1, 10) as any;

      expect(result.tickets).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});

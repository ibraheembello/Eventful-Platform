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
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    ticket: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import prisma from '../../src/config/database';
import { EventService } from '../../src/modules/events/event.service';

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLIENT_URL = 'http://localhost:5173';
  });

  describe('create', () => {
    it('should create an event successfully', async () => {
      const input = {
        title: 'Test Event',
        description: 'A test event description',
        date: '2026-06-15T18:00:00.000Z',
        location: 'Lagos, Nigeria',
        price: 5000,
        capacity: 100,
        category: 'Music',
      };

      const mockEvent = {
        id: 'event-id-123',
        ...input,
        date: new Date(input.date),
        creatorId: 'creator-id-123',
        creator: {
          id: 'creator-id-123',
          firstName: 'Test',
          lastName: 'Creator',
          email: 'creator@test.com',
        },
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.create('creator-id-123', input);

      expect(result.title).toBe(input.title);
      expect(result.creatorId).toBe('creator-id-123');
      expect(prisma.event.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAll', () => {
    it('should return paginated events', async () => {
      const mockEvents = [
        { id: 'event-1', title: 'Event 1', _count: { tickets: 5 } },
        { id: 'event-2', title: 'Event 2', _count: { tickets: 10 } },
      ];

      (prisma.event.findMany as jest.Mock).mockResolvedValue(mockEvents);
      (prisma.event.count as jest.Mock).mockResolvedValue(2);

      const result = await EventService.getAll(1, 10) as any;

      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter events by search term', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.event.count as jest.Mock).mockResolvedValue(0);

      await EventService.getAll(1, 10, 'music');

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'music', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return an event by ID', async () => {
      const mockEvent = {
        id: 'event-id-123',
        title: 'Test Event',
        creator: { id: 'creator-id', firstName: 'Test', lastName: 'Creator' },
        _count: { tickets: 5 },
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      const result = await EventService.getById('event-id-123');

      expect(result).toBeDefined();
      expect((result as any).id).toBe('event-id-123');
    });

    it('should throw not found error for non-existent event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(EventService.getById('non-existent')).rejects.toThrow('Event not found');
    });
  });

  describe('update', () => {
    it('should update an event owned by the creator', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-id-123',
        creatorId: 'creator-id-123',
      });

      (prisma.event.update as jest.Mock).mockResolvedValue({
        id: 'event-id-123',
        title: 'Updated Title',
        creatorId: 'creator-id-123',
      });

      const result = await EventService.update('event-id-123', 'creator-id-123', {
        title: 'Updated Title',
      });

      expect((result as any).title).toBe('Updated Title');
    });

    it('should throw forbidden error if not the creator', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-id-123',
        creatorId: 'other-creator-id',
      });

      await expect(
        EventService.update('event-id-123', 'creator-id-123', { title: 'Updated' })
      ).rejects.toThrow('You can only update your own events');
    });
  });

  describe('delete', () => {
    it('should delete an event owned by the creator', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-id-123',
        creatorId: 'creator-id-123',
      });

      (prisma.event.delete as jest.Mock).mockResolvedValue({});

      const result = await EventService.delete('event-id-123', 'creator-id-123');

      expect(result.message).toBe('Event deleted successfully');
    });
  });

  describe('getShareLinks', () => {
    it('should generate share links for an event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-id-123',
        title: 'Test Event',
        description: 'A test event',
      });

      const links = await EventService.getShareLinks('event-id-123');

      expect(links.twitter).toContain('twitter.com');
      expect(links.facebook).toContain('facebook.com');
      expect(links.linkedin).toContain('linkedin.com');
      expect(links.whatsapp).toContain('wa.me');
      expect(links.email).toContain('mailto:');
    });
  });
});

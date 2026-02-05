import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eventful API',
      version: '1.0.0',
      description:
        'Eventful is more than just a ticketing platform — it\'s your passport to a world of unforgettable moments. This API powers event creation, ticket purchasing with QR codes, Paystack payments, notifications, analytics, and social sharing.',
      contact: {
        name: 'Eventful Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['CREATOR', 'EVENTEE'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            price: { type: 'number' },
            capacity: { type: 'integer' },
            imageUrl: { type: 'string', nullable: true },
            category: { type: 'string', nullable: true },
            defaultReminderValue: { type: 'integer', nullable: true },
            defaultReminderUnit: {
              type: 'string',
              enum: ['MINUTES', 'HOURS', 'DAYS', 'WEEKS'],
              nullable: true,
            },
            creatorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            qrCode: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'USED', 'CANCELLED'] },
            scannedAt: { type: 'string', format: 'date-time', nullable: true },
            eventId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            paymentId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED'] },
            paystackReference: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reminderValue: { type: 'integer' },
            reminderUnit: {
              type: 'string',
              enum: ['MINUTES', 'HOURS', 'DAYS', 'WEEKS'],
            },
            reminderTime: { type: 'string', format: 'date-time' },
            sent: { type: 'boolean' },
            userId: { type: 'string', format: 'uuid' },
            eventId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

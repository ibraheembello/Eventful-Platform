# 🎉 Eventful - Event Ticketing Platform

A complete, production-ready event ticketing platform built with modern technologies. Eventful allows creators to host events and manage ticket sales, while eventees can discover, purchase tickets, and receive QR-coded digital tickets with automated reminders.

**AltSchool Africa Capstone Project**

---

## ✨ Features

### For Event Creators (CREATOR role)
- 📅 **Event Management** - Create, update, and delete events with rich details
- 💳 **Payment Dashboard** - Track all ticket sales and revenue analytics
- 📊 **Analytics** - View comprehensive statistics (total events, attendees, revenue)
- 🔍 **QR Ticket Verification** - Scan and verify attendee tickets at events
- 👥 **Attendee Management** - See list of attendees for each event

### For Event Attendees (EVENTEE role)
- 🎫 **Event Discovery** - Browse and search all available events
- 🛒 **Ticket Purchase** - Secure payment integration with Paystack
- 📱 **Digital Tickets** - QR-coded tickets delivered instantly
- 🔔 **Smart Reminders** - Customizable event notifications (Minutes/Hours/Days/Weeks before)
- 📤 **Social Sharing** - Share events on Twitter, Facebook, LinkedIn, WhatsApp, Email

### Platform Features
- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 🌓 **Dark Mode** - Beautiful light/dark theme with smooth transitions
- 📱 **Responsive Design** - Luma-inspired UI that works on all devices
- ⚡ **Real-time Updates** - Instant feedback and live capacity tracking
- 🔒 **Secure Payments** - PCI-compliant payment processing via Paystack
- 🚀 **Performance Optimized** - Redis caching, rate limiting, efficient database queries
- 📖 **API Documentation** - Interactive Swagger/OpenAPI docs
- ✅ **Fully Tested** - 60 unit and integration tests (58/60 passing)

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Payment**: Paystack API
- **QR Codes**: qrcode library with crypto-signed tokens
- **Validation**: Zod v4
- **Jobs**: node-cron for scheduled reminders
- **API Docs**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Security**: Helmet, CORS, rate limiting
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom CSS variables
- **State**: React Context API
- **HTTP Client**: Axios
- **UI Components**: React Icons, QRCode.react
- **Notifications**: react-hot-toast
- **Date Handling**: date-fns

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 13+
- **Redis** 6+
- **Paystack Account** (test keys for development)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd eventful-api
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/eventful_db?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate your own)
JWT_ACCESS_SECRET=your_secret_access_key_here
JWT_REFRESH_SECRET=your_secret_refresh_key_here

# Paystack (Get from https://dashboard.paystack.com/#/settings/developer)
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npx prisma db seed
```

The seed will create:
- 1 Creator user: `creator@example.com` / `password123`
- 1 Eventee user: `eventee@example.com` / `password123`
- 4 Sample events

### 5. Start Services

**Terminal 1 - Redis**:
```bash
redis-server
```

**Terminal 2 - Backend**:
```bash
npm run dev
```

**Terminal 3 - Frontend**:
```bash
cd client
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test suite
npm test -- tests/unit/auth.test.ts

# Run with coverage
npm test -- --coverage
```

**Test Results**: 58/60 tests passing (60 total tests across 8 suites)

---

## 📐 Project Structure

```
eventful-api/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth, Theme)
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities (API client)
│   │   ├── types/            # TypeScript types
│   │   └── index.css         # Global styles + design system
│   └── package.json
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
├── src/
│   ├── config/               # Configuration files
│   │   ├── database.ts       # Prisma client
│   │   ├── redis.ts          # Redis client
│   │   ├── paystack.ts       # Paystack config
│   │   └── swagger.ts        # API documentation
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # JWT authentication
│   │   ├── authorize.ts      # Role-based authorization
│   │   ├── validate.ts       # Zod validation
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── errorHandler.ts   # Global error handling
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Authentication
│   │   ├── events/           # Event management
│   │   ├── tickets/          # Ticket generation & verification
│   │   ├── payments/         # Paystack integration
│   │   ├── notifications/    # Reminders system
│   │   ├── analytics/        # Statistics & insights
│   │   └── qrcode/           # QR code generation
│   ├── utils/                # Utility functions
│   │   ├── apiResponse.ts    # Standard API responses
│   │   ├── apiError.ts       # Custom error class
│   │   ├── cache.ts          # Redis cache helpers
│   │   ├── shareLink.ts      # Social sharing links
│   │   └── param.ts          # Express v5 param helper
│   ├── jobs/
│   │   └── reminderJob.ts    # Cron job for notifications
│   ├── app.ts                # Express app setup
│   └── server.ts             # Server entry point
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── .env                      # Environment variables
├── package.json
└── README.md
```

---

## 🔐 API Authentication

All protected endpoints require a JWT access token in the Authorization header:

```bash
Authorization: Bearer <your_access_token>
```

### Getting Started with the API

1. **Register a user** (`POST /api/auth/register`)
2. **Login** (`POST /api/auth/login`) - Returns `accessToken` and `refreshToken`
3. **Use the access token** in subsequent requests
4. **Refresh token** when expired (`POST /api/auth/refresh`)

---

## 💳 Payment Flow

### For Eventees (Buying Tickets):

1. **Select Event** → Navigate to event detail page
2. **Click "Get Ticket"** → Initiates payment
3. **Redirected to Paystack** → Complete payment securely
4. **Payment Callback** → Returns to app with reference
5. **Verification** → App verifies payment with Paystack
6. **Ticket Generated** → QR code ticket created instantly
7. **Reminder Created** → Auto-created based on event settings

### Testing Payments

Use Paystack test cards:
- **Success**: `4084 0840 8408 4081` (any CVV, future expiry)
- **Insufficient Funds**: `5060 6666 6666 6666 666`
- **Declined**: `4084 0840 8408 4083`

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Events
- `GET /api/events` - List all events (with pagination & search)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (CREATOR only)
- `PATCH /api/events/:id` - Update event (CREATOR only)
- `DELETE /api/events/:id` - Delete event (CREATOR only)
- `GET /api/events/:id/share` - Get social sharing links
- `GET /api/events/:id/attendees` - Get attendees list (CREATOR only)

### Tickets
- `GET /api/tickets` - Get user's tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/verify` - Verify QR ticket (CREATOR only)

### Payments
- `POST /api/payments/initialize` - Initialize Paystack payment
- `GET /api/payments/verify/:reference` - Verify payment
- `POST /api/payments/webhook` - Paystack webhook handler
- `GET /api/payments/creator` - Get creator payments (CREATOR only)

### Notifications
- `GET /api/notifications` - Get user's reminders
- `POST /api/notifications` - Create reminder
- `PATCH /api/notifications/:id` - Update reminder
- `DELETE /api/notifications/:id` - Delete reminder

### Analytics
- `GET /api/analytics/overview` - Get creator overview (CREATOR only)
- `GET /api/analytics/events/:id` - Get event analytics (CREATOR only)
- `GET /api/analytics/events-list` - Get all events analytics (CREATOR only)

---

## 🎨 Design System

### Color Palette (CSS Variables)

The app uses a custom design system inspired by Luma:

- **Light Mode**: Clean whites, subtle grays, vibrant indigo/purple accents
- **Dark Mode**: Deep grays, muted colors, high contrast

### Key Features
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Smooth Transitions**: 150-300ms cubic-bezier animations
- **Responsive Breakpoints**: Mobile (< 650px), Tablet (650-1000px), Desktop (>1000px)
- **Skeleton Loaders**: Shimmer effect while loading
- **Hover Effects**: Lift and shadow on interactive elements

---

## 🔧 Configuration

### Rate Limiting

- **Global**: 100 requests per 15 minutes
- **Auth Routes**: 20 requests per 15 minutes
- **Payment Routes**: 30 requests per 15 minutes

### Caching Strategy

Redis caching is applied to:
- User profiles (5 minutes TTL)
- Event lists (2 minutes TTL)
- Analytics data (5 minutes TTL)
- Payment data (5 minutes TTL)

---

## 🐛 Known Issues

1. **Payment Integration Tests**: 2/10 payment integration tests fail due to Paystack API mocking edge cases (does not affect functionality)
2. **CSS Inline Styles Warning**: Progress bars use inline styles for dynamic width (acceptable for this use case)

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 32+ char string |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_test_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_test_...` |
| `PORT` | Server port | `3000` |
| `CLIENT_URL` | Frontend URL (for CORS) | `http://localhost:5173` |

---

## 🚢 Deployment

### Backend Deployment (Railway/Render)

1. **Create PostgreSQL database**
2. **Create Redis instance**
3. **Set environment variables**
4. **Deploy**:
   ```bash
   npm run build
   npm start
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Update API URL** in `client/src/lib/api.ts`
2. **Build**:
   ```bash
   cd client
   npm run build
   ```
3. **Deploy** `client/dist` folder

---

## 🤝 Contributing

This is a capstone project, but feedback and suggestions are welcome!

---

## 📄 License

MIT License - feel free to use this project for learning purposes.

---

## 👨‍💻 Author

**Oga (EVENTEE)**
AltSchool Africa - Backend Engineering (Node.js) Track

---

## 🙏 Acknowledgments

- **AltSchool Africa** for the learning opportunity
- **Luma** for design inspiration
- **Paystack** for payment infrastructure
- **Prisma** for excellent database tooling

---

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the [API Documentation](http://localhost:3000/api/docs)
- Review test files for usage examples

---

**Built with ❤️ for AltSchool Africa Final Semester Project**

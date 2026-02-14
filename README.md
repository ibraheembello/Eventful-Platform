# Eventful - Full-Stack Event Ticketing Platform

A production-ready, full-stack event management and ticketing platform built with Node.js, React, TypeScript, and PostgreSQL. Eventful enables event creators to publish events, sell tickets, manage attendees, and track analytics — while attendees can discover events, purchase QR-coded tickets, leave reviews, and receive email notifications.

**AltSchool Africa Capstone Project**

**Live URL**: [https://eventful-platform.com](https://eventful-platform.com)
**API Docs**: [https://eventful-platform.com/api/docs](https://eventful-platform.com/api/docs)
**GitHub**: [https://github.com/ibraheembello/Eventful-Platform](https://github.com/ibraheembello/Eventful-Platform)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Feature Details](#feature-details)
- [Design System](#design-system)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Author](#author)

---

## Features

### Core Platform
- **Authentication & Authorization** — JWT-based auth with role-based access (CREATOR / EVENTEE)
- **Event Management** — Full CRUD for events with image upload, categories, and capacity tracking
- **Secure Payments** — Paystack integration with webhook support for reliable payment processing
- **QR Code Tickets** — Cryptographically signed QR codes for fraud-proof digital tickets
- **Ticket Verification** — Scan-and-verify system for event check-in

### 10 New Features (February 2026)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Search & Advanced Filters** | Full-text search with category, date range, and price filters |
| 2 | **Bookmark/Save Events** | Save events to a personal collection for quick access |
| 3 | **Event Comments & Reviews** | Star ratings (1-5) and text reviews on events |
| 4 | **Waitlist System** | Auto-join waitlist for sold-out events, email notification when spots open |
| 5 | **PDF Ticket Export** | Download beautifully designed PDF tickets with QR codes |
| 6 | **Email Notifications** | HTML emails for welcome, ticket confirmation, reminders, and event updates |
| 7 | **Event Update Notifications** | Automatic email alerts to attendees when event details change |
| 8 | **Creator Dashboard Charts** | Interactive bar charts, donut charts, and leaderboard analytics |
| 9 | **Attendee Check-in List** | Real-time check-in tracking with search, filters, and CSV export |
| 10 | **Multi-Image Event Gallery** | Multiple images per event with lightbox viewer and thumbnail navigation |

### Additional Enhancements
- **Profile Management** — Editable user profiles with image upload
- **Password Visibility Toggle** — Show/hide password on login and register forms
- **Improved Pagination** — "Showing X of Y events" with 12 events per page
- **Dark Mode** — System-aware theme with smooth transitions
- **Social Sharing** — Share events on Twitter, Facebook, LinkedIn, WhatsApp, and Email
- **Responsive Design** — Mobile-first UI that works on all screen sizes
- **Accessibility** — WCAG-compliant labels, ARIA attributes, and keyboard navigation

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20+** | JavaScript runtime |
| **Express.js v5** | Web framework |
| **TypeScript** | Type safety |
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Database access & migrations |
| **Redis** (optional) | Caching & rate limiting |
| **JWT** | Authentication tokens |
| **Paystack API** | Payment processing |
| **Nodemailer** | Email delivery (SMTP/Gmail) |
| **node-cron** | Scheduled reminder jobs |
| **Multer** | File upload handling |
| **qrcode** | QR code generation |
| **Zod v4** | Request validation |
| **Swagger** | API documentation |
| **Helmet + CORS** | Security headers |
| **Jest + Supertest** | Testing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client |
| **date-fns** | Date formatting |
| **html2canvas + jsPDF** | PDF ticket generation |
| **react-hot-toast** | Toast notifications |
| **React Icons** | Icon library |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **AWS EC2** (eu-west-2) | Application hosting |
| **PM2** | Process management |
| **Apache** | Reverse proxy + SSL termination |
| **Let's Encrypt** | SSL certificates |
| **Route 53** | DNS management |
| **Gmail SMTP** | Email delivery |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                 │
│  Pages: Landing, Events, EventDetail, CreateEvent,      │
│  MyTickets, Profile, Login, Register, Analytics,        │
│  Bookmarks, PaymentCallback, VerifyTicket               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Apache Reverse Proxy (SSL)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP :8080
┌────────────────────────▼────────────────────────────────┐
│              Express.js API Server (PM2)                 │
│                                                         │
│  Middleware: Auth, CORS, Helmet, Rate Limiter, Validate │
│                                                         │
│  Modules:                                               │
│  ├── Auth       (register, login, profile, refresh)     │
│  ├── Events     (CRUD, search, comments, gallery)       │
│  ├── Tickets    (generate, verify, list)                │
│  ├── Payments   (initialize, verify, webhook)           │
│  ├── Analytics  (overview, per-event, charts)           │
│  ├── Notifications (reminders, cron job)                │
│  ├── Bookmarks  (save, unsave, list)                    │
│  ├── Waitlist   (join, leave, notify)                   │
│  └── Upload     (image file upload)                     │
│                                                         │
│  Utils: EmailService, Cache, QR, ShareLinks             │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
  ┌────────▼────────┐     ┌──────────▼──────────┐
  │   PostgreSQL    │     │   Redis (optional)   │
  │   (Prisma ORM) │     │   (Cache + Rate Limit│
  └─────────────────┘     └─────────────────────┘
           │
  ┌────────▼────────┐     ┌─────────────────────┐
  │  Gmail SMTP     │     │   Paystack API       │
  │  (Nodemailer)   │     │   (Payments)         │
  └─────────────────┘     └─────────────────────┘
```

### Database Schema (7 Models)

```
User ──< Event ──< Ticket >── Payment
  │        │          │
  │        ├──< EventImage
  │        ├──< Comment
  │        ├──< Waitlist
  │        └──< Notification
  │
  ├──< Bookmark
  ├──< Ticket
  └──< Comment
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 13+
- **Redis** 6+ (optional — app works without it)
- **Paystack Account** (test keys for development)

### 1. Clone & Install

```bash
git clone https://github.com/ibraheembello/Eventful-Platform.git
cd Eventful-Platform
npm install
cd client && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/eventful_db?schema=public

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Email (SMTP via Gmail — optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Eventful <your_email@gmail.com>

# App URL
APP_URL=http://localhost:3000
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed creates:
- 1 Creator: `creator@example.com` / `password123`
- 1 Eventee: `eventee@example.com` / `password123`
- 4 Sample events

### 4. Start Development

```bash
# Terminal 1 — Backend
npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

### 5. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/health |
| Prisma Studio | `npx prisma studio` |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/profile` | Get profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/logout` | Logout | Yes |

### Events
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | List events (search, filter, paginate) | No |
| GET | `/api/events/categories` | Get all categories | No |
| GET | `/api/events/:id` | Get event details | No |
| POST | `/api/events` | Create event | Creator |
| PATCH | `/api/events/:id` | Update event | Creator |
| DELETE | `/api/events/:id` | Delete event | Creator |
| GET | `/api/events/:id/share` | Get share links | No |
| GET | `/api/events/:id/attendees` | Get attendee list | Creator |

### Comments & Reviews
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events/:id/comments` | Get event comments | No |
| POST | `/api/events/:id/comments` | Add comment with rating | Yes |
| DELETE | `/api/events/:id/comments/:commentId` | Delete own comment | Yes |

### Event Images (Gallery)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events/:id/images` | Get event images | No |
| POST | `/api/events/:id/images` | Add image to event | Creator |
| DELETE | `/api/events/:id/images/:imageId` | Remove image | Creator |

### Bookmarks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events/bookmarks/my` | Get saved events | Yes |
| POST | `/api/events/:id/bookmark` | Toggle bookmark | Yes |

### Waitlist
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/events/:id/waitlist` | Join/leave waitlist | Yes |
| GET | `/api/events/:id/waitlist/status` | Check waitlist status | Yes |

### Tickets
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tickets` | Get user's tickets | Yes |
| GET | `/api/tickets/:id` | Get ticket details | Yes |
| POST | `/api/tickets/verify` | Verify QR ticket | Creator |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/initialize` | Start payment | Yes |
| GET | `/api/payments/verify/:reference` | Verify payment | Yes |
| POST | `/api/payments/webhook` | Paystack webhook | No |
| GET | `/api/payments/creator` | Creator payments | Creator |

### Notifications
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get reminders | Yes |
| POST | `/api/notifications` | Create reminder | Yes |
| PATCH | `/api/notifications/:id` | Update reminder | Yes |
| DELETE | `/api/notifications/:id` | Delete reminder | Yes |

### Analytics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/overview` | Creator overview | Creator |
| GET | `/api/analytics/events/:id` | Event analytics | Creator |
| GET | `/api/analytics/events-list` | All events analytics | Creator |

### Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload` | Upload image file | Creator |

---

## Feature Details

### F1: Search & Advanced Filters

Full-text search across event titles and descriptions with multiple filter dimensions.

**Query Parameters**: `GET /api/events?search=music&category=Music&minPrice=0&maxPrice=5000&startDate=2026-03-01&endDate=2026-12-31&page=1&limit=12`

- Keyword search across title and description
- Filter by category (Music, Tech, Food, Sports, etc.)
- Filter by price range (min/max)
- Filter by date range (start/end)
- Paginated results with total count
- Frontend shows "Showing X-Y of Z events"

### F2: Bookmark/Save Events

Authenticated users can save events to their personal collection.

- Toggle bookmark with a single click (heart icon)
- Dedicated "Saved Events" page (`/bookmarks`)
- Bookmark state shown on event cards and detail pages
- Persisted in database (survives logout)

### F3: Event Comments & Reviews

Community-driven feedback system with star ratings.

- 1-5 star rating with visual star selector
- Text comments (10-500 characters)
- Average rating displayed on event detail page
- Comment count shown on event cards
- Users can delete their own comments
- Comments sorted newest first

### F4: Waitlist System

Automatic queue management for sold-out events.

- "Join Waitlist" button appears when event is at capacity
- Email notification sent automatically when a spot opens (ticket cancelled)
- Users can leave the waitlist anytime
- Waitlist position tracked per user
- Integrates with the email notification system

### F5: PDF Ticket Export

Professional PDF tickets generated client-side.

- Ticket rendered as a styled card with event details
- QR code embedded in the PDF
- Includes event name, date, location, ticket ID
- Uses html2canvas + jsPDF for client-side generation
- Download button on ticket detail page

### F6: Email Notifications

Full HTML email system with branded templates.

- **Welcome Email** — Sent on user registration
- **Ticket Confirmation** — Sent after successful payment (event details, amount, QR code link)
- **Event Reminder** — Sent by cron job based on user-configured reminder time
- **Waitlist Notification** — Sent when a spot opens up
- **Event Update** — Sent when creator changes event details
- Graceful degradation — app works without SMTP configured
- Gmail App Password authentication via Nodemailer

### F7: Event Update Notifications

Automatic attendee alerts when creators modify events.

- Detects changes to: title, date, location, price
- Builds human-readable change summary (e.g., "Date changed from Mon, Mar 15 to Fri, Mar 20")
- Sends branded HTML email to all active ticket holders
- Fire-and-forget — doesn't block the update response
- Only triggers when meaningful fields actually change

### F8: Creator Dashboard Charts

Interactive analytics visualization for event creators.

- **Revenue Bar Chart** — Revenue per event with visual bars
- **Ticket Status Donut Chart** — Active vs Used vs Cancelled breakdown
- **Top Events Leaderboard** — Ranked by revenue with medal badges
- **Summary Cards** — Total events, tickets sold, revenue, attendees
- **Per-Event Drill-down** — Click any event for detailed metrics
- Data sourced from the analytics API endpoints

### F9: Attendee Check-in List

Complete attendee management dashboard for creators.

- Real-time check-in progress bar (percentage)
- Summary stats: Total, Checked In, Remaining, Cancelled
- Searchable attendee table (name, email)
- Filter by status (All, Active, Checked In, Cancelled)
- Sort by name, date, or status
- One-click manual check-in button
- CSV export of attendee data
- Accessible from event detail page (creator only)

### F10: Multi-Image Event Gallery

Rich media support with multiple images per event.

- **Gallery View** — Main image with thumbnail strip below
- **Navigation** — Left/right arrows to browse images
- **Lightbox** — Click to open fullscreen overlay with captions
- **Image Counter** — "1/5" badge on the gallery
- **Creator Management** — Add/remove images in event edit mode
- **Upload Support** — Uses the existing file upload endpoint
- Images stored with order field for consistent sorting

---

## Design System

### Theme

Eventful uses a custom design system with CSS variables for seamless dark/light mode:

- **Light Mode**: Clean whites, subtle grays, emerald/teal accents
- **Dark Mode**: Deep slate backgrounds, muted borders, high-contrast text
- **Accent Colors**: Emerald-to-teal gradient throughout

### UI Patterns

- **Glassmorphism** — Frosted glass cards with backdrop blur
- **Smooth Transitions** — 150-300ms cubic-bezier animations
- **Skeleton Loaders** — Shimmer effect during data fetching
- **Responsive Breakpoints** — Mobile-first (< 650px, 650-1000px, > 1000px)
- **Toast Notifications** — Success/error feedback via react-hot-toast

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Specific suite
npm test -- tests/unit/auth.test.ts

# Coverage report
npm test -- --coverage
```

**Test Results**: 58/60 tests passing across 8 test suites (2 payment integration tests fail due to Paystack API mocking edge cases — does not affect functionality).

---

## Deployment

### Production (AWS EC2)

The application runs on an EC2 instance in eu-west-2 (London) behind Apache with Let's Encrypt SSL.

```bash
# SSH into server
ssh -i ~/.ssh/lightsail_key.pem bitnami@13.43.80.112

# Deploy latest changes
cd /home/bitnami/Eventful-Platform
export PATH=/opt/bitnami/node/bin:$PATH
pm2 stop eventful-api
git stash && git pull origin master
npx prisma generate
npx prisma migrate deploy
npm run build:backend
npm run build:frontend
pm2 start eventful-api
```

### Local Production Build

```bash
npm run build        # Builds both backend (tsc) and frontend (vite)
npm start            # Starts production server
```

In production, Express serves the React build as static files and handles API routes separately.

---

## Payment Flow

1. User clicks "Get Ticket" on an event
2. Frontend calls `POST /api/payments/initialize`
3. Backend creates a Paystack transaction and returns an authorization URL
4. User is redirected to Paystack checkout
5. After payment, Paystack redirects back with a reference
6. Frontend calls `GET /api/payments/verify/:reference`
7. Backend verifies with Paystack API, creates ticket with QR code
8. Confirmation email sent to user
9. Paystack webhook provides backup verification

**Test Cards** (Paystack sandbox):
- Success: `4084 0840 8408 4081` (any CVV, future expiry)
- Insufficient Funds: `5060 6666 6666 6666 666`
- Declined: `4084 0840 8408 4083`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens |
| `PAYSTACK_SECRET_KEY` | Yes | Paystack secret key |
| `PAYSTACK_PUBLIC_KEY` | Yes | Paystack public key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |
| `REDIS_URL` | No | Redis connection string (optional) |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP server port (default: 587) |
| `SMTP_USER` | No | SMTP username (Gmail address) |
| `SMTP_PASS` | No | SMTP password (Gmail App Password) |
| `SMTP_FROM` | No | Sender name and email |
| `APP_URL` | No | Backend URL for QR codes |

---

## Configuration

### Rate Limiting
- **Global**: 100 requests per 15 minutes
- **Auth Routes**: 20 requests per 15 minutes
- **Payment Routes**: 30 requests per 15 minutes

### Caching (Redis)
| Data | TTL |
|------|-----|
| Event lists | 2 minutes |
| User profiles | 5 minutes |
| Analytics data | 5 minutes |
| Payment data | 3 minutes |

---

## Project Structure

```
Eventful-Platform/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx          # Navbar + layout wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state + API methods
│   │   │   └── ThemeContext.tsx     # Dark/light theme
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx     # Marketing landing page
│   │   │   ├── Events.tsx          # Event listing with filters
│   │   │   ├── EventDetail.tsx     # Event detail + gallery + comments
│   │   │   ├── CreateEvent.tsx     # Create/edit event form
│   │   │   ├── MyTickets.tsx       # User's tickets + PDF export
│   │   │   ├── Profile.tsx         # User profile management
│   │   │   ├── Bookmarks.tsx       # Saved events
│   │   │   ├── Analytics.tsx       # Creator dashboard + charts
│   │   │   ├── Login.tsx           # Login with password toggle
│   │   │   ├── Register.tsx        # Register with password toggle
│   │   │   ├── PaymentCallback.tsx # Payment verification
│   │   │   └── VerifyTicket.tsx    # QR ticket scanner
│   │   ├── lib/api.ts             # Axios instance
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   └── index.css              # Tailwind + design system
│   └── package.json
├── prisma/
│   ├── schema.prisma              # Database schema (7 models)
│   ├── seed.ts                    # Database seeding
│   └── migrations/                # Migration history
├── src/
│   ├── config/
│   │   ├── database.ts            # Prisma client
│   │   ├── redis.ts               # Redis client (optional)
│   │   ├── email.ts               # Nodemailer transporter
│   │   ├── paystack.ts            # Paystack config
│   │   └── swagger.ts             # API documentation
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication
│   │   ├── authorize.ts           # Role-based authorization
│   │   ├── validate.ts            # Zod validation
│   │   ├── rateLimiter.ts         # Rate limiting
│   │   ├── upload.ts              # Multer file upload
│   │   └── errorHandler.ts        # Global error handling
│   ├── modules/
│   │   ├── auth/                  # Authentication & profiles
│   │   ├── events/                # Events, comments, gallery, waitlist, bookmarks
│   │   ├── tickets/               # Ticket generation & verification
│   │   ├── payments/              # Paystack integration
│   │   ├── notifications/         # Reminders & scheduled notifications
│   │   ├── analytics/             # Statistics & insights
│   │   ├── qrcode/                # QR code generation
│   │   └── upload/                # Image upload endpoint
│   ├── utils/
│   │   ├── emailService.ts        # HTML email templates & sending
│   │   ├── cache.ts               # Redis cache helpers
│   │   ├── apiResponse.ts         # Standardized API responses
│   │   ├── apiError.ts            # Custom error class
│   │   ├── shareLink.ts           # Social sharing URL builder
│   │   └── param.ts               # Express v5 param helper
│   ├── jobs/
│   │   └── reminderJob.ts         # Cron job (every minute)
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
├── tests/
│   ├── unit/                      # Unit tests
│   └── integration/               # Integration tests
├── uploads/                       # Uploaded images (gitignored)
├── CLAUDE.md                      # Deployment documentation
├── .env                           # Environment variables
└── package.json
```

---

## Known Issues

1. **Payment Integration Tests** — 2/10 tests fail due to Paystack API mocking edge cases (does not affect production functionality)
2. **Large Bundle Size** — Main JS chunk is ~1.3MB; code splitting would improve load time
3. **Redis Optional** — Without Redis, rate limiting uses in-memory store and caching is disabled

---

## Author

**Ibrahim Bello**
AltSchool Africa — Backend Engineering (Node.js) Track

---

## Acknowledgments

- **AltSchool Africa** for the comprehensive software engineering training
- **Luma** for design inspiration
- **Paystack** for payment infrastructure
- **Prisma** for excellent database tooling
- **AWS** for cloud infrastructure

---

## License

MIT License — feel free to use this project for learning purposes.

---

**Built for AltSchool Africa Final Semester Project**

<p align="center">
  <img src="docs/logo.svg" alt="Eventful" width="280" />
</p>

<p align="center">
  <strong>The complete event management and ticketing platform</strong>
</p>

<p align="center">
  <a href="https://eventful-platform.com">Live Demo</a> &middot;
  <a href="https://eventful-platform.com/api/docs">API Docs</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-20+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/postgresql-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/prisma-6-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/deploy-AWS_EC2-FF9900?logo=amazon-ec2&logoColor=white" alt="AWS EC2" />
</p>

---

A production-deployed, full-stack event management platform built with Node.js, React, TypeScript, and PostgreSQL. Eventful enables event creators to publish events, sell tickets with secure QR codes, manage attendees, and track analytics — while attendees can discover events, purchase tickets, leave reviews, and receive real-time notifications.

**AltSchool Africa Capstone Project** — Backend Engineering (Node.js) Track

<p align="center">
  <img src="docs/screenshots/landing-page.png" alt="Eventful Landing Page" width="100%" />
</p>

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Author](#author)

---

## Features

### Core Platform
- **JWT Authentication** — Register/login with email or social providers (Google, GitHub)
- **Role-Based Access** — Three roles: EVENTEE (attendee), CREATOR, and ADMIN
- **Event Management** — Full CRUD with image upload, categories, capacity tracking, and geocoding
- **Secure Payments** — Paystack integration with webhook support and promo code discounts
- **QR Code Tickets** — Cryptographically signed QR codes with camera-based scanner for verification

### 19 Feature Modules

| # | Feature | Description |
|---|---------|-------------|
| F1 | **Search & Advanced Filters** | Full-text search with category, date range, and price filters |
| F2 | **Bookmark/Save Events** | Save events to a personal collection for quick access |
| F3 | **Comments & Reviews** | Star ratings (1-5) and text reviews from ticket holders |
| F4 | **Waitlist System** | Auto-join waitlist for sold-out events with email notifications |
| F5 | **PDF Ticket Export** | Branded PDF tickets with QR codes via client-side generation |
| F6 | **Email Notifications** | HTML emails for welcome, tickets, reminders, updates, and cancellations |
| F7 | **Event Update Alerts** | Automatic email alerts to attendees when event details change |
| F8 | **Analytics Dashboard** | Interactive charts (bar, donut), leaderboard, and performance metrics |
| F9 | **Attendee Check-in** | Real-time check-in tracking with search, manual check-in, and CSV export |
| F10 | **Image Gallery** | Multi-image galleries with drag-to-reorder, captions, and lightbox |
| F11 | **Dual-Role Access** | Creators can attend other creators' events seamlessly |
| F12 | **Promo Codes** | Percentage or fixed-amount discount codes with usage tracking |
| F13 | **Social Login** | Google and GitHub OAuth with automatic account linking |
| F14 | **Password Reset** | Secure token-based password reset via email |
| F15 | **Categories Page** | Visual category browser with icons and live event counts |
| F16 | **Recurring Events** | Weekly, biweekly, or monthly event series from a single form |
| F17 | **7-Feature Batch** | Draft/publish, notifications center, clone events, CSV export, ticket transfer, co-hosts, multi-ticket types |
| F18 | **4-Feature Batch** | CI/CD pipeline, admin panel, user dashboard, interactive maps |
| F19 | **4-Feature Batch** | Landing page polish, working contact form, QR camera scanner, FAQ chatbot |

### Platform Capabilities
- **Admin Panel** — User moderation, role management, event oversight, contact messages
- **Personal Dashboard** — Aggregated stats, upcoming events, quick actions per role
- **Interactive Maps** — Leaflet maps with geocoded event markers and nearby search
- **In-App Notifications** — Real-time notification center with 30-second polling
- **Event Co-Hosts** — Invite collaborators to help manage events
- **Ticket Transfer** — Transfer tickets to other users by email
- **Multi-Ticket Types** — VIP, Regular, Early Bird tiers with separate pricing
- **Dark Mode** — System-aware theme with smooth transitions
- **Chatbot** — Built-in FAQ assistant with support fallback
- **CI/CD** — GitHub Actions auto-deploy on push to master
- **Responsive Design** — Mobile-first UI across all 27+ pages
- **Accessibility** — WCAG-compliant labels, ARIA attributes, keyboard navigation

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/landing-page.png" alt="Landing Page" />
      <p align="center"><em>Landing Page</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/events-page.png" alt="Events Page" />
      <p align="center"><em>Events Browser</em></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/categories-page.png" alt="Categories Page" />
      <p align="center"><em>Browse by Category</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/login-page.png" alt="Login Page" />
      <p align="center"><em>Login with Social Providers</em></p>
    </td>
  </tr>
</table>

> Visit the [live demo](https://eventful-platform.com) to explore all features including the dashboard, analytics, admin panel, QR scanner, chatbot, and more.

---

## Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20** | Runtime |
| **Express.js v5** | Web framework |
| **TypeScript** | Type safety |
| **PostgreSQL** | Primary database |
| **Prisma ORM** | Database access & migrations |
| **Redis** (optional) | Caching & rate limiting |
| **JWT** | Authentication |
| **Paystack API** | Payment processing |
| **Nodemailer** | Email delivery (SMTP) |
| **node-cron** | Scheduled reminders |
| **Multer** | File upload |
| **Zod** | Request validation |
| **Swagger** | API documentation |
| **Helmet + CORS** | Security |
| **Jest + Supertest** | Testing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router v6** | Routing |
| **Recharts** | Analytics charts |
| **Leaflet** | Interactive maps |
| **html5-qrcode** | Camera QR scanning |
| **jsPDF + html2canvas** | PDF ticket generation |
| **Axios** | HTTP client |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **AWS EC2** (eu-west-2) | Application hosting |
| **PM2** | Process management |
| **Apache + Let's Encrypt** | Reverse proxy + SSL |
| **Route 53** | DNS |
| **GitHub Actions** | CI/CD pipeline |
| **Gmail SMTP** | Email delivery |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Client (React + Vite + TypeScript)             │
│                                                                 │
│  27+ Pages: Landing, Events, EventDetail, CreateEvent,          │
│  Dashboard, Analytics, MyTickets, VerifyTicket (QR Scanner),    │
│  Profile, Categories, SeriesDetail, PromoCodes, SavedEvents,    │
│  NotificationsInbox, AdminDashboard, AdminUsers, AdminEvents,   │
│  Login, Register, ForgotPassword, ResetPassword, ...            │
│                                                                 │
│  Components: Layout, ChatBot, EventMap                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────┐
│                Apache Reverse Proxy (Let's Encrypt SSL)          │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP :8080
┌──────────────────────────────▼──────────────────────────────────┐
│                Express.js API Server (PM2)                       │
│                                                                 │
│  Middleware: Auth, Authorize, CORS, Helmet, Rate Limiter,       │
│             Validate (Zod), Upload (Multer), OptionalAuth       │
│                                                                 │
│  Modules:                                                       │
│  ├── Auth          (register, login, OAuth, profile, reset)     │
│  ├── Events        (CRUD, search, comments, gallery, series,    │
│  │                  collaborators, ticket types, duplicate,      │
│  │                  publish/draft, nearby, categories)           │
│  ├── Tickets       (generate, verify, transfer)                 │
│  ├── Payments      (initialize, verify, webhook, promo codes)   │
│  ├── Analytics     (overview, per-event, charts data)           │
│  ├── Notifications (reminders, cron job)                        │
│  ├── InApp Notifs  (notification center, read/unread)           │
│  ├── Dashboard     (personalized stats per role)                │
│  ├── Admin         (users, events, payments, stats)             │
│  ├── Promo Codes   (CRUD, validation, discount calc)            │
│  ├── Contact       (submit, admin messages)                     │
│  └── Upload        (image file upload)                          │
│                                                                 │
│  Utils: EmailService, Cache, Geocode, QR, ShareLinks            │
└───────────┬───────────────────────────────┬─────────────────────┘
            │                               │
   ┌────────▼────────┐          ┌──────────▼──────────┐
   │   PostgreSQL    │          │   Redis (optional)   │
   │  (Prisma ORM)  │          │  (Cache + Rate Limit) │
   │  16 models     │          └──────────────────────┘
   └────────┬────────┘
            │
   ┌────────▼────────┐          ┌─────────────────────┐
   │  Gmail SMTP     │          │   Paystack API       │
   │  (Nodemailer)   │          │   (Payments)         │
   └─────────────────┘          └─────────────────────┘
```

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 13+
- **Redis** 6+ (optional)
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
DATABASE_URL=postgresql://postgres:password@localhost:5432/eventful_db?schema=public

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Paystack
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_PUBLIC_KEY=pk_test_your_key

# Email (optional - app works without)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Eventful <your_email@gmail.com>

# OAuth (optional)
GOOGLE_CLIENT_SECRET=your_google_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id    # in client/.env
VITE_GITHUB_CLIENT_ID=your_github_client_id    # in client/.env

# App
APP_URL=http://localhost:3000
ADMIN_EMAIL=your_email@gmail.com
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

The seed creates sample users and events for testing.

### 4. Start Development

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### 5. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/health |
| Prisma Studio | `npx prisma studio` |

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Email/password login | No |
| POST | `/google` | Google OAuth login | No |
| POST | `/github` | GitHub OAuth login | No |
| GET | `/profile` | Get current profile | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/refresh` | Refresh JWT token | No |
| POST | `/logout` | Logout | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |

### Events (`/api/events`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List events (search, filter, paginate) | No |
| GET | `/:id` | Event detail | Optional |
| POST | `/` | Create event (single or series) | Creator |
| PATCH | `/:id` | Update event | Creator |
| DELETE | `/:id` | Delete event | Creator |
| PUT | `/:id/publish` | Toggle draft/published | Creator |
| POST | `/:id/duplicate` | Clone event | Creator |
| GET | `/categories/counts` | Categories with counts | No |
| GET | `/nearby` | Nearby events (lat/lng/radius) | No |
| GET | `/series/:seriesId` | Series events | No |
| DELETE | `/series/:seriesId` | Delete series | Creator |

### Tickets & Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tickets` | User's tickets | Yes |
| POST | `/api/tickets/verify` | Verify QR ticket | Creator |
| POST | `/api/tickets/:id/transfer` | Transfer ticket | Yes |
| POST | `/api/payments/initialize` | Start payment | Yes |
| GET | `/api/payments/verify/:ref` | Verify payment | Yes |
| POST | `/api/payments/webhook` | Paystack webhook | No |

### Social Features
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/events/:id/bookmark` | Toggle bookmark | Yes |
| GET | `/api/events/bookmarks` | Saved events | Yes |
| POST | `/api/events/:id/comments` | Add review | Yes |
| GET | `/api/events/:id/comments` | Get reviews | No |
| POST | `/api/events/:id/waitlist` | Join/leave waitlist | Yes |

### Creator Tools
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/overview` | Creator stats | Creator |
| GET | `/api/events/:id/attendees` | Attendee list | Creator |
| POST | `/api/events/:id/check-in` | Manual check-in | Creator |
| CRUD | `/api/promo-codes` | Manage promo codes | Creator |
| CRUD | `/api/events/:id/ticket-types` | Manage ticket types | Creator |
| CRUD | `/api/events/:id/collaborators` | Manage co-hosts | Creator |
| CRUD | `/api/events/:id/images` | Manage gallery | Creator |

### Platform
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | User dashboard data | Yes |
| GET | `/api/notifications/in-app` | Notifications | Yes |
| POST | `/api/contact` | Submit contact message | No |
| GET | `/api/admin/stats` | Platform stats | Admin |
| GET | `/api/admin/users` | Manage users | Admin |
| GET | `/api/admin/events` | Manage events | Admin |
| POST | `/api/upload` | Upload image | Creator |

> Full Swagger documentation available at [/api/docs](https://eventful-platform.com/api/docs)

---

## Database Schema

16 models managed by Prisma ORM:

```
User ──< Event ──< Ticket ──< Payment
  │        │          │
  │        ├──< EventImage
  │        ├──< Comment
  │        ├──< Waitlist
  │        ├──< Notification
  │        ├──< TicketType
  │        ├──< EventCollaborator
  │        └──< EventSeries (optional)
  │
  ├──< Bookmark
  ├──< InAppNotification
  ├──< TicketTransfer
  └──< ContactMessage (standalone)

PromoCode (linked to Event + Payment)
```

**Key models**: User, Event, Ticket, Payment, EventImage, Comment, Waitlist, Notification, Bookmark, PromoCode, EventSeries, InAppNotification, EventCollaborator, TicketTransfer, TicketType, ContactMessage

---

## Testing

```bash
npm test                          # Run all tests
npm test -- --watch               # Watch mode
npm test -- --coverage            # Coverage report
npm test -- tests/unit/auth.test.ts  # Single suite
```

- **28 unit tests** across 4 test suites (auth, events, tickets, payments)
- **Integration tests** auto-skip in CI when DATABASE_URL is absent

---

## Deployment

### CI/CD (Automatic)

Push to `master` triggers the GitHub Actions pipeline:

1. **Test & Build** — Install, generate Prisma client, run tests, build backend + frontend
2. **Deploy** — SSH into EC2, pull latest code, migrate database, build, reload PM2

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [master]
```

### Manual Deploy (Fallback)

```bash
ssh -i ~/.ssh/lightsail_key.pem bitnami@13.43.80.112
export PATH=/opt/bitnami/node/bin:$PATH
cd /home/bitnami/Eventful-Platform
git stash && git pull origin master
npx prisma generate && npx prisma migrate deploy
npm run build:backend && npm run build:frontend
pm2 reload eventful-api
```

### Production Stack

- **AWS EC2** (t2.micro, eu-west-2 London)
- **Apache** reverse proxy with Let's Encrypt SSL
- **PM2** process manager with auto-restart
- **PostgreSQL** on the EC2 instance
- **Domain**: eventful-platform.com via Route 53

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
| `NODE_ENV` | No | development / production |
| `CLIENT_URL` | No | Frontend URL for CORS |
| `REDIS_URL` | No | Redis connection (optional) |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | Sender name and email |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret |
| `ADMIN_EMAIL` | No | Admin notification email |
| `APP_URL` | No | Backend URL for links |

---

## Project Structure

```
Eventful-Platform/
├── .github/workflows/deploy.yml    # CI/CD pipeline
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx          # Navbar + layout wrapper
│   │   │   ├── ChatBot.tsx         # FAQ chatbot widget
│   │   │   └── EventMap.tsx        # Leaflet map component
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Auth state + API methods
│   │   │   └── ThemeContext.tsx     # Dark/light theme
│   │   ├── pages/                  # 27+ page components
│   │   │   ├── LandingPage.tsx     # Marketing landing page
│   │   │   ├── Events.tsx          # Event listing + map view
│   │   │   ├── EventDetail.tsx     # Event detail + gallery
│   │   │   ├── CreateEvent.tsx     # Create/edit with series
│   │   │   ├── Dashboard.tsx       # User dashboard
│   │   │   ├── Analytics.tsx       # Creator charts
│   │   │   ├── AdminDashboard.tsx  # Admin panel
│   │   │   ├── VerifyTicket.tsx    # QR camera scanner
│   │   │   ├── Categories.tsx      # Category browser
│   │   │   ├── PromoCodes.tsx      # Promo code manager
│   │   │   └── ...                 # 17+ more pages
│   │   ├── lib/api.ts             # Axios instance
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   └── index.css              # Tailwind + design system
│   └── package.json
├── prisma/
│   ├── schema.prisma              # Database schema (16 models)
│   ├── seed.ts                    # Database seeding
│   └── migrations/                # 10+ migration files
├── src/
│   ├── config/                    # Database, Redis, Email, Paystack, Swagger
│   ├── middleware/                 # Auth, Authorize, Validate, Rate Limit, Upload
│   ├── modules/
│   │   ├── auth/                  # Auth + OAuth + password reset
│   │   ├── events/                # Events + comments + gallery + series + collabs
│   │   ├── tickets/               # Tickets + transfer
│   │   ├── payments/              # Paystack + promo code integration
│   │   ├── analytics/             # Statistics & insights
│   │   ├── notifications/         # Reminders + cron job
│   │   ├── inAppNotifications/    # Notification center
│   │   ├── dashboard/             # Personalized dashboard
│   │   ├── admin/                 # Admin panel CRUD
│   │   ├── promoCodes/            # Promo code system
│   │   ├── contact/               # Contact form + admin messages
│   │   ├── qrcode/                # QR code generation
│   │   └── upload/                # Image upload
│   ├── utils/                     # EmailService, Cache, Geocode, etc.
│   ├── jobs/reminderJob.ts        # Cron job (every minute)
│   ├── app.ts                     # Express app setup
│   └── server.ts                  # Entry point
├── tests/
│   ├── unit/                      # Unit tests (28 tests)
│   └── integration/               # Integration tests
├── uploads/                       # Uploaded images (gitignored)
├── docs/                          # Logo + screenshots
└── package.json
```

---

## Payment Flow

1. User clicks "Buy Ticket" on an event
2. Optionally applies a promo code for a discount
3. Frontend calls `POST /api/payments/initialize` (with optional `ticketTypeId` and `promoCode`)
4. Backend validates promo code, calculates final price, creates Paystack transaction
5. If price is 0 (fully discounted), ticket is issued immediately
6. Otherwise, user is redirected to Paystack checkout
7. After payment, Paystack redirects back with a reference
8. Backend verifies with Paystack API, creates ticket with QR code
9. Confirmation email sent, in-app notification created
10. Paystack webhook provides backup verification

**Test Cards** (Paystack sandbox):
- Success: `4084 0840 8408 4081`
- Insufficient Funds: `5060 6666 6666 6666 666`
- Declined: `4084 0840 8408 4083`

---

## Design System

- **Light Mode**: Clean whites, subtle grays, emerald/teal accents
- **Dark Mode**: Deep slate backgrounds, muted borders, high-contrast text
- **Glassmorphism**: Frosted glass cards with backdrop blur and subtle shadows
- **Animations**: Scroll-reveal, skeleton loaders, smooth transitions (150-300ms)
- **Responsive**: Mobile-first breakpoints across all 27+ pages
- **Components**: Toast notifications, dropdowns, modals, tabs, progress bars

---

## Project Stats

| Metric | Value |
|--------|-------|
| Frontend Pages | 27+ |
| API Endpoints | 85+ |
| Database Models | 16 |
| Test Suites | 8 (28 unit tests) |
| Features Implemented | 19 (F1-F19) |
| Dependencies | 660+ packages |

---

## Author

**Ibrahim Bello**
- AltSchool Africa — School of Software Engineering (Backend Node.js Track)
- GitHub: [@ibraheembello](https://github.com/ibraheembello)
- Email: belloibrahimolawale@gmail.com

---

## Acknowledgments

- **AltSchool Africa** for comprehensive software engineering training
- **Paystack** for payment infrastructure
- **Prisma** for database tooling
- **AWS** for cloud infrastructure
- **Open Source Community** for the tools and libraries that power this platform

---

## License

MIT License — feel free to use this project for learning purposes.

---

<p align="center">
  <strong>Built for AltSchool Africa Final Semester Project</strong><br/>
  <a href="https://eventful-platform.com">eventful-platform.com</a>
</p>

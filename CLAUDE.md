# Claude Code - Eventful Platform Deployment Documentation

This document captures the complete deployment journey of the Eventful Platform to AWS EC2, including all challenges faced and solutions implemented.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Pre-Deployment Status](#pre-deployment-status)
3. [Deployment Process](#deployment-process)
4. [Challenges & Solutions](#challenges--solutions)
5. [Final Configuration](#final-configuration)
6. [Post-Deployment](#post-deployment)
7. [Key Learnings](#key-learnings)
8. [Quick Reference Commands](#quick-reference-commands)
9. [Feature: Image File Upload](#feature-image-file-upload-february-14-2026)
10. [Feature: Accessibility Fixes](#feature-accessibility-fixes-february-14-2026)
11. [Feature: F18 — CI/CD, Admin Panel, User Dashboard, Event Maps](#feature-f18-cicd-admin-panel-user-dashboard-event-maps--completed-february-21-2026)

---

## Project Overview

**Project Name**: Eventful Platform
**Type**: Full-stack Event Ticketing Platform
**Live URL**: https://eventful-platform.com
**GitHub**: https://github.com/ibraheembello/Eventful-Platform
**API Docs**: https://eventful-platform.com/api/docs

### Tech Stack

**Backend**:
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Paystack Payment Integration

**Frontend**:
- React
- TypeScript
- Vite
- TailwindCSS
- React Router

**Infrastructure**:
- AWS EC2 (eu-west-2 / London)
- PostgreSQL Database
- Node.js + PM2 Process Manager

---

## Pre-Deployment Status

### Features Completed
- Authentication & Authorization
- Event Management (CRUD)
- Ticket Generation with QR Codes
- Ticket Verification System
- Payment Integration (Paystack)
- Analytics Dashboard
- Event Reminders
- Dark Mode UI
- Social Sharing
- All features tested locally

### Issues Fixed Before Deployment
1. **Payment Verification Issue**: Fixed to show "Invalid" on first scan before marking as used
2. **Analytics Not Loading**: Fixed by disabling ad blocker
3. **Success Message After Payment**: Added congratulations message after successful payment
4. **QR Code Verification**: Confirmed working with proper state management

---

## Deployment Process

### Phase 1: Initial Setup

**Date**: February 2026
**Region**: eu-west-2 (London)
**Deployment Method**: AWS EC2 with SSH

#### Resources Created

```bash
# EC2 Instance
Instance Type: t2.micro / t3.micro
Region: eu-west-2 (London)
Static IP: 13.43.80.112
Runtime: Node.js 20 LTS

# Database
PostgreSQL running on the EC2 instance or managed RDS
Database: eventful_production
```

#### AWS Setup Steps

```bash
# 1. Launch EC2 Instance
# - AMI: Amazon Linux 2 / Ubuntu 22.04
# - Instance Type: t2.micro (free tier eligible)
# - Region: eu-west-2 (London)
# - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (App)
# - Key Pair: Create/use existing .pem key

# 2. Connect to EC2 via SSH
ssh -i "your-key.pem" bitnami@13.43.80.112

# 3. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
# Or for Ubuntu:
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt-get install -y nodejs

# 4. Install PM2 (Process Manager)
sudo npm install -g pm2

# 5. Install Git
sudo yum install -y git
# Or for Ubuntu: sudo apt-get install -y git

# 6. Install PostgreSQL
sudo yum install -y postgresql-server postgresql
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
# Or use Amazon RDS for managed PostgreSQL
```

### Phase 2: Environment Configuration

#### Environment Variables Set

```bash
DATABASE_URL=postgresql://eventfuladmin:YOUR_PASSWORD@localhost:5432/eventful_production
NODE_ENV=production
PORT=8080
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
CLIENT_URL=https://eventful-platform.com
```

### Phase 3: Code Modifications for Production

#### 1. Updated package.json

Added postinstall script for automatic build and migration:

```json
{
  "scripts": {
    "postinstall": "npm run build && npx prisma generate && npx prisma migrate deploy",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "tsc",
    "build:frontend": "cd client && npm install && npm run build && cd .."
  }
}
```

#### 2. Modified src/app.ts

Added production mode detection and React frontend serving:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

// Serve React frontend in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');

  // Serve static files from React build
  app.use(express.static(clientBuildPath));

  // Handle React routing - send all non-API requests to index.html
  app.use((_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
```

#### 3. Fixed Frontend TypeScript Issues

**client/src/context/ThemeContext.tsx**:
```typescript
// Fixed type import
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
```

**client/src/types/index.ts**:
```typescript
// Added missing category field
export interface Event {
  // ... other fields
  category?: string;
}
```

---

## Challenges & Solutions

### Challenge 1: Express 5 Wildcard Route Error
**Error**:
```
PathError [TypeError]: Missing parameter name at index 1: *
PathError [TypeError]: Missing parameter name at index 8: /:path(*)
```
**Solution**: Changed from `app.get('*', ...)` and `app.get('/:path(*)', ...)` to `app.use(...)` middleware for catch-all route

### Challenge 2: Redis Connection Failures
**Error**:
```
MaxRetriesPerRequestError: Reached the max retries per request limit (which is 3)
Redis connection error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Made Redis optional throughout the application

#### Files Modified for Redis Optional Support:

**src/config/redis.ts**:
```typescript
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  // ... connection handlers
} else {
  console.log('Redis is not configured - running without cache');
}

export default redis;
```

**src/middleware/rateLimiter.ts**:
```typescript
const sendCommand = redis ? (...args: string[]) => {
  const [command, ...restArgs] = args;
  return redis!.call(command as any, ...restArgs) as any;
} : undefined;

// Use Redis store only if Redis is available
export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 100,
  ...(redis && sendCommand ? { store: new RedisStore({ sendCommand }) } : {}),
});
```

**src/utils/cache.ts**:
```typescript
export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    // ... rest of implementation
  }

  static async set(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
    if (!redis) return;
    // ... rest of implementation
  }
  // ... other methods with null checks
}
```

### Challenge 3: TypeScript Build Errors in Frontend
**Error**: Type import errors in React components
**Solution**:
- Changed to `type` imports for React types
- Added missing `category` field to Event interface

### Challenge 4: IP Address Instead of Friendly URL
**Issue**: Lightsail provides a raw IP address instead of a friendly domain name
**Solution**: Registered `eventful-platform.com` via Route 53, configured Apache reverse proxy, and set up Let's Encrypt SSL certificate

---

## Final Configuration

### Deployment Method: EC2 with SSH + Git Pull

```bash
# SSH into EC2
ssh -i "your-key.pem" bitnami@13.43.80.112

# Navigate to project directory
cd /home/ec2-user/Eventful-Api
# Or: cd /var/www/eventful-api

# Pull latest code
git pull origin master

# Install dependencies and build
npm install

# Restart the application
pm2 restart eventful-api
# Or: pm2 start dist/server.js --name eventful-api
```

### Build Process

On the EC2 instance:
1. `git pull` fetches latest code
2. `npm install` installs dependencies (with devDependencies for TypeScript build)
3. `postinstall` script automatically:
   - Builds backend TypeScript (`tsc`)
   - Builds frontend React app (`vite build`)
   - Generates Prisma client
   - Runs database migrations
4. PM2 starts/restarts the application with `node dist/server.js`

### Database Migrations

Migration successfully applied:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "eventful_production"

1 migration found in prisma/migrations

Applying migration `20260204001657_init`

All migrations have been successfully applied.
```

---

## Post-Deployment

### Verification Steps Completed

1. Health endpoint responding: `GET /api/health`
   ```json
   {"status":"ok","timestamp":"2026-02-05T04:20:10.578Z"}
   ```

2. Frontend accessible: HTTP 200 OK at https://eventful-platform.com

3. API endpoints working

4. Database connected and migrations applied

5. Application running without Redis (graceful degradation)

### GitHub Repository Setup

**Repository URL**: https://github.com/ibraheembello/Eventful-Platform

```bash
# Add GitHub remote
git remote add origin https://github.com/ibraheembello/Eventful-Platform.git

# Push to GitHub
git push -u origin master
```

---

## Key Learnings

### 1. AWS EC2 Deployment
- **Direct Server Access**: EC2 gives you full control over the server environment via SSH
- **Security Groups**: Must open required ports (22, 80, 443, 8080) in the EC2 security group
- **PM2 Process Manager**: Essential for keeping Node.js apps running and auto-restarting on crashes
- **Public IP**: EC2 instances get a public IP, but need an Elastic IP to prevent it from changing on restart

### 2. Express 5.x Compatibility
- Wildcard routes (`*`) and named parameters with wildcards (`/:path(*)`) don't work in Express 5.x
- Use middleware (`app.use()`) for catch-all routes instead of `app.get('*')`

### 3. Redis as Optional Dependency
- Make external services optional for better resilience
- Implement null checks throughout the codebase
- Use conditional configuration for third-party integrations
- Graceful degradation: app works without cache, just slower

### 4. Monorepo Deployment
- Single deployment for frontend + backend reduces complexity
- Express serves React build in production
- Build both during postinstall hook
- Keep API routes separate from frontend routes

### 5. Database Migrations
- Run migrations automatically in postinstall
- Use connection strings with `?sslmode=require` for remote/managed PostgreSQL
- Configure security group rules to allow database access

### 6. TypeScript in Production
- Must include devDependencies (@types packages) for build
- Compile TypeScript during deployment, not before
- Use separate build scripts for backend and frontend

---

## Quick Reference Commands

### AWS EC2 Management

```bash
# SSH into EC2 instance (key at ~/.ssh/lightsail_key.pem)
ssh -i ~/.ssh/lightsail_key.pem bitnami@13.43.80.112

# IMPORTANT: Node/npm/pm2 are at /opt/bitnami/node/bin/
# Prefix commands with: export PATH=/opt/bitnami/node/bin:$PATH

# Project directory on EC2
cd /home/bitnami/Eventful-Platform

# View application logs (PM2)
pm2 logs eventful-api

# Restart application
pm2 restart eventful-api

# Stop application
pm2 stop eventful-api

# Start application
pm2 start dist/server.js --name eventful-api

# View PM2 status
pm2 status

# View PM2 monitoring dashboard
pm2 monit

# AWS CLI - Check instance status
aws ec2 describe-instances --instance-ids <instance-id> --query 'Reservations[0].Instances[0].State.Name'

# AWS CLI - Stop instance (save costs)
aws ec2 stop-instances --instance-ids <instance-id>

# AWS CLI - Start instance
aws ec2 start-instances --instance-ids <instance-id>

# AWS CLI - Reboot instance
aws ec2 reboot-instances --instance-ids <instance-id>
```

### Git Deployment (Automated via CI/CD)

```bash
# AUTOMATIC: Just push to master — CI/CD handles everything
git add .
git commit -m "Your commit message"
git push origin master
# GitHub Actions will: test → build → SSH deploy to EC2 (~2 min)

# Manual deploy (if CI/CD is down or for emergency fixes)
ssh -i ~/.ssh/lightsail_key.pem bitnami@13.43.80.112
export PATH=/opt/bitnami/node/bin:$PATH
cd /home/bitnami/Eventful-Platform
git stash && git pull origin master
npx prisma generate && npx prisma migrate deploy
npm run build:backend && npm run build:frontend
pm2 reload eventful-api

# View remotes
git remote -v
```

### Local Development

```bash
# Install dependencies
npm install

# Run backend in dev mode
npm run dev

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Build both
npm run build

# Run production build locally
npm start

# Database commands
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio

# Run tests
npm test
```

### Database Management

```bash
# Connect to PostgreSQL on EC2
sudo -u postgres psql eventful_production

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Deployment Timeline

| Time | Action | Status |
|------|--------|--------|
| - | Started deployment discussion | Done |
| - | Launched EC2 instance | Done |
| - | Configured security groups | Done |
| - | Installed Node.js, PM2, PostgreSQL | Done |
| - | Set environment variables | Done |
| - | Fixed TypeScript build errors | Done |
| - | Fixed Express 5 compatibility | Done |
| - | Made Redis optional | Done |
| - | **Application Live!** | Done |
| - | Pushed to GitHub | Done |

---

## Cost Estimation

### Monthly Costs (eu-west-2 London Region)

| Service | Tier | Estimated Cost |
|---------|------|----------------|
| EC2 Instance | t2.micro (free tier eligible) | ~$0-10/month |
| EBS Storage | 30GB gp3 | ~$2.40/month |
| Data Transfer | Moderate | ~$1-5/month |
| **Total** | | **~$3-15/month** |

### Cost Optimization Options

1. **Free tier**: t2.micro is free for 12 months for new AWS accounts
2. **Stop when not in use**: Stop the EC2 instance to avoid compute charges
3. **Reserved Instances**: Commit to 1-year for up to 40% savings
4. **Elastic IP**: Allocate an Elastic IP to avoid IP changes (free while instance is running)

---

## Security Considerations

### Implemented
- All secrets in environment variables (not in code)
- Security group configured (restrict SSH to your IP)
- JWT tokens with secure secrets
- CORS configured correctly
- Rate limiting enabled
- Helmet security headers applied
- Password hashing with bcrypt

### Recommended for Production
- [ ] Set up HTTPS with SSL certificate (Let's Encrypt + Nginx)
- [ ] Add Nginx as reverse proxy (run on port 80/443)
- [ ] Register a custom domain via Route 53
- [ ] Add Redis (ElastiCache) for caching and rate limiting
- [ ] Enable CloudWatch for monitoring and alerts
- [ ] Set up automated backups for database (pg_dump or RDS)
- [ ] Implement CI/CD pipeline with GitHub Actions
- [ ] Use Elastic IP to prevent IP changes on instance restart
- [ ] Restrict SSH access to your IP only in the security group

---

## Feature: Image File Upload (February 14, 2026)

### Overview
Added support for event creators to upload images from their device (drag-and-drop or file picker), in addition to the existing URL paste option. Images are stored locally on the EC2 server in an `uploads/` directory and served via Express static middleware.

### How It Works
1. **Backend**: `POST /api/upload` endpoint using **multer** for multipart file handling
   - Requires authentication + CREATOR role
   - Accepts JPEG, PNG, GIF, WebP up to 5MB
   - Files saved with UUID filenames to `<project_root>/uploads/`
   - Returns `{ success: true, data: { imageUrl: "/uploads/<uuid>.ext" } }`

2. **Frontend**: CreateEvent page now has two modes:
   - **Upload File**: Drag-and-drop zone or click-to-browse, with instant preview
   - **Paste URL**: The original URL input field
   - On submit, files are uploaded first, then the returned path is used as `imageUrl`

3. **Schema**: `imageUrl` validation accepts both full URLs (`https://...`) and upload paths (`/uploads/...`)

4. **Static Serving**: `app.use('/uploads', express.static(...))` serves uploaded images
   - Helmet configured with `crossOriginResourcePolicy: 'cross-origin'` for image loading
   - Vite dev proxy configured for `/uploads` path

### New Files
- `src/middleware/upload.ts` - Multer config (disk storage, UUID filenames, file filter, 5MB limit)
- `src/modules/upload/upload.routes.ts` - Upload route with auth, error handling, Swagger docs

### Modified Files
- `src/app.ts` - Upload routes, static serving, helmet CORP
- `src/modules/events/event.schema.ts` - imageUrl accepts URLs and /uploads/ paths
- `client/vite.config.ts` - /uploads proxy for dev
- `client/src/pages/CreateEvent.tsx` - Drag-and-drop upload UI with mode toggle
- `.gitignore` - Added `uploads/`

### Deployment Notes
- Must create `uploads/` directory on EC2: `mkdir -p /home/bitnami/Eventful-Platform/uploads`
- Directory must be writable by the PM2 process user (bitnami)
- Uploaded images persist across deployments (not in git)
- `npm install` on EC2 needed for `multer` package

---

## Feature: Accessibility Fixes (February 14, 2026)

### Overview
Fixed all axe/webhint accessibility warnings reported by Microsoft Edge Tools.

### Changes
- `CreateEvent.tsx` - Added `htmlFor`/`id` associations for category, date, capacity, price fields; `aria-label` on reminder unit select
- `EventDetail.tsx` - Added `aria-label` on share, edit, delete buttons and social share links (Twitter, Facebook, LinkedIn, WhatsApp, Email)
- `MyTickets.tsx` - Added `aria-label` on download ticket button
- `Register.tsx` - Added `htmlFor`/`id` for firstName and lastName inputs
- `index.css` - Reordered `-webkit-backdrop-filter` before `backdrop-filter` per CSS vendor prefix spec

---

## Feature: UI Enhancements — Pagination, Landing Page, Profile, Password Toggle (February 14, 2026)

### Overview
Batch of 5 UI/UX improvements to polish the platform after initial deployment.

### Changes

**1. Events Pagination Improvement**
- Changed events per page from 9 to 12 (fills 3-col grid evenly)
- Added "Showing X–Y of Z events" count above the grid
- Files: `client/src/pages/Events.tsx`

**2. Landing Page — Featured Events Section**
- Fetches 6 real events from `GET /events?limit=6` on mount
- Displays in a 3-column grid with images, dates, locations, prices
- "View All Events" button links to `/events`
- Landing page navbar adapts for logged-in users (avatar + Dashboard link)
- Hero CTA shows "Go to Dashboard" when logged in
- Files: `client/src/pages/LandingPage.tsx`

**3. Profile Page (Full Stack)**
- **Database**: Added `profileImage` (String?) to User model
- **Backend**: `PUT /auth/profile` endpoint — update firstName, lastName, profileImage
- **Frontend**: Profile page with avatar upload (drag-and-drop), editable name, role badge, member since date
- **Navbar**: Profile avatar + clickable name link to `/profile` (desktop & mobile)
- Files: `prisma/schema.prisma`, `src/modules/auth/auth.service.ts`, `auth.controller.ts`, `auth.schema.ts`, `auth.routes.ts`, `client/src/pages/Profile.tsx` (new), `client/src/context/AuthContext.tsx`, `client/src/types/index.ts`, `client/src/App.tsx`, `client/src/components/Layout.tsx`

**4. Password Visibility Toggle**
- Eye icon button toggles password field between text/password
- Applied to both Login and Register pages
- Files: `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`

**5. Homepage Navigation**
- Removed redirect that blocked logged-in users from landing page
- Added "Home" link in Layout navbar (desktop & mobile)
- "Eventful" logo in navbar links to `/` (landing page)
- Files: `client/src/App.tsx`, `client/src/components/Layout.tsx`

### Deployment Notes
- Run `npx prisma migrate deploy` on EC2 for the `add_profile_image` migration
- Run `npx prisma generate` after stopping PM2 (to unlock the DLL)
- `npm install` not needed (no new packages)

---

## Future Features Roadmap

### Feature F1: Event Search Filters

**Description**: Add category, date range, price range, and free/paid filters to the Events page for better discoverability.

**Checklist**:
- [ ] Add filter UI component (collapsible sidebar or horizontal filter bar) to `Events.tsx`
- [ ] Add category dropdown (populated from existing event categories)
- [ ] Add date range picker (start date / end date)
- [ ] Add price range slider or min/max inputs
- [ ] Add free/paid toggle filter
- [ ] Update `GET /events` backend to accept `category`, `dateFrom`, `dateTo`, `priceMin`, `priceMax` query params
- [ ] Update `src/modules/events/event.service.ts` to build Prisma `where` clause from filters
- [ ] Persist filter state in URL query params (so filtered views are shareable/bookmarkable)
- [ ] Reset filters button
- [ ] Mobile-responsive filter UI (bottom sheet or modal on mobile)

**Success Criteria**:
- Users can filter events by any combination of category, date range, and price
- Filters persist across pagination (page changes don't reset filters)
- URL reflects current filters (e.g., `/events?category=Music&priceMax=50`)
- Clearing filters returns to the default unfiltered view
- No performance regression — filtered queries return in < 500ms

---

### Feature F2: Bookmark / Save Events -- COMPLETED (February 14, 2026)

**Description**: Let users save events they're interested in to a personal "Saved Events" list.

**Checklist**:
- [x] Add `Bookmark` model to Prisma schema (`userId`, `eventId`, unique constraint, timestamps)
- [x] Run Prisma migration (`20260214045711_add_bookmarks`)
- [x] Create `POST /events/:id/bookmark` endpoint (toggle — creates or deletes)
- [x] Create `GET /events/bookmarks` endpoint (list user's saved events with pagination)
- [x] Create `GET /events/bookmarks/ids` endpoint (returns array of bookmarked event IDs for quick lookup)
- [x] Add bookmark icon to event cards on Events page (optimistic UI toggle)
- [x] Add bookmark icon to EventDetail page
- [x] Highlight icon when event is already bookmarked (filled vs outline)
- [x] Create `SavedEvents.tsx` page to list all bookmarked events
- [x] Add "Saved" link to navbar (desktop + mobile)
- [x] Add route `/saved` in `App.tsx`
- [x] Update frontend types (`Bookmark` interface)

**Success Criteria**:
- [x] Clicking the bookmark icon on any event card toggles the saved state instantly (optimistic UI)
- [x] Saved Events page lists all bookmarked events with the same card style as Events page
- [x] Bookmarks persist across sessions (stored in database)
- [x] Unbookmarking from the Saved Events page removes the card with animation
- [x] Only authenticated users can bookmark (unauthenticated see toast: "Login to save events")

---

### Feature F3: Event Comments / Reviews

**Description**: Allow attendees to leave comments and ratings on events they've attended.

**Checklist**:
- [ ] Add `Comment` model to Prisma schema (`userId`, `eventId`, `content`, `rating` 1-5, timestamps)
- [ ] Run Prisma migration
- [ ] Create `POST /events/:id/comments` endpoint (requires ticket for this event, event date must be past)
- [ ] Create `GET /events/:id/comments` endpoint (public, paginated, sorted by newest)
- [ ] Create `DELETE /events/:id/comments/:commentId` endpoint (author or event creator can delete)
- [ ] Add comments section to `EventDetail.tsx` (below event info)
- [ ] Add star rating input component (1-5 stars)
- [ ] Display average rating on event cards and detail page
- [ ] Add "X reviews" count next to rating
- [ ] Only show comment form for past events where user has a ticket
- [ ] Update frontend types (`Comment` interface)

**Success Criteria**:
- Only ticket holders of past events can leave a review (prevents fake reviews)
- Average rating displays on event cards with star icons
- Comments are paginated (10 per page) and sorted newest first
- Event creators can moderate (delete inappropriate comments)
- Comment form validates: content required (min 10 chars), rating required (1-5)
- Empty state shown when no reviews exist ("No reviews yet")

---

### Feature F4: Waitlist for Sold-Out Events

**Description**: Allow users to join a waitlist for sold-out events and get notified if spots open up.

**Checklist**:
- [ ] Add `Waitlist` model to Prisma schema (`userId`, `eventId`, `position`, `notified`, timestamps)
- [ ] Run Prisma migration
- [ ] Create `POST /events/:id/waitlist` endpoint (add user to waitlist)
- [ ] Create `DELETE /events/:id/waitlist` endpoint (remove self from waitlist)
- [ ] Create `GET /events/:id/waitlist` endpoint (creator only — see waitlist count/list)
- [ ] Add automatic waitlist notification when a ticket is cancelled (trigger in ticket cancellation flow)
- [ ] Show "Join Waitlist" button on EventDetail when event is sold out (instead of "Buy Ticket")
- [ ] Show waitlist position to user: "You are #X on the waitlist"
- [ ] Add "My Waitlists" section to MyTickets page or create separate page
- [ ] Send notification when spot opens up (in-app notification)

**Success Criteria**:
- "Join Waitlist" button replaces "Buy Ticket" when event reaches capacity
- Users see their position in the waitlist queue
- When a ticket is cancelled, the first person on the waitlist is automatically notified
- Users can leave the waitlist at any time
- Event creators can see waitlist count in their analytics
- A user cannot join the waitlist if they already have a ticket

---

### Feature F5: Export Tickets as PDF -- COMPLETED (February 14, 2026)

**Description**: One-click PDF download for tickets with event details, QR code, and branding.

**Checklist**:
- [x] Install PDF generation library — `jspdf` + `qrcode` on frontend (client-side generation)
- [x] Design ticket PDF template — emerald-branded card with header, status badge, event details, QR code, ticket ID, footer
- [x] Add "Download PDF" button to MyTickets page (existing download button now generates PDF)
- [x] Add "Download PDF" button to individual ticket QR modal
- [x] Include Eventful branding/logo on PDF (emerald header with "EVENTFUL" text + "E-TICKET")
- [ ] Include event image if available (deferred — adds complexity for minimal value)
- [x] Generate PDF client-side (faster, no server dependency)
- [ ] Support batch download (deferred — can be added later)
- [x] Ensure QR code in PDF is scannable (uses `qrcode` toDataURL with error correction level H)

**Also Fixed**: Pagination key mismatch in MyTickets (`pages` → `totalPages`)

**Success Criteria**:
- [x] PDF downloads in < 3 seconds
- [x] PDF is properly formatted (custom ticket-sized 100x200mm format)
- [x] QR code in PDF is scannable by the Verify Ticket feature
- [x] PDF includes: event title, date/time, location, QR code, ticket status, ticket ID
- [x] PDF works on all browsers (Chrome, Firefox, Safari, Edge) — uses jspdf, browser-agnostic
- [ ] Batch download creates a multi-page PDF with one ticket per page (deferred)

---

### Feature F6: Email Notifications

**Description**: Send real emails for ticket purchases, event reminders, and event updates using a transactional email service.

**Checklist**:
- [ ] Choose email provider (SendGrid, Resend, or AWS SES)
- [ ] Install email SDK (`@sendgrid/mail`, `resend`, or `@aws-sdk/client-ses`)
- [ ] Create `src/services/email.service.ts` with send methods
- [ ] Design HTML email templates (ticket confirmation, event reminder, event update)
- [ ] Send confirmation email after successful ticket purchase
- [ ] Send reminder emails based on existing Notification/Reminder system
- [ ] Send email when event details are updated (date/location change)
- [ ] Add email preference settings to user profile (opt-in/opt-out)
- [ ] Add `emailNotifications` field to User model
- [ ] Queue emails to avoid blocking request handlers (use Bull/BullMQ or simple async)
- [ ] Add email sending to the reminder cron job
- [ ] Handle email delivery failures gracefully (log, retry once)

**Success Criteria**:
- Ticket purchase triggers a confirmation email within 30 seconds
- Email includes event details, QR code image, and ticket information
- Event reminders send emails at the scheduled time
- Users can opt out of email notifications from their profile
- Email delivery failures don't crash the application
- Emails render correctly in Gmail, Outlook, and Apple Mail
- Environment variable `EMAIL_API_KEY` configures the service (optional — app works without it)

---

### Feature F7: Event Edit/Update Notifications -- COMPLETED (February 16, 2026)

**Description**: Notify all ticket holders when an event's details change (date, time, location, or cancellation).

**Checklist**:
- [x] Track which fields changed in event update handler (compare old vs new values)
- [x] Create bulk notification when event date, time, location, title, or price changes
- [x] Show in-app notification banner on EventDetail page: "This event was updated on [date]"
- [ ] Add update history/changelog to EventDetail page (deferred)
- [x] Send email notification to all ticket holders via `sendEventUpdate()`
- [x] Handle event cancellation: send `sendEventCancellation()` emails to all active ticket holders on delete
- [x] Show "Updated" badge on event cards if updated recently (last 48 hours)
- [x] Return `notifiedCount` from update/delete and show confirmation toast to creator
- [ ] Add `lastNotifiedAt` to prevent duplicate notifications (deferred — low priority)

**Success Criteria**:
- [x] When a creator updates event date or location, all ticket holders receive email notification
- [x] Notification clearly states what changed (e.g., "Date changed from March 5 to March 12")
- [x] Event cancellation notifies all active ticket holders via cancellation email
- [x] Creators see a confirmation: "X ticket holders will be notified"
- [x] "Updated" amber banner shows on EventDetail when event was updated
- [x] "Updated" indigo badge shows on event cards for recently updated events

**Modified Files**:
- `src/modules/events/event.service.ts` — `update()` returns notifiedCount, `delete()` sends cancellation emails
- `src/modules/events/event.controller.ts` — Update/delete handlers include notifiedCount in messages
- `src/utils/emailService.ts` — Added `sendEventCancellation()` red-themed template
- `client/src/types/index.ts` — Added `updatedAt` to Event interface
- `client/src/pages/EventDetail.tsx` — Amber "Updated" banner after title card
- `client/src/pages/Events.tsx` — Indigo "Updated" badge on event cards
- `client/src/pages/CreateEvent.tsx` — Notification toast on event update

---

### Feature F8: Creator Dashboard Stats (Charts) -- COMPLETED (February 14, 2026)

**Description**: Enhanced analytics with interactive charts showing ticket sales over time, revenue breakdown, and attendee demographics.

**Checklist**:
- [x] Install charting library — `recharts` on frontend
- [x] Add `ticketStatusBreakdown` to backend analytics overview endpoint
- [x] Add bar chart: revenue per event (top 8 events, sorted by revenue)
- [x] Add bar chart: tickets sold vs checked in per event
- [x] Add donut chart: ticket status breakdown (active / checked in / cancelled)
- [x] Add top-performing events leaderboard (top 5 by revenue, with rank badges)
- [x] Add performance summary card (avg tickets/event, avg revenue/event, check-in rate, avg fill rate)
- [x] Make charts responsive and dark-mode compatible (CSS variables for colors)
- [x] Custom tooltips showing full event names and formatted values
- [x] Link each event row to its attendee check-in list
- [x] Empty state when no data exists ("Create your first event to see analytics")
- [ ] Time-series line chart (deferred — requires per-day ticket sales data)
- [ ] Date range selector (deferred — depends on time-series)
- [ ] "vs last month" comparison metrics (deferred)

**Success Criteria**:
- [x] Charts load within 2 seconds
- [x] Charts are interactive (hover for tooltips)
- [x] All charts support dark mode
- [x] Top events leaderboard links to attendee lists
- [x] Charts are responsive on mobile (readable on small screens)
- [x] Empty state when no data exists

---

### Feature F9: Attendee Check-in List -- COMPLETED (February 14, 2026)

**Description**: Table view for event creators to see all ticket holders with real-time check-in status.

**Checklist**:
- [x] Enhanced `GET /events/:id/attendees` endpoint with search, status filter, sort, and stats
- [x] Support search/filter by name or email
- [x] Support sort by name, purchase date, check-in status (clickable column headers)
- [x] Create `AttendeeList.tsx` page with responsive table
- [x] Display table: Name, Email, Ticket ID, Purchase Date, Status (Active/Checked In/Cancelled)
- [x] Add manual check-in button (`POST /events/:id/check-in`) — marks ticket as USED without QR scan
- [x] Show real-time stats at top: Total Tickets, Checked In, Remaining, Cancelled + progress bar
- [x] Add CSV export button for attendee list
- [x] Add route `/events/:id/attendees` in `App.tsx` (CREATOR-only)
- [x] Link from EventDetail page (users icon in action bar)

**Success Criteria**:
- [x] Creators can see all ticket holders for any of their events
- [x] Table supports search by name/email with instant filtering
- [x] Manual check-in works and updates the ticket status in real time
- [x] CSV export includes: Name, Email, Ticket ID, Status, Purchase Date, Check-in Time
- [x] Stats bar shows accurate counts that update when check-ins happen
- [x] Only the event creator can access the attendee list (403 for others)
- [x] Handles events with 100+ attendees (paginated with 50 per page)

---

### Feature F10: Multi-Image Event Gallery -- COMPLETED (February 16, 2026)

**Description**: Allow event creators to upload multiple images per event instead of just one cover image.

**Checklist**:
- [x] Add `EventImage` model to Prisma schema (`eventId`, `imageUrl`, `order`, `caption?`, timestamps)
- [x] Run Prisma migration
- [x] Create `POST /events/:id/images` endpoint (add images to event)
- [x] Create `DELETE /events/:id/images/:imageId` endpoint (remove image)
- [x] Create `PUT /events/:id/images/reorder` endpoint (change image order)
- [x] Create `PUT /events/:id/images/:imageId` endpoint (update caption)
- [x] Update EventDetail page with image gallery/carousel
- [x] Add lightbox view (click image to see full size with left/right navigation)
- [x] Update CreateEvent page to support multiple image uploads
- [x] Add drag-to-reorder for image gallery on edit (with visual feedback)
- [x] Add inline caption editing (hover to edit, save on blur/Enter)
- [x] First image (order=0) is the cover image shown on event cards
- [x] Update frontend types (`EventImage` interface)
- [x] Thumbnail strip below main image on EventDetail

**Success Criteria**:
- [x] Images display in a responsive gallery/carousel on EventDetail
- [x] Drag-and-drop reordering works on the edit page with visual feedback (ring highlight, opacity, order numbers)
- [x] Deleting an image removes it from database
- [x] Lightbox opens on click with left/right navigation
- [x] Caption editing works inline on hover
- [x] Reorder persists via API call with optimistic UI and rollback on error

**Modified Files**:
- `src/modules/events/event.schema.ts` — Added `reorderImagesSchema`, `updateImageSchema`
- `src/modules/events/event.service.ts` — Added `reorderImages()`, `updateImage()`
- `src/modules/events/event.controller.ts` — Added `reorderImages`, `updateImage` handlers
- `src/modules/events/event.routes.ts` — Added `PUT /:id/images/reorder`, `PUT /:id/images/:imageId`
- `client/src/pages/CreateEvent.tsx` — Drag-to-reorder gallery, inline caption editing

---

### Feature F11: Dual-Role Access — COMPLETED (February 16, 2026)

**Description**: Allow CREATORs to attend events created by other creators without needing a separate EVENTEE account. Creators cannot attend their own events.

**Checklist**:
- [x] Change `authorize('EVENTEE')` to `authorize('EVENTEE', 'CREATOR')` on `/payments/initialize`
- [x] Add own-event check: `event.creatorId === userId` → reject with clear error
- [x] Change `authorize('EVENTEE')` to `authorize('EVENTEE', 'CREATOR')` on `/events/attending`
- [x] Frontend already handles it correctly (`isCreator` checks event ownership, not role)

**Modified Files**:
- `src/modules/payments/payment.routes.ts` — Allow both roles on payment initialize
- `src/modules/payments/payment.service.ts` — Block creators from buying tickets to own events
- `src/modules/events/event.routes.ts` — Allow both roles on attending endpoint

---

### Feature F12: Discount/Promo Codes — COMPLETED (February 16, 2026)

**Description**: Full promo code system allowing CREATORs to create discount codes (percentage or fixed amount) to boost ticket sales. Attendees can apply codes at checkout.

**Checklist**:
- [x] Add `DiscountType` enum and `PromoCode` model to Prisma schema
- [x] Add `discountAmount` and `promoCodeId` fields to Payment model
- [x] Run migration `add_promo_codes`
- [x] Create `POST /api/promo-codes` endpoint (CREATOR: create promo code)
- [x] Create `GET /api/promo-codes` endpoint (CREATOR: list own promo codes)
- [x] Create `GET /api/promo-codes/:id` endpoint (CREATOR: get single code)
- [x] Create `PUT /api/promo-codes/:id` endpoint (CREATOR: toggle active, update)
- [x] Create `DELETE /api/promo-codes/:id` endpoint (CREATOR: delete code)
- [x] Create `POST /api/promo-codes/validate` endpoint (validate code for event)
- [x] Integrate promo code discount into payment initialization flow
- [x] Handle percentage and fixed discount types
- [x] Auto-increment `usedCount` on successful payment
- [x] Handle fully-discounted tickets as free (bypass Paystack)
- [x] Create `PromoCodes.tsx` management page with inline create form
- [x] Add promo code input to EventDetail purchase card ("Have a promo code?")
- [x] Show strikethrough original price + discounted price when promo applied
- [x] Add "Promo Codes" link in CREATOR nav (desktop + mobile)
- [x] Add `/promo-codes` route in App.tsx
- [x] Add feature to landing page features grid + footer

**New Files**:
- `src/modules/promoCodes/promo-code.schema.ts` — Zod validation (create, update, validate)
- `src/modules/promoCodes/promo-code.service.ts` — CRUD + validation business logic
- `src/modules/promoCodes/promo-code.controller.ts` — HTTP handlers
- `src/modules/promoCodes/promo-code.routes.ts` — Express routes with Swagger docs
- `client/src/pages/PromoCodes.tsx` — Promo code management page

**Modified Files**:
- `prisma/schema.prisma` — Added DiscountType enum, PromoCode model, Payment fields
- `src/app.ts` — Registered `/api/promo-codes` routes
- `src/modules/payments/payment.schema.ts` — Added optional `promoCode` field
- `src/modules/payments/payment.service.ts` — Promo code validation + discount calculation
- `client/src/types/index.ts` — Added PromoCode interface
- `client/src/pages/EventDetail.tsx` — Promo code input, apply/remove, price display
- `client/src/App.tsx` — Added `/promo-codes` route
- `client/src/components/Layout.tsx` — Added Promo Codes nav link
- `client/src/pages/LandingPage.tsx` — Added feature card + footer entry

---

### Feature F13: Social Login (Google + GitHub OAuth) — COMPLETED (February 17, 2026, fixed February 21, 2026)

**Description**: Allow users to sign in/register with Google or GitHub OAuth, in addition to email/password. Social buttons appear on both Login and Register pages. Register page stores the selected role in sessionStorage before redirect.

**Approach**: Manual redirect flow for both Google and GitHub (no Passport.js, no `@react-oauth/google` GIS library). Both providers use the same pattern: redirect to provider → user authorizes → redirect back to callback page → backend exchanges code for tokens → JWT issued. Keeps the existing JWT flow intact.

**Important Fix (February 21, 2026)**: The original implementation used `@react-oauth/google`'s `useGoogleLogin` hook (implicit flow with popup) and then `GoogleLogin` component. Both failed on production:
1. `useGoogleLogin` popup couldn't communicate tokens back to the app (`onSuccess` never fired)
2. `GoogleLogin` component crashed the React tree (blank page) due to GIS script loading issues
3. **Solution**: Switched to manual redirect flow (same pattern as GitHub) — the most reliable approach. Backend now accepts authorization `code` and exchanges it via `https://oauth2.googleapis.com/token`.

Also fixed: New users clicking social login on the Login page (no role) now see a role selection modal instead of a silent error. GitHub flow updated to accept `accessToken` for retry since auth codes are single-use.

**Checklist**:
- [x] Add `googleId String? @unique`, `githubId String? @unique`, `provider String @default("local")` to User model
- [x] Make `password` optional (`String?`) for social-only users
- [x] Run migration `add_social_login`
- [x] Add `googleAuthSchema` and `githubAuthSchema` Zod validators (both accept `code` or `credential`/`accessToken`)
- [x] Add `googleLogin()` method — exchanges authorization code via Google token endpoint, then fetches userinfo
- [x] Add `githubLogin()` method — exchange code for token, fetch profile + emails; accepts `accessToken` for retry
- [x] Fix `login()` — reject social-only users with clear error message
- [x] Update `getProfile()` to include `provider` field
- [x] Add `POST /auth/google` and `POST /auth/github` routes with Swagger docs
- [x] Add `socialLogin()` method to `AuthContext`
- [x] Add Google + GitHub buttons to Login page (redirect-based, custom styled)
- [x] Add Google + GitHub buttons to Register page (stores role in sessionStorage before redirect)
- [x] Create `GoogleCallback.tsx` — handles `/auth/google/callback` redirect with role selection for new users
- [x] Create `GitHubCallback.tsx` — handles `/auth/github/callback` redirect with role selection for new users
- [x] Add provider badge to Profile page
- [x] Add "Social Sign-In" feature to landing page
- [x] Configure Helmet CSP to allow Google OAuth
- [x] Add `VITE_GOOGLE_CLIENT_ID` and `VITE_GITHUB_CLIENT_ID` to `client/.env`
- [x] Add `GOOGLE_CLIENT_SECRET` to EC2 `.env` (needed for code exchange)

**New Files**:
- `client/src/pages/GoogleCallback.tsx` — Google OAuth callback handler with role selection modal
- `client/src/pages/GitHubCallback.tsx` — GitHub OAuth callback handler with role selection modal
- `prisma/migrations/20260216230727_add_social_login/migration.sql`

**Modified Files**:
- `prisma/schema.prisma` — User model: password optional, googleId, githubId, provider
- `src/modules/auth/auth.schema.ts` — googleAuthSchema accepts `code` or `credential`; githubAuthSchema accepts `code` or `accessToken`
- `src/modules/auth/auth.service.ts` — googleLogin() handles code exchange + credential; githubLogin() handles code + accessToken; returns `needsRole` for GitHub new users
- `src/modules/auth/auth.controller.ts` — Added googleLogin, githubLogin handlers
- `src/modules/auth/auth.routes.ts` — Added POST /google, POST /github routes
- `src/app.ts` — Updated Helmet CSP for Google OAuth
- `client/src/main.tsx` — Removed GoogleOAuthProvider (no longer needed)
- `client/src/types/index.ts` — Added provider to User interface
- `client/src/context/AuthContext.tsx` — Added socialLogin method
- `client/src/pages/Login.tsx` — Google + GitHub redirect buttons (no SDK dependency)
- `client/src/pages/Register.tsx` — Google + GitHub redirect buttons with role stored in sessionStorage
- `client/src/App.tsx` — Added /auth/google/callback and /auth/github/callback routes
- `client/src/pages/Profile.tsx` — Provider badge
- `client/src/pages/LandingPage.tsx` — Social Sign-In feature card + footer

**Edge Cases Handled**:
- Existing email user clicks Google → accounts linked automatically
- Social-only user tries email/password login → clear error with provider name
- New user via Login page (no role) → role selection modal appears on callback page
- GitHub user has private email → fetched from /user/emails API
- GitHub code is single-use → backend returns `needsRole` with access token for retry
- Google code exchange requires `GOOGLE_CLIENT_SECRET` on server
- `redirect_uri` must match exactly in Google Cloud Console: `https://eventful-platform.com/auth/google/callback`

---

### Feature F14: Forgot Password / Password Reset — COMPLETED (February 21, 2026)

**Description**: Users who registered with email/password can request a password reset link via email, then set a new password. Social-only users (Google/GitHub with no password) are handled gracefully — the request succeeds silently without sending an email (to prevent email enumeration).

**Checklist**:
- [x] Add `resetToken String?` and `resetTokenExpiresAt DateTime?` to User model
- [x] Run migration `add_password_reset`
- [x] Add `forgotPasswordSchema` and `resetPasswordSchema` Zod validators
- [x] Add `sendPasswordReset()` email template to EmailService
- [x] Add `forgotPassword()` service method — generates token, hashes with SHA-256, saves to DB, sends email
- [x] Add `resetPassword()` service method — verifies hashed token + expiry, updates password, clears token
- [x] Add `POST /auth/forgot-password` route (public, rate-limited)
- [x] Add `POST /auth/reset-password` route (public, rate-limited)
- [x] Create `ForgotPassword.tsx` page (email input, success state with check icon)
- [x] Create `ResetPassword.tsx` page (new password + confirm, show/hide toggles, token from URL)
- [x] Add "Forgot password?" link to Login page
- [x] Add routes in App.tsx (`/forgot-password`, `/reset-password`)
- [x] Update landing page feature description
- [x] Swagger docs for both endpoints

**Security**:
- Always returns same success message regardless of email existence (prevents enumeration)
- Stores SHA-256 hash of token in DB, not raw value (protects against DB leak)
- Rate limited via existing `authLimiter`
- Token cleared after successful reset (prevents reuse)
- 1 hour TTL enforced in DB query
- Social-only users silently succeed without email

**New Files**:
- `client/src/pages/ForgotPassword.tsx` — forgot password email form
- `client/src/pages/ResetPassword.tsx` — new password form with token validation
- `prisma/migrations/20260221124705_add_password_reset/migration.sql`

**Modified Files**:
- `prisma/schema.prisma` — Added resetToken, resetTokenExpiresAt to User
- `src/modules/auth/auth.schema.ts` — Added forgotPasswordSchema, resetPasswordSchema
- `src/modules/auth/auth.service.ts` — Added forgotPassword(), resetPassword() methods
- `src/modules/auth/auth.controller.ts` — Added forgotPassword, resetPassword handlers
- `src/modules/auth/auth.routes.ts` — Added POST /forgot-password, POST /reset-password
- `src/utils/emailService.ts` — Added sendPasswordReset() template
- `client/src/pages/Login.tsx` — Added "Forgot password?" link
- `client/src/App.tsx` — Added /forgot-password and /reset-password routes
- `client/src/pages/LandingPage.tsx` — Updated feature description + footer

---

### Feature F15: Event Categories Page — COMPLETED (February 21, 2026)

**Description**: Dedicated browsable Categories page where users can visually explore event categories — each shown as a card with an icon, name, and live event count. Clicking a category navigates to the Events page pre-filtered by that category.

**Checklist**:
- [x] Add `getCategoriesWithCounts()` to EventService using `prisma.event.groupBy()`
- [x] Add `getCategoriesWithCounts` handler to EventController
- [x] Add `GET /events/categories/counts` route (public, with Swagger docs)
- [x] Create `Categories.tsx` page with responsive grid (2/3/4 cols)
- [x] Category-specific icons and gradient colors for 10 categories
- [x] Show all known categories (including 0-count ones)
- [x] Click navigates to `/events?category=CategoryName`
- [x] Loading skeletons while fetching
- [x] Dark mode support
- [x] Add `/categories` route in `App.tsx`
- [x] Add "Categories" link in Layout navbar (desktop + mobile)
- [x] Add "Browse by Category" feature card to landing page
- [x] Cache results for 300s

**New Files**:
- `client/src/pages/Categories.tsx` — categories grid page

**Modified Files**:
- `src/modules/events/event.service.ts` — Added `getCategoriesWithCounts()`
- `src/modules/events/event.controller.ts` — Added `getCategoriesWithCounts` handler
- `src/modules/events/event.routes.ts` — Added `GET /events/categories/counts`
- `client/src/App.tsx` — Added `/categories` route
- `client/src/components/Layout.tsx` — Added Categories nav link (desktop + mobile)
- `client/src/pages/LandingPage.tsx` — Added "Browse by Category" feature card

---

### Feature F16: Recurring/Series Events — COMPLETED (February 21, 2026)

**Description**: Creators can create weekly, biweekly, or monthly event series from a single form. Each occurrence is a standalone Event with its own tickets, attendees, and payments, linked together via an EventSeries record. Deleting a series removes all events and notifies ticket holders.

**Checklist**:
- [x] Add `RecurrencePattern` enum (WEEKLY, BIWEEKLY, MONTHLY) to Prisma schema
- [x] Add `EventSeries` model (title, recurrencePattern, totalOccurrences, creatorId)
- [x] Add `seriesId`, `seriesOccurrence` fields to Event model (onDelete: SetNull)
- [x] Add `eventSeries` relation to User model
- [x] Run migration `20260221143253_add_event_series`
- [x] Add `recurrenceSchema` to event.schema.ts (pattern + occurrences 2-52)
- [x] Extend `createEventSchema` with optional `recurrence` field
- [x] Add `createSeries()` — transactional creation of series + N events with computed dates
- [x] Add `getSeriesEvents(seriesId, page, limit)` — paginated series events
- [x] Add `deleteSeries(seriesId, creatorId)` — delete all events + send cancellation emails
- [x] Update `getById()` include to return series info
- [x] Update `getAll()` include to return series info
- [x] Add `GET /events/series/:seriesId` route (public)
- [x] Add `DELETE /events/series/:seriesId` route (CREATOR auth)
- [x] Add `EventSeries` interface to frontend types
- [x] Extend `Event` interface with `seriesId`, `series`, `seriesOccurrence`
- [x] Add recurring event toggle to CreateEvent (create mode only)
- [x] Add pattern dropdown (Weekly/Biweekly/Monthly) and occurrences input (2-52)
- [x] Add live date preview showing all computed dates
- [x] Create `SeriesDetail.tsx` page with event grid, occurrence badges, delete confirmation
- [x] Add series banner on EventDetail ("Part of a weekly series — Occurrence 3 of 12")
- [x] Add series badge on Events page cards (occurrence/total with refresh icon)
- [x] Add `/events/series/:seriesId` route in App.tsx
- [x] Add "Recurring Events" feature card to landing page

**New Files**:
- `client/src/pages/SeriesDetail.tsx` — series detail page with event grid
- `prisma/migrations/20260221143253_add_event_series/migration.sql`

**Modified Files**:
- `prisma/schema.prisma` — RecurrencePattern enum, EventSeries model, Event fields, User relation
- `src/modules/events/event.schema.ts` — recurrenceSchema, extended createEventSchema
- `src/modules/events/event.service.ts` — createSeries(), getSeriesEvents(), deleteSeries(); updated create(), getById(), getAll()
- `src/modules/events/event.controller.ts` — getSeriesEvents, deleteSeries handlers; modified create() response
- `src/modules/events/event.routes.ts` — GET/DELETE /events/series/:seriesId
- `client/src/types/index.ts` — EventSeries interface, extended Event
- `client/src/pages/CreateEvent.tsx` — Recurring event toggle, pattern, occurrences, date preview
- `client/src/pages/EventDetail.tsx` — Indigo series banner with link to series page
- `client/src/pages/Events.tsx` — Series badge on event cards
- `client/src/App.tsx` — Added /events/series/:seriesId route
- `client/src/pages/LandingPage.tsx` — "Recurring Events" feature card

**Date Computation**:
- WEEKLY: +7 days per occurrence
- BIWEEKLY: +14 days per occurrence
- MONTHLY: +1 month per occurrence (same day, using `setMonth`)

**Success Criteria**:
- [x] Creating a recurring event produces N standalone events linked via series
- [x] Series page shows all events with occurrence badges and status indicators
- [x] Each event detail shows series banner with link to series page
- [x] Events page shows series badge on cards
- [x] Deleting series removes all events and sends cancellation emails
- [x] Editing one occurrence only changes that event
- [x] Non-recurring event creation works exactly as before

---

### Feature F17: Seven Sub-Features Batch — COMPLETED (February 21, 2026)

**Description**: Batch of 7 quality-of-life features implemented together: event draft/publish, in-app notifications center, event duplication/clone, analytics CSV export, ticket transfer, event co-hosts/collaborators, and multi-ticket types. Single Prisma migration for all schema changes.

**Sub-features**:

**F17f — Event Draft/Publish**:
- `optionalAuthenticate` middleware sets `req.user` if token present without rejecting
- Events created with `status: 'DRAFT'` or `'PUBLISHED'` (default PUBLISHED)
- `getAll()` filters to PUBLISHED only; `getById()` allows draft access for creator/collaborator
- `PUT /events/:id/publish` toggles DRAFT↔PUBLISHED (blocks unpublish if tickets sold)
- Frontend: "Save as Draft" button in CreateEvent, yellow draft banner + Publish button on EventDetail

**F17b — In-App Notifications Center**:
- New module: `src/modules/inAppNotifications/` (service, controller, routes)
- Routes: `GET /in-app`, `GET /in-app/unread`, `PUT /in-app/:id/read`, `PUT /in-app/read-all` under `/api/notifications`
- Bell icon with red unread count badge in Layout navbar, polling every 30s
- Full NotificationsInbox page with type-based icons, relative timestamps, mark-read, pagination
- Integrated into: payment confirmation, event updates, ticket transfers, collaborator invites

**F17a — Event Duplication/Clone**:
- `POST /events/:id/duplicate` copies all fields, date +7 days, title += " (Copy)", status=DRAFT
- Duplicates gallery images; navigates to edit page on success
- Duplicate button on EventDetail for creator/collaborator

**F17e — Analytics CSV Export**:
- Frontend-only: "Export CSV" button generates CSV from eventAnalytics array
- Columns: Event Name, Date, Capacity, Tickets Sold, Tickets Scanned, Check-in Rate, Revenue
- Downloads via Blob URL

**F17d — Ticket Transfer**:
- `POST /tickets/:id/transfer` with `{ recipientEmail }`
- Validates ownership, active status, recipient exists, no duplicate ticket, no pending transfer
- Transaction: creates TicketTransfer (COMPLETED), updates ticket.userId, regenerates QR code
- Emails to both parties + in-app notifications
- Frontend: Transfer button on MyTickets with inline email form

**F17c — Event Co-Hosts/Collaborators**:
- Routes: `POST/GET /:id/collaborators`, `PUT /:id/collaborators/accept`, `DELETE /:id/collaborators/:collabId`
- `isCreatorOrCollaborator()` helper replaces strict creatorId checks in update, attendees, check-in, image management (delete remains creator-only)
- In-app notification on invite; accept/decline workflow
- Frontend: Collaborator section in CreateEvent edit mode; accept banner on EventDetail; co-hosts see edit/attendees buttons

**F17g — Multi-Ticket Types**:
- Full CRUD: `POST/GET/PUT/DELETE /:id/ticket-types`
- Payment flow: if event has ticketTypes, ticketTypeId required; uses type's price/capacity. Legacy flow unchanged for events without types.
- Frontend: Ticket type selector cards on EventDetail; dynamic type rows in CreateEvent with name/price/capacity/description
- Ticket type badge on MyTickets cards

**Schema Changes** (migration `20260221150621_add_f17_features`):
- Enums: `EventStatus { DRAFT PUBLISHED }`, `CollaboratorRole { CO_HOST }`, `TransferStatus { PENDING COMPLETED CANCELLED }`
- New models: `InAppNotification`, `EventCollaborator` (@@unique eventId+userId), `TicketTransfer`, `TicketType`
- Modified: Event (status, collaborators, ticketTypes), Ticket (ticketTypeId, transfers), Payment (ticketTypeId), User (notifications, collaborations, transfers)

**New Files**:
- `client/src/pages/NotificationsInbox.tsx` — notification inbox page
- `src/modules/inAppNotifications/in-app-notification.service.ts` — notification CRUD
- `src/modules/inAppNotifications/in-app-notification.controller.ts` — HTTP handlers
- `src/modules/inAppNotifications/in-app-notification.routes.ts` — Express routes
- `src/modules/events/collaborator.schema.ts` — invite validation
- `src/modules/tickets/transfer.schema.ts` — transfer validation
- `prisma/migrations/20260221150621_add_f17_features/migration.sql`

**Modified Files**:
- `prisma/schema.prisma` — 3 enums, 4 new models, 4 modified models
- `src/middleware/auth.ts` — Added `optionalAuthenticate`
- `src/app.ts` — Registered in-app notification routes
- `src/modules/events/event.schema.ts` — status, ticket type schemas
- `src/modules/events/event.service.ts` — draft filtering, duplicate, togglePublish, collaborator methods, ticket type CRUD, isCreatorOrCollaborator
- `src/modules/events/event.controller.ts` — 10 new handlers
- `src/modules/events/event.routes.ts` — 12 new routes
- `src/modules/payments/payment.schema.ts` — ticketTypeId field
- `src/modules/payments/payment.service.ts` — ticket type pricing + in-app notifications
- `src/modules/payments/payment.controller.ts` — passes ticketTypeId
- `src/modules/tickets/ticket.service.ts` — transferTicket, ticketTypeId in createTicket
- `src/modules/tickets/ticket.controller.ts` — transfer handler
- `src/modules/tickets/ticket.routes.ts` — transfer route
- `src/utils/emailService.ts` — sendTicketTransferSent, sendTicketTransferReceived templates
- `client/src/types/index.ts` — TicketType, EventCollaborator, InAppNotification interfaces
- `client/src/App.tsx` — /notifications/inbox route
- `client/src/components/Layout.tsx` — Bell icon with unread badge, 30s polling
- `client/src/pages/EventDetail.tsx` — Draft banner, publish, duplicate, co-host accept, ticket type selector
- `client/src/pages/CreateEvent.tsx` — Draft button, ticket types, collaborators section
- `client/src/pages/MyTickets.tsx` — Transfer button/form, ticket type badge
- `client/src/pages/Analytics.tsx` — CSV export button
- `client/src/pages/LandingPage.tsx` — 6 new feature cards + footer entries

---

### Feature F18: CI/CD, Admin Panel, User Dashboard, Event Maps — COMPLETED (February 21, 2026)

**Description**: Batch of 4 features: GitHub Actions CI/CD pipeline, platform admin panel with user/event moderation, personalized user dashboard, and interactive event maps with geocoding. Single Prisma migration for all schema changes.

**Sub-features**:

**F18a — CI/CD Pipeline**:
- GitHub Actions workflow at `.github/workflows/deploy.yml`
- `test-and-build` job: checkout, Node 20, npm install, prisma generate, test, build backend + frontend
- `deploy` job: raw SSH (writes key to temp file, runs deploy commands, cleans up) — chosen over `appleboy/ssh-action` which had RSA key parsing issues (`crypto/rsa: invalid modulus`)
- Triggers on push to `master` and PRs (deploy only runs on push to master)
- Requires GitHub Secrets: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`
- Integration tests auto-skip in CI (no DATABASE_URL) via `describe.skip`
- GitHub Secrets set via `gh` CLI to avoid clipboard paste corruption

**F18b — User Dashboard**:
- New module: `src/modules/dashboard/` (service, controller, routes)
- `GET /api/dashboard` — aggregated stats: ticket counts (total, upcoming, attended), upcoming events (next 6), recent notifications (last 5)
- CREATOR extras: created events count, total revenue, recent sales feed
- EVENTEE extras: saved events count, waitlist count
- Frontend: `Dashboard.tsx` with welcome greeting, stat cards, upcoming events grid, role-specific content, quick action buttons
- Hero CTA for logged-in users links to `/dashboard`

**F18c — Event Maps**:
- New deps (client): `leaflet`, `react-leaflet`, `@types/leaflet`
- Schema: `latitude Float?`, `longitude Float?` added to Event model
- `src/utils/geocode.ts` — Nominatim geocoding with 1 req/sec rate limiting, fire-and-forget on event create
- `GET /events/nearby?lat=X&lng=X&radius=50` — Haversine distance via `prisma.$queryRaw`
- `EventMap.tsx` component: Leaflet MapContainer, dark mode tile swap (CartoDB Dark Matter), marker popups with event info
- `EventDetail.tsx` — mini map shown below location when lat/lng exist (lazy loaded)
- `Events.tsx` — List/Map view toggle; map view shows all geolocated events with clickable markers
- `CreateEvent.tsx` — optional latitude/longitude fields, auto-detect hint text
- Helmet CSP updated for `*.tile.openstreetmap.org`, `unpkg.com`, `*.basemaps.cartocdn.com`

**F18d — Admin Panel**:
- Schema: `ADMIN` added to Role enum, `suspended Boolean @default(false)` on User model
- New module: `src/modules/admin/` (schema, service, controller, routes)
- All routes behind `authenticate, authorize('ADMIN')`
- `GET /admin/stats` — platform totals (users, events, tickets, revenue), usersByRole breakdown, last-30-day counts
- `GET /admin/users` — paginated with search + role filter; includes `_count` for events/tickets
- `PUT /admin/users/:id/role` — change user role (CREATOR/EVENTEE/ADMIN)
- `PUT /admin/users/:id/suspend` — toggle suspend (cannot suspend admins)
- `GET /admin/events` — paginated with search; `DELETE /admin/events/:id`
- `GET /admin/payments` — paginated payment list
- Suspended users blocked from login in `login()`, `googleLogin()`, `githubLogin()` with clear error message
- Frontend: `AdminDashboard.tsx` (stat cards, users-by-role pie chart via recharts, last-30-day counts, quick links)
- `AdminUsers.tsx` (paginated table, search/role filter, role dropdown, suspend toggle, suspended row highlighting)
- `AdminEvents.tsx` (paginated table, search, delete with confirmation modal)
- Layout: Admin `NavDropdown` with Dashboard/Users/Events links (desktop + mobile), icon: `HiOutlineShieldCheck`

**First admin user**: `belloibrahimolawale@gmail.com` promoted to ADMIN via direct DB update on EC2.

**Schema Changes** (migration `20260221162759_add_f18_features`):
- Enum: `Role` — added `ADMIN`
- User model: added `suspended Boolean @default(false)`
- Event model: added `latitude Float?`, `longitude Float?`

**New Files**:
- `.github/workflows/deploy.yml` — CI/CD workflow
- `src/modules/admin/admin.schema.ts` — Zod validators
- `src/modules/admin/admin.service.ts` — Platform CRUD
- `src/modules/admin/admin.controller.ts` — HTTP handlers
- `src/modules/admin/admin.routes.ts` — Express routes with Swagger docs
- `src/modules/dashboard/dashboard.service.ts` — Aggregated dashboard data
- `src/modules/dashboard/dashboard.controller.ts` — Handler
- `src/modules/dashboard/dashboard.routes.ts` — Route
- `src/utils/geocode.ts` — Nominatim geocoding utility
- `client/src/components/EventMap.tsx` — Leaflet map component
- `client/src/pages/AdminDashboard.tsx` — Admin stats page
- `client/src/pages/AdminUsers.tsx` — Admin user management page
- `client/src/pages/AdminEvents.tsx` — Admin event management page
- `client/src/pages/Dashboard.tsx` — User dashboard page
- `prisma/migrations/20260221162759_add_f18_features/migration.sql`

**Modified Files**:
- `prisma/schema.prisma` — ADMIN role, suspended field, lat/lng fields
- `src/app.ts` — Registered admin + dashboard routes, updated Helmet CSP for map tiles
- `src/modules/auth/auth.service.ts` — Suspended user checks in login, googleLogin, githubLogin
- `src/modules/events/event.schema.ts` — latitude/longitude in create + update schemas
- `src/modules/events/event.service.ts` — Fire-and-forget geocode on create, getNearby() with Haversine SQL
- `src/modules/events/event.controller.ts` — getNearby handler
- `src/modules/events/event.routes.ts` — GET /events/nearby route
- `client/src/types/index.ts` — ADMIN role, latitude/longitude on Event
- `client/src/App.tsx` — /dashboard, /admin, /admin/users, /admin/events routes
- `client/src/components/Layout.tsx` — Dashboard link, Admin dropdown (desktop + mobile)
- `client/src/pages/Events.tsx` — List/Map view toggle with lazy-loaded EventMap
- `client/src/pages/EventDetail.tsx` — Mini map below location when coordinates exist
- `client/src/pages/CreateEvent.tsx` — Optional lat/lng fields, auto-detect hint
- `client/src/pages/LandingPage.tsx` — 4 new feature cards + footer entries, hero CTA → /dashboard
- `client/package.json` — leaflet, react-leaflet, @types/leaflet dependencies

**CI/CD GitHub Secrets Setup** (recommended: use `gh` CLI to avoid paste issues):
```bash
# Install gh CLI and authenticate
gh auth login --hostname github.com --git-protocol https --web
# Set secrets programmatically (no clipboard corruption)
echo "13.43.80.112" | gh secret set EC2_HOST --repo ibraheembello/Eventful-Platform
echo "bitnami" | gh secret set EC2_USER --repo ibraheembello/Eventful-Platform
gh secret set EC2_SSH_KEY --repo ibraheembello/Eventful-Platform < ~/.ssh/lightsail_key.pem
```
Manual alternative: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

**CI/CD Troubleshooting**:
- `crypto/rsa: invalid modulus` → SSH key corrupted during paste. Use `gh` CLI to set the secret, or raw SSH instead of `appleboy/ssh-action`
- Integration tests fail in CI → Expected; they auto-skip when `DATABASE_URL` is absent
- Deploy timeout → Check EC2 security group allows port 22 from `0.0.0.0/0` (GitHub Actions IPs vary)

---

### Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | ~~F1: Event Search Filters~~ | ~~Medium~~ | **DONE** |
| 2 | ~~F5: Export Tickets as PDF~~ | ~~Low~~ | **DONE** |
| 3 | ~~F2: Bookmark/Save Events~~ | ~~Low~~ | **DONE** |
| 4 | ~~F9: Attendee Check-in List~~ | ~~Medium~~ | **DONE** |
| 5 | ~~F8: Creator Dashboard Charts~~ | ~~Medium~~ | **DONE** |
| 6 | ~~F4: Waitlist for Sold-Out Events~~ | ~~Medium~~ | **DONE** |
| 7 | ~~F3: Event Comments/Reviews~~ | ~~Medium~~ | **DONE** |
| 8 | ~~F6: Email Notifications~~ | ~~Medium~~ | **DONE** |
| 9 | ~~F7: Event Update Notifications~~ | ~~Low~~ | **DONE** |
| 10 | ~~F10: Multi-Image Gallery~~ | ~~Medium~~ | **DONE** |
| 11 | ~~F11: Dual-Role Access~~ | ~~Low~~ | **DONE** |
| 12 | ~~F12: Discount/Promo Codes~~ | ~~Medium~~ | **DONE** |
| 13 | ~~F13: Social Login (Google + GitHub)~~ | ~~Medium~~ | **DONE** |
| 14 | ~~F14: Forgot Password / Password Reset~~ | ~~Low~~ | **DONE** |
| 15 | ~~F15: Event Categories Page~~ | ~~Low~~ | **DONE** |
| 16 | ~~F16: Recurring/Series Events~~ | ~~Medium~~ | **DONE** |
| 17 | ~~F17: Draft/Publish, Notifications, Clone, CSV Export, Transfer, Co-Hosts, Ticket Types~~ | ~~High~~ | **DONE** |
| 18 | ~~F18: CI/CD, Admin Panel, User Dashboard, Event Maps~~ | ~~High~~ | **DONE** |

---

## Files Created/Modified During Deployment

### Modified Files
- `package.json` - Added postinstall and build scripts, multer dependency
- `src/app.ts` - Added production mode, React serving, upload routes, static serving, helmet CORP
- `src/config/redis.ts` - Made Redis optional
- `src/middleware/rateLimiter.ts` - Conditional Redis store
- `src/utils/cache.ts` - Added null checks for Redis
- `client/src/context/ThemeContext.tsx` - Fixed type imports
- `client/src/types/index.ts` - Added category field
- `.gitignore` - Added *.zip and uploads/ exclusions

### New Files (Image Upload Feature)
- `src/middleware/upload.ts` - Multer configuration
- `src/modules/upload/upload.routes.ts` - Upload API endpoint

---

## Project Statistics

- **Total Files**: 165+
- **Lines of Code**: 31,000+
- **Dependencies**: 660+ packages
- **Build Time**: ~5-10 minutes
- **Deployment Time**: ~5-10 minutes per deployment (automated via CI/CD)
- **Database Tables**: 15 (Users, Events, Tickets, Payments, Notifications, Bookmarks, Comments, Waitlists, EventImages, PromoCode, EventSeries, InAppNotifications, EventCollaborators, TicketTransfers, TicketTypes)
- **API Endpoints**: 85+ (full CRUD for events, tickets, payments, promo codes, comments, waitlists, bookmarks, attendees, analytics, upload, auth incl. Google/GitHub OAuth, password reset, categories, event series, in-app notifications, ticket types, collaborators, ticket transfer, draft/publish, duplicate, admin panel, dashboard, nearby events)
- **Frontend Pages**: 27+ (Landing, Events, EventDetail, CreateEvent, SeriesDetail, MyTickets, Reminders, SavedEvents, MyWaitlists, Analytics, AttendeeList, PromoCodes, Profile, Categories, NotificationsInbox, Dashboard, AdminDashboard, AdminUsers, AdminEvents, Login, Register, ForgotPassword, ResetPassword, PaymentCallback, GitHubCallback, GoogleCallback, VerifyTicket)
- **Completed Features**: 18 (F1-F18 all implemented and deployed)

---

## Next Steps

### For Production
1. ~~Set up Nginx reverse proxy with SSL (HTTPS)~~ — Done (Apache + Let's Encrypt)
2. ~~Register a custom domain via Route 53~~ — Done (eventful-platform.com)
3. Add Redis (ElastiCache) for caching and rate limiting
4. Set up CloudWatch monitoring and alerts
5. Implement automated database backups
6. ~~Set up CI/CD pipeline with GitHub Actions~~ — Done (F18a)
7. Allocate Elastic IP to prevent IP changes

### For Portfolio
1. Add professional README.md
2. Create demo video
3. Add screenshots to repository
4. Write technical blog post about deployment challenges
5. Update LinkedIn and portfolio website

---

## Support & Resources

### Documentation
- AWS EC2: https://docs.aws.amazon.com/ec2/
- AWS CLI: https://docs.aws.amazon.com/cli/
- PM2: https://pm2.keymetrics.io/docs/
- Prisma Docs: https://www.prisma.io/docs
- Express.js: https://expressjs.com
- React: https://react.dev

### Project Links
- Live App: https://eventful-platform.com
- GitHub: https://github.com/ibraheembello/Eventful-Platform
- API Docs: https://eventful-platform.com/api/docs

---

## Acknowledgments

- **AltSchool Africa** - For the comprehensive backend engineering training
- **Instructors & Mentors** - For guidance throughout the learning journey
- **AWS** - For providing reliable cloud infrastructure
- **Paystack** - For seamless payment integration APIs
- **Open Source Community** - For amazing tools and libraries

---

## License

This project was built as a final semester project for AltSchool Africa School of Software Engineering.

---

**Built by Ibrahim Bello**
**Status**: Successfully Deployed on AWS EC2

---

*This documentation was created with assistance from Claude Code (Anthropic) to capture the complete deployment journey for future reference and learning.*

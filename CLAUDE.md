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

### Git Deployment

```bash
# Deploy latest changes (on EC2)
cd /home/bitnami/Eventful-Platform
export PATH=/opt/bitnami/node/bin:$PATH
git pull origin master
npm install
pm2 restart eventful-api

# Deploy to GitHub (locally)
git add .
git commit -m "Your commit message"
git push origin master

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

### Feature F7: Event Edit/Update Notifications

**Description**: Notify all ticket holders when an event's details change (date, time, location, or cancellation).

**Checklist**:
- [ ] Track which fields changed in event update handler (compare old vs new values)
- [ ] Create `EventUpdate` model or use existing `Notification` model with an `UPDATE` type
- [ ] Create bulk notification when event date, time, or location changes
- [ ] Show in-app notification banner on EventDetail page: "This event was updated on [date]"
- [ ] Add update history/changelog to EventDetail page
- [ ] Send email notification to all ticket holders (depends on F6)
- [ ] Handle event cancellation: notify all ticket holders, update ticket statuses
- [ ] Show "Updated" badge on event cards if updated recently (last 48 hours)
- [ ] Add `lastNotifiedAt` to prevent duplicate notifications

**Success Criteria**:
- When a creator updates event date or location, all ticket holders receive an in-app notification
- Notification clearly states what changed (e.g., "Date changed from March 5 to March 12")
- Event cancellation marks all tickets as CANCELLED and notifies holders
- Update notifications are sent within 1 minute of the change
- Creators see a confirmation: "X ticket holders will be notified"
- No duplicate notifications for the same update

---

### Feature F8: Creator Dashboard Stats (Charts)

**Description**: Enhanced analytics with interactive charts showing ticket sales over time, revenue breakdown, and attendee demographics.

**Checklist**:
- [ ] Install charting library (`recharts`, `chart.js` with `react-chartjs-2`, or `nivo`)
- [ ] Create `GET /analytics/charts` backend endpoint with time-series data
- [ ] Add line chart: ticket sales over time (daily/weekly/monthly)
- [ ] Add bar chart: revenue per event
- [ ] Add pie/donut chart: ticket status breakdown (active vs used vs cancelled)
- [ ] Add comparison metrics: "vs last month" percentage change
- [ ] Add date range selector for chart data (last 7 days, 30 days, 90 days, all time)
- [ ] Add per-event analytics drill-down (click event name to see its specific stats)
- [ ] Add top-performing events leaderboard
- [ ] Make charts responsive and dark-mode compatible

**Success Criteria**:
- Charts load within 2 seconds
- Charts are interactive (hover for tooltips, click to drill down)
- All charts support dark mode
- Date range selector updates all charts simultaneously
- Per-event drill-down shows: daily sales, revenue, check-in rate, capacity utilization
- Charts are responsive on mobile (readable on small screens)
- Empty state when no data exists ("Create your first event to see analytics")

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

### Feature F10: Multi-Image Event Gallery

**Description**: Allow event creators to upload multiple images per event instead of just one cover image.

**Checklist**:
- [ ] Add `EventImage` model to Prisma schema (`eventId`, `imageUrl`, `order`, `caption?`, timestamps)
- [ ] Run Prisma migration
- [ ] Update `POST /api/upload` to support multiple files (or create `POST /api/upload/multiple`)
- [ ] Create `POST /events/:id/images` endpoint (add images to event)
- [ ] Create `DELETE /events/:id/images/:imageId` endpoint (remove image)
- [ ] Create `PUT /events/:id/images/reorder` endpoint (change image order)
- [ ] Update EventDetail page with image gallery/carousel
- [ ] Add lightbox view (click image to see full size)
- [ ] Update CreateEvent page to support multiple image uploads
- [ ] Add drag-to-reorder for image gallery on edit
- [ ] First image (order=0) is the cover image shown on event cards
- [ ] Update frontend types (`EventImage` interface)

**Success Criteria**:
- Creators can upload up to 10 images per event
- Images display in a responsive gallery/carousel on EventDetail
- First image is automatically used as the cover image on event cards
- Drag-and-drop reordering works on the edit page
- Deleting an image removes it from storage and database
- Lightbox opens on click with left/right navigation
- Gallery is touch-friendly on mobile (swipe to navigate)
- Images are optimized (compressed/resized on upload if > 2MB)

---

### Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | ~~F1: Event Search Filters~~ | ~~Medium~~ | **DONE** |
| 2 | ~~F5: Export Tickets as PDF~~ | ~~Low~~ | **DONE** |
| 3 | ~~F2: Bookmark/Save Events~~ | ~~Low~~ | **DONE** |
| 4 | ~~F9: Attendee Check-in List~~ | ~~Medium~~ | **DONE** |
| 5 | F8: Creator Dashboard Charts | Medium | Medium — visual polish for analytics |
| 6 | F4: Waitlist for Sold-Out Events | Medium | Medium — handles sold-out gracefully |
| 7 | F3: Event Comments/Reviews | Medium | Medium — adds social proof |
| 8 | F6: Email Notifications | Medium | High — professional communication |
| 9 | F7: Event Update Notifications | Low | Medium — depends on F6 |
| 10 | F10: Multi-Image Gallery | Medium | Low — nice-to-have visual upgrade |

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

- **Total Files**: 135+
- **Lines of Code**: 23,000+
- **Dependencies**: 647 packages
- **Build Time**: ~5-10 minutes
- **Deployment Time**: ~5-10 minutes per deployment
- **Database Tables**: 6 (Users, Events, Tickets, Payments, Notifications, Reminders)
- **API Endpoints**: 32+ (including POST /api/upload, PUT /auth/profile)
- **Frontend Pages**: 11+ (including Profile page)
- **Live Events**: 26 (11 with images, 15 without)

---

## Next Steps

### For Production
1. Set up Nginx reverse proxy with SSL (HTTPS)
2. Register a custom domain via Route 53
3. Add Redis (ElastiCache) for caching and rate limiting
4. Set up CloudWatch monitoring and alerts
5. Implement automated database backups
6. Set up CI/CD pipeline with GitHub Actions
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CREATOR' | 'EVENTEE' | 'ADMIN';
  profileImage?: string;
  provider?: string;
  createdAt: string;
}

export interface EventImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  createdAt: string;
}

export interface EventSeries {
  id: string;
  title: string;
  recurrencePattern: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  totalOccurrences: number;
  creator?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  description?: string;
  sortOrder: number;
  _count?: { tickets: number };
  eventId: string;
}

export interface EventCollaborator {
  id: string;
  role: 'CO_HOST';
  accepted: boolean;
  createdAt: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface InAppNotification {
  id: string;
  message: string;
  link?: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  price: number;
  imageUrl?: string;
  category?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  creatorId: string;
  creator?: { id: string; firstName: string; lastName: string };
  _count?: { tickets: number };
  images?: EventImage[];
  seriesId?: string;
  series?: { id: string; title?: string; recurrencePattern?: string; totalOccurrences: number };
  seriesOccurrence?: number;
  ticketTypes?: TicketType[];
  collaborators?: EventCollaborator[];
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  qrCode: string;
  qrToken: string;
  qrCodeData?: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  scannedAt?: string;
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
  };
  ticketType?: { id: string; name: string };
  payment?: { amount: number; status: string };
  user?: { id: string; firstName: string; lastName: string; email: string };
  createdAt?: string;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paystackReference: string;
  event?: { id: string; title: string };
  user?: { id: string; firstName: string; lastName: string; email: string };
  ticket?: Ticket;
  paidAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  eventId: string;
  reminderValue: number;
  reminderUnit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';
  scheduledFor: string;
  sent: boolean;
  event: { id: string; title: string; date: string };
  createdAt: string;
}

export interface Analytics {
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  totalAttendees: number;
}

export interface ShareLinks {
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  email: string;
  directLink: string;
}

export interface Bookmark {
  id: string;
  eventId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  rating: number;
  userId: string;
  eventId: string;
  user: { id: string; firstName: string; lastName: string; profileImage?: string };
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  isActive: boolean;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  eventId?: string;
  event?: { id: string; title: string };
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  position: number;
  notified: boolean;
  eventId: string;
  event: Event;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

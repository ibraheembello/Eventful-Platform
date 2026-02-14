export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CREATOR' | 'EVENTEE';
  profileImage?: string;
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
  creatorId: string;
  creator?: { id: string; firstName: string; lastName: string };
  _count?: { tickets: number };
  createdAt: string;
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

// Core data models
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  clientId?: string | null;
  clientSlug?: string | null;
  clientName?: string | null;
  clientType?: string | null;
}

export interface ClientType {
  id: number;
  name: string;
  description?: string;
}

export interface Client {
  id: number;
  name: string;
  bio?: string;
  slug: string;
  clientTypeId: number;
  clientType?: ClientType;
  userId: number;
  user?: User;
  services?: ClientService[];
}

export interface ClientService {
  id: number;
  clientId: number;
  serviceId: number;
  price: string;
  active: boolean;
  service: Service;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  clientId: number;
  customerId: number;
  clientServiceId?: number | null;
  client?: Client;
  customer?: Customer;
  clientService?: ClientService;
}

export interface Availability {
  id: number;
  clientId: number;
  date: string;
  time: string;
}

export interface AuditLog {
  id: number;
  clientId: number;
  action: string;
  details?: string;
  actionDate: string | Date;
  ipAddress?: string;
  client?: {
    name: string;
  };
}

// Statistics interfaces
export interface ClientStats {
  todayAppointments: number;
  upcomingAppointments: number;
  totalCustomers: number;
  revenue: number;
}

export interface AdminStats {
  totalClients: number;
  totalAppointments: number;
  totalCustomers: number;
  revenue: number;
}

// Form and UI related interfaces
export type ValuePiece = Date | null;
export type Value = ValuePiece | [ValuePiece, ValuePiece];

export interface AppointmentFormValues {
  name: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

// Specific slot types for time selection
export type Slot = string;

export type TimeSlotOption = 
  '09:00 AM' |
  '09:30 AM' |
  '10:00 AM' |
  '10:30 AM' |
  '11:00 AM' |
  '11:30 AM' |
  '12:00 PM' |
  '12:30 PM' |
  '01:00 PM' |
  '01:30 PM' |
  '02:00 PM' |
  '02:30 PM' |
  '03:00 PM' |
  '03:30 PM' |
  '04:00 PM' |
  '04:30 PM' |
  '05:00 PM';

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

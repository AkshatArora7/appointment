export type Slot = 
  '09:00 AM - 09:30 AM' |
  '09:30 AM - 10:00 AM' |
  '10:00 AM - 10:30 AM' |
  '10:30 AM - 11:00 AM' |
  '11:00 AM - 11:30 AM' |
  '11:30 AM - 12:00 PM' |
  '12:00 PM - 12:30 PM' |
  '12:30 PM - 01:00 PM' |
  '01:00 PM - 01:30 PM' |
  '01:30 PM - 02:00 PM' |
  '02:00 PM - 02:30 PM' |
  '02:30 PM - 03:00 PM' |
  '03:00 PM - 03:30 PM' |
  '03:30 PM - 04:00 PM' |
  '04:00 PM - 04:30 PM' |
  '04:30 PM - 05:00 PM';

export type ValuePiece = Date | null;

export type Value = ValuePiece | [ValuePiece, ValuePiece];

export interface Barber {
  id: number;
  name: string;
  bio?: string;
  slug: string;
  services?: Service[];
}

export interface Service {
  id: number;
  price: string;
  service: {
    id: number;
    name: string;
    duration: number;
    description?: string;
  };
}

export interface AppointmentFormValues {
  name: string;
  email: string;
  phone: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

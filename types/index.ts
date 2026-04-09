export type BookingStatus = "pending" | "confirmed" | "rejected";

export interface Desk {
  id: number;
  name: string;
  is_active: boolean;
}

export interface DeskAssignment {
  id: number;
  booking_id: string;
  desk_id: number;
  date: string;
  desk?: Desk;
}

export interface MeetingRoomBooking {
  id: string;
  booking_id: string;
  date: string;
  start_time: string;
  end_time: string;
  visitor_name?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  date: string;
  num_guests: number;
  name: string;
  company: string;
  purpose: string;
  phone: string;
  email: string;
  status: BookingStatus;
  admin_notes?: string;
  created_at: string;
  desk_assignments?: DeskAssignment[];
  meeting_room_bookings?: MeetingRoomBooking[];
}

export interface AvailabilityResult {
  available: boolean;
  total_desks: number;
  occupied: number;
  free: number;
  requested: number;
  closed?: boolean;
}

export interface ClosedDate {
  id: number;
  date: string;
  reason: string | null;
}

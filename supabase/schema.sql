-- ============================================================
-- Office Booking System — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Desks
create table if not exists desks (
  id   serial primary key,
  name text    not null,
  is_active boolean default true
);

-- Insert 10 default desks
insert into desks (name) values
  ('Desk A1'), ('Desk A2'), ('Desk A3'), ('Desk A4'), ('Desk A5'),
  ('Desk B1'), ('Desk B2'), ('Desk B3'), ('Desk B4'), ('Desk B5');

-- Bookings (desk reservation requests)
create table if not exists bookings (
  id         uuid primary key default gen_random_uuid(),
  date       date    not null,
  num_guests integer not null check (num_guests >= 1 and num_guests <= 10),
  name       text    not null,
  company    text    not null,
  purpose    text    not null,
  phone      text    not null,
  email      text    not null,
  status     text    not null default 'pending'
               check (status in ('pending', 'confirmed', 'rejected')),
  admin_notes text,
  created_at  timestamptz default now()
);

-- Desk assignments (set when admin confirms a booking)
create table if not exists desk_assignments (
  id         serial primary key,
  booking_id uuid    not null references bookings(id) on delete cascade,
  desk_id    integer not null references desks(id),
  date       date    not null,
  unique (desk_id, date)
);

-- Meeting room bookings (auto-confirmed, time-based)
-- Only allowed after desk booking is confirmed
create table if not exists meeting_room_bookings (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  date       date not null,
  start_time time not null,
  end_time   time not null,
  visitor_name text,
  created_at timestamptz default now()
);

-- Closed dates (office unavailable)
create table if not exists closed_dates (
  id     serial primary key,
  date   date not null unique,
  reason text
);

-- Indexes
create index if not exists idx_bookings_date   on bookings(date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_desk_assign_date on desk_assignments(date);
create index if not exists idx_meeting_date     on meeting_room_bookings(date);

-- CarryMate database schema (Supabase PostgreSQL)
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- 1. users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  phone text unique not null,
  upi_id text default '',
  trust_score integer default 50 check (trust_score >= 0),
  created_at timestamptz default now()
);

-- 2. trips
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  source text not null,
  destination text not null,
  travel_date date not null,
  available_weight numeric not null check (available_weight > 0),
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- 3. requests
create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  source text not null,
  destination text not null,
  item_name text not null,
  item_description text default '',
  weight numeric not null check (weight > 0),
  image_url text default '',
  needed_by date not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'delivered', 'cancelled', 'expired')),
  created_at timestamptz default now()
);

-- 4. delivery_requests (only accepted/rejected/etc relationships, never calculated matches)
create table if not exists delivery_requests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  request_id uuid not null references requests(id) on delete cascade,
  delivery_fee numeric default 0 check (delivery_fee >= 0),
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'delivered', 'cancelled')),
  created_at timestamptz default now(),
  unique(trip_id, request_id)
);

create index if not exists idx_trips_user_id on trips(user_id);
create index if not exists idx_trips_route_status on trips(source, destination, status);
create index if not exists idx_requests_sender_id on requests(sender_id);
create index if not exists idx_requests_route_status on requests(source, destination, status);
create index if not exists idx_delivery_requests_trip_id on delivery_requests(trip_id);
create index if not exists idx_delivery_requests_request_id on delivery_requests(request_id);

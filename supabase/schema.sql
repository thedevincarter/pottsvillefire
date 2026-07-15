-- Run this in the Supabase SQL Editor to set up the database

create table runs (
  id uuid primary key default gen_random_uuid(),
  date timestamptz,
  call_type text,
  complaint text,
  address text,
  mutual_aid text,
  created_at timestamptz default now()
);

create table run_responses (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade not null,
  member_name text not null,
  member_email text not null,
  created_at timestamptz default now(),
  unique(run_id, member_email)
);

-- Index for fast lookups by run
create index idx_run_responses_run_id on run_responses(run_id);

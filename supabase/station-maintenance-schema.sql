-- Station maintenance log: work performed at a station (Central / Station 2).
create table station_maintenance (
  id uuid primary key default gen_random_uuid(),
  station text not null, -- 'central' | 'station_2'
  work_done text not null,
  member_name text not null,
  created_at timestamptz not null default now()
);

alter table station_maintenance enable row level security;

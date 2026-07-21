-- Maintenance requests / issues to be addressed, for either an apparatus or a
-- station. Exactly one target (apparatus_id XOR station) is set per row.
create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  apparatus_id uuid references apparatus(id),
  station text, -- 'central' | 'station_2'
  description text not null,
  status text not null default 'unresolved', -- 'unresolved' | 'resolved' | 'wont_do'
  member_name text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  constraint maintenance_requests_one_target
    check ((apparatus_id is not null) <> (station is not null))
);

create index maintenance_requests_apparatus_id_idx on maintenance_requests (apparatus_id);
create index maintenance_requests_station_idx on maintenance_requests (station);

alter table maintenance_requests enable row level security;

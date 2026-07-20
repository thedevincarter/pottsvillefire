-- Apparatus maintenance logs: free-form records of work performed on a unit.
create table apparatus_maintenance (
  id uuid primary key default gen_random_uuid(),
  apparatus_id uuid not null references apparatus(id),
  mileage integer,
  work_done text not null,
  member_name text not null,
  created_at timestamptz not null default now()
);

create index apparatus_maintenance_apparatus_id_idx
  on apparatus_maintenance (apparatus_id);

alter table apparatus_maintenance enable row level security;

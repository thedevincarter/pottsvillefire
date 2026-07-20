-- Training log: admin-created training sessions with a date, type, and the
-- members who attended.
create table trainings (
  id uuid primary key default gen_random_uuid(),
  date timestamptz,
  type text,
  created_at timestamptz not null default now()
);

create table training_attendees (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  member_name text not null,
  created_at timestamptz not null default now(),
  unique (training_id, member_name)
);

create index training_attendees_training_id_idx
  on training_attendees (training_id);

alter table trainings enable row level security;
alter table training_attendees enable row level security;

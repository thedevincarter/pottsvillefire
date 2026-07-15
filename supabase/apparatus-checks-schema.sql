-- Apparatus (trucks)
create table apparatus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table apparatus enable row level security;

-- Check items (admin-managed checklist template)
create table check_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table check_items enable row level security;

-- Apparatus checks (one per apparatus per month)
create table apparatus_checks (
  id uuid primary key default gen_random_uuid(),
  apparatus_id uuid not null references apparatus(id),
  month text not null, -- 'YYYY-MM' format
  member_name text not null,
  general_notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (apparatus_id, month)
);

alter table apparatus_checks enable row level security;

-- Individual check results
create table apparatus_check_results (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references apparatus_checks(id) on delete cascade,
  check_item_id uuid not null references check_items(id),
  checked boolean not null default false,
  notes text,
  unique (check_id, check_item_id)
);

alter table apparatus_check_results enable row level security;

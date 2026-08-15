-- Months whose run responses are frozen. A row's presence means locked;
-- unlocking deletes the row. Month is the department-local 'YYYY-MM' key.
create table locked_months (
  month text primary key,
  locked_by text not null,
  locked_at timestamptz not null default now()
);

alter table locked_months enable row level security;

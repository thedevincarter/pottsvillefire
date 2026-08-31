-- Future months whose apparatus checks admins have opened ahead of the 1st.
-- Checks normally run only for the current department-local month; a row here
-- lets that month's checklists be started early (e.g. when the first Monday of
-- the month lands on a holiday). The row's presence means open; closing the
-- month deletes it. Month is the department-local 'YYYY-MM' key.
create table open_check_months (
  month text primary key,
  opened_by text not null,
  opened_at timestamptz not null default now()
);

alter table open_check_months enable row level security;

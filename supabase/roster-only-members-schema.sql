-- Roster-only members: people on the roster who don't have an email yet, so
-- they have no login. They're ordinary profiles rows with a null email and no
-- matching auth.users row, which keeps one roster for the whole app —
-- responding members, maintenance assignees and export columns all read
-- profiles.full_name and pick these up for free.

-- 1. A profile without a login has no auth user to borrow an id from.
alter table profiles alter column id set default gen_random_uuid();

-- 2. ...and no email.
alter table profiles alter column email drop not null;

-- 3. Drop the FK to auth.users so such a row can exist at all. Looked up by
--    catalog rather than assuming the default constraint name.
--    Note: this also drops the on-delete cascade from auth.users, so removing
--    an auth user now leaves its profile behind. Nothing in the app deletes
--    auth users today (accounts are disabled, not deleted).
do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass;

  if fk_name is not null then
    execute format('alter table public.profiles drop constraint %I', fk_name);
  end if;
end $$;

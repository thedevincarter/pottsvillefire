-- Profiles table linked to Supabase auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'member', -- 'member' or 'admin'
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Allow users to read all profiles (roster visibility)
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add user_id columns to existing tables for linking
alter table run_responses add column user_id uuid references profiles(id);
alter table apparatus_checks add column user_id uuid references profiles(id);

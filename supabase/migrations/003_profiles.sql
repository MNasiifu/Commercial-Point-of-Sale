-- ============================================================
-- Kids & Baby Store POS — Migration 003: User Profiles
-- Run after 002
-- ============================================================

-- ─── Profiles ────────────────────────────────────────────────
-- Extends auth.users — one row per authenticated user.
-- branch_id scopes a teller/manager to one shop. Admin sees everything.
create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text not null,
  email                text not null unique,
  role                 user_role not null default 'teller',
  branch_id            uuid references branches(id) on delete set null,
  must_change_password boolean not null default true,
  is_active            boolean not null default true,
  last_login_at        timestamptz,
  created_by           uuid references profiles(id) on delete set null,
  deleted_at           timestamptz,    -- soft delete
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Helper: create profile on auth.user creation ────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role, branch_id, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_app_meta_data->>'role')::user_role, 'teller'),
    (new.raw_app_meta_data->>'branch_id')::uuid,
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Helper: update last_login_at ────────────────────────────
create or replace function handle_user_login()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update profiles set last_login_at = now() where id = new.id;
  return new;
end;
$$;

-- ─── Auth helper functions (used in RLS) ─────────────────────
create or replace function get_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function get_user_branch_id()
returns uuid language sql security definer stable as $$
  select branch_id from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql security definer stable as $$
  select role = 'admin' from profiles where id = auth.uid()
$$;

create or replace function is_admin_or_manager()
returns boolean language sql security definer stable as $$
  select role in ('admin', 'manager') from profiles where id = auth.uid()
$$;

-- ─── Helper: is the given branch the main store? ─────────────
create or replace function is_main_store(p_branch_id uuid)
returns boolean language sql stable as $$
  select coalesce((select is_main_store from branches where id = p_branch_id), false)
$$;

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_profiles_role        on profiles(role);
create index idx_profiles_branch_id    on profiles(branch_id);
create index idx_profiles_email        on profiles(email);
create index idx_profiles_not_deleted  on profiles(id) where deleted_at is null;

-- =========================================================
-- Addressor - Phase 1 Foundation
-- Source of truth: Supabase SQL migrations
-- =========================================================

begin;

-- ---------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ---------------------------------------------------------
-- Utility function: auto-update updated_at
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  phone text unique,
  full_name text not null,
  avatar_url text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  country text,
  city text,
  preferred_currency text,
  preferred_language text,
  default_mode text not null default 'local'
    check (default_mode in ('local', 'visitor')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_roles_user_id_role_id_unique unique (user_id, role_id)
);

-- ---------------------------------------------------------
-- BUSINESSES
-- ---------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete restrict,

  legal_name text not null,
  display_name text not null,
  slug text not null unique,

  category text not null
    check (category in (
      'restaurant',
      'nightlife',
      'stay',
      'event_venue',
      'experience',
      'tour_operator'
    )),

  short_description text,
  phone text,
  email text,
  website_url text,
  whatsapp_number text,

  country text not null default 'Rwanda',
  city text not null,
  district text,
  sector text,
  address_line text,

  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'pending', 'verified', 'rejected')),

  onboarding_status text not null default 'draft'
    check (onboarding_status in ('draft', 'in_review', 'live')),

  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'pro', 'premium', 'past_due', 'cancelled')),

  logo_url text,
  cover_image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- BRANCHES
-- ---------------------------------------------------------
create table if not exists public.business_branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,

  name text not null,
  slug text not null,
  branch_code text,

  phone text,
  email text,
  whatsapp_number text,

  country text not null default 'Rwanda',
  city text not null,
  district text,
  sector text,
  address_line text not null,

  latitude double precision,
  longitude double precision,
  location geography(Point, 4326),

  is_head_office boolean not null default false,

  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_branches_business_id_slug_unique unique (business_id, slug)
);

-- ---------------------------------------------------------
-- TEAM MEMBERS
-- ---------------------------------------------------------
create table if not exists public.business_team_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.business_branches(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,

  role text not null
    check (role in ('owner', 'manager', 'editor', 'booking_manager')),

  status text not null default 'active'
    check (status in ('invited', 'active', 'removed')),

  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),

  constraint business_team_members_unique unique (business_id, user_id, role)
);

-- ---------------------------------------------------------
-- PLATFORM SETTINGS
-- ---------------------------------------------------------
create table if not exists public.platform_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value_json jsonb not null default '{}'::jsonb,
  updated_by_user_id uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- AUDIT LOGS
-- ---------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_phone on public.users(phone);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role_id on public.user_roles(role_id);

create index if not exists idx_businesses_owner_user_id on public.businesses(owner_user_id);
create index if not exists idx_businesses_category on public.businesses(category);
create index if not exists idx_businesses_city on public.businesses(city);
create index if not exists idx_businesses_verification_status on public.businesses(verification_status);
create index if not exists idx_businesses_subscription_status on public.businesses(subscription_status);

create index if not exists idx_business_branches_business_id on public.business_branches(business_id);
create index if not exists idx_business_branches_city on public.business_branches(city);
create index if not exists idx_business_branches_status on public.business_branches(status);
create index if not exists idx_business_branches_location_gist
  on public.business_branches
  using gist (location);

create index if not exists idx_business_team_members_business_id on public.business_team_members(business_id);
create index if not exists idx_business_team_members_user_id on public.business_team_members(user_id);
create index if not exists idx_business_team_members_branch_id on public.business_team_members(branch_id);

create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_entity_id on public.audit_logs(entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ---------------------------------------------------------
-- Triggers: updated_at
-- ---------------------------------------------------------
drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_user_profiles_set_updated_at on public.user_profiles;
create trigger trg_user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_businesses_set_updated_at on public.businesses;
create trigger trg_businesses_set_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

drop trigger if exists trg_business_branches_set_updated_at on public.business_branches;
create trigger trg_business_branches_set_updated_at
before update on public.business_branches
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Trigger: keep geography point in sync
-- ---------------------------------------------------------
create or replace function public.set_branch_location_from_lat_lng()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := ST_SetSRID(ST_MakePoint(new.longitude, new.latitude), 4326)::geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_business_branches_set_location on public.business_branches;
create trigger trg_business_branches_set_location
before insert or update of latitude, longitude
on public.business_branches
for each row
execute function public.set_branch_location_from_lat_lng();

commit;
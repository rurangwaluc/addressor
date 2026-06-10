begin;

-- ---------------------------------------------------------
-- Add real verification flags to users
-- ---------------------------------------------------------
alter table public.users
add column if not exists email_verified boolean not null default false,
add column if not exists phone_verified boolean not null default false;

-- ---------------------------------------------------------
-- OTP verification table
-- ---------------------------------------------------------
create table if not exists public.auth_verification_otps (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.users(id) on delete cascade,

  channel text not null
    check (channel in ('email', 'phone')),

  destination text not null,

  otp_hash text not null,

  expires_at timestamptz not null,
  consumed_at timestamptz,

  attempts integer not null default 0,
  max_attempts integer not null default 5,

  created_at timestamptz not null default now()
);

create index if not exists idx_auth_verification_otps_user_id
on public.auth_verification_otps(user_id);

create index if not exists idx_auth_verification_otps_channel
on public.auth_verification_otps(channel);

create index if not exists idx_auth_verification_otps_destination
on public.auth_verification_otps(destination);

create index if not exists idx_auth_verification_otps_expires_at
on public.auth_verification_otps(expires_at);

create index if not exists idx_auth_verification_otps_active_lookup
on public.auth_verification_otps(user_id, channel, consumed_at, expires_at);

commit;
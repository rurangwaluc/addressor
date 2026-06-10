begin;

-- Production session storage for opaque access/refresh tokens.
create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  access_token_hash text not null unique,
  refresh_token_hash text not null unique,

  user_agent text,
  ip_address text,

  expires_at timestamptz not null,
  refresh_expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create index if not exists idx_auth_sessions_user_id
on public.auth_sessions(user_id);

create index if not exists idx_auth_sessions_access_token_hash
on public.auth_sessions(access_token_hash);

create index if not exists idx_auth_sessions_refresh_token_hash
on public.auth_sessions(refresh_token_hash);

create index if not exists idx_auth_sessions_active_lookup
on public.auth_sessions(access_token_hash, revoked_at, expires_at);

-- Password reset tokens are stored hashed, single-use, and time-limited.
create table if not exists public.auth_password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_auth_password_reset_tokens_token_hash
on public.auth_password_reset_tokens(token_hash);

create index if not exists idx_auth_password_reset_tokens_user_id
on public.auth_password_reset_tokens(user_id);

-- OAuth account links for Google login and future providers.
create table if not exists public.auth_oauth_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,

  provider text not null,
  provider_account_id text not null,
  email text not null,
  email_verified boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint auth_oauth_accounts_provider_account_unique unique (provider, provider_account_id)
);

create index if not exists idx_auth_oauth_accounts_user_id
on public.auth_oauth_accounts(user_id);

create index if not exists idx_auth_oauth_accounts_email
on public.auth_oauth_accounts(email);

commit;
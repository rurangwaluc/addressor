begin;

alter table public.users
add column if not exists password_hash text;

create index if not exists idx_users_email
on public.users(email);

create index if not exists idx_users_phone
on public.users(phone);

commit;
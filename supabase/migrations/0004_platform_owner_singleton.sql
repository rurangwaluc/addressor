begin;

-- 1) Ensure platform roles exist
insert into public.roles (key, name)
values
  ('platform_owner', 'Platform Owner'),
  ('platform_admin', 'Platform Admin'),
  ('platform_support', 'Platform Support')
on conflict (key) do nothing;

-- 2) Create one platform owner user
-- Change these values before running.
insert into public.users (
  email,
  phone,
  full_name,
  status,
  email_verified,
  phone_verified
)
values (
  'rurangwa.luke@gmail.com',
  '250785587830',
  'Platform Owner',
  'active',
  true,
  true
)
on conflict (email) do update
set
  phone = excluded.phone,
  full_name = excluded.full_name,
  status = 'active',
  email_verified = true,
  phone_verified = true,
  updated_at = now();

-- 3) Assign platform_owner role to that user
insert into public.user_roles (user_id, role_id)
select
  u.id,
  r.id
from public.users u
join public.roles r on r.key = 'platform_owner'
where u.email = 'OWNER_EMAIL_HERE'
on conflict do nothing;

-- 4) Enforce only ONE platform_owner forever
create or replace function public.prevent_multiple_platform_owners()
returns trigger as $$
declare
  new_role_key text;
  owner_count integer;
begin
  select key into new_role_key
  from public.roles
  where id = new.role_id;

  if new_role_key = 'platform_owner' then
    select count(*) into owner_count
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where r.key = 'platform_owner'
      and ur.user_id <> new.user_id;

    if owner_count > 0 then
      raise exception 'Only one platform_owner is allowed';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_multiple_platform_owners on public.user_roles;

create trigger trg_prevent_multiple_platform_owners
before insert or update on public.user_roles
for each row
execute function public.prevent_multiple_platform_owners();

commit;
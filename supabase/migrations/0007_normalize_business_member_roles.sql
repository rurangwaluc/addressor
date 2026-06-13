begin;

alter table public.business_team_members
drop constraint if exists business_team_members_role_check;

update public.business_team_members
set role = case role
  when 'owner' then 'business_owner'
  when 'manager' then 'business_manager'
  when 'editor' then 'business_editor'
  when 'booking_manager' then 'business_manager'
  else role
end
where role in ('owner', 'manager', 'editor', 'booking_manager');

alter table public.business_team_members
add constraint business_team_members_role_check
check (
  role = any (
    array[
      'business_owner'::text,
      'business_admin'::text,
      'business_manager'::text,
      'business_editor'::text,
      'business_staff'::text
    ]
  )
);

commit;
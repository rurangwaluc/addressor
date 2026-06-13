begin;

alter table public.business_team_members
drop constraint if exists business_team_members_role_check;

update public.business_team_members
set role = case role
  when 'owner' then 'business_owner'
  when 'manager' then 'business_manager'
  when 'editor' then 'business_manager'
  when 'booking_manager' then 'business_manager'
  when 'business_admin' then 'business_manager'
  when 'business_editor' then 'business_manager'
  when 'content_manager' then 'business_manager'
  when 'availability_manager' then 'business_manager'
  else role
end
where role in (
  'owner',
  'manager',
  'editor',
  'booking_manager',
  'business_admin',
  'business_editor',
  'content_manager',
  'availability_manager'
);

alter table public.business_team_members
add constraint business_team_members_role_check
check (
  role = any (
    array[
      'business_owner'::text,
      'business_manager'::text,
      'business_staff'::text
    ]
  )
);

commit;
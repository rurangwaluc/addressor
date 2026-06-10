begin;

insert into public.roles (key, name, description)
values
  ('platform_owner', 'Platform Owner', 'Full control of the Addressor SaaS'),
  ('platform_admin', 'Platform Admin', 'Administrative support for platform operations'),
  ('platform_support', 'Platform Support', 'Support role for helping businesses and users'),
  ('business_owner', 'Business Owner', 'Owns and manages a business account'),
  ('business_manager', 'Business Manager', 'Manages business operations'),
  ('business_editor', 'Business Editor', 'Can edit business content'),
  ('customer', 'Customer', 'Regular user of Addressor')
on conflict (key) do nothing;

commit;
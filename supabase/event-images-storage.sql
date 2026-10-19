-- MELLOW Consortium — real photo upload for events.
-- Run this AFTER schema.sql, admin.sql, and events.sql.
--
-- Public bucket (unlike `documents`, which is private/patient-scoped) —
-- event cover images are shown on the public /conferences page, so
-- everyone needs read access. Only admins can write, same public.is_admin()
-- gate used everywhere else.

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "public read event-images" on storage.objects
  for select using (bucket_id = 'event-images');

create policy "admins can upload event-images" on storage.objects
  for insert with check (bucket_id = 'event-images' and public.is_admin());

create policy "admins can update event-images" on storage.objects
  for update using (bucket_id = 'event-images' and public.is_admin())
  with check (bucket_id = 'event-images' and public.is_admin());

create policy "admins can delete event-images" on storage.objects
  for delete using (bucket_id = 'event-images' and public.is_admin());

-- MELLOW Consortium — messages: unread tracking + real-time delivery.
-- Run any time after provider-dashboard.sql.

-- ============================================================
-- 1. read_at — null until the OTHER participant opens the thread.
-- "Has unread" for a connection = any message where sender_id <> me
-- and read_at is null.
-- ============================================================
alter table messages add column if not exists read_at timestamptz;

-- A participant can mark a message read, but only one they didn't send
-- themselves, and only on a connection they're actually part of — same
-- shape as the existing read/insert policies. RLS enforces the ROW is
-- allowed; the server action (markThreadRead) is what guarantees only
-- `read_at` ever gets set, same trust model the rest of this app already
-- uses for update policies (e.g. updateProviderDetails).
create policy "connection participants can mark messages read" on messages
  for update using (
    sender_id <> auth.uid()
    and exists (
      select 1 from patient_provider_connections c
      left join provider_profiles pp on pp.id = c.provider_id
      where c.id = messages.connection_id
        and c.status = 'ACTIVE'
        and (c.patient_id = auth.uid() or pp.provider_user_id = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from patient_provider_connections c
      left join provider_profiles pp on pp.id = c.provider_id
      where c.id = messages.connection_id
        and c.status = 'ACTIVE'
        and (c.patient_id = auth.uid() or pp.provider_user_id = auth.uid())
    )
  );

-- ============================================================
-- 2. Real-time delivery — postgres_changes subscriptions still go
-- through RLS, so the existing select policy is what actually gates who
-- receives a live INSERT event; this just turns the feed on for the
-- table.
-- ============================================================
alter publication supabase_realtime add table messages;

-- Realtime migration for notifications and orders.
-- Idempotent: safe to run multiple times.
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table orders;
alter table orders replica identity full;
alter table notifications replica identity full;
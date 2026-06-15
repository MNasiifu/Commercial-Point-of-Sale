-- ============================================================
-- Kids & Baby Store POS — Migration 011: Audit Log
-- Run after 010
-- Immutable append-only log — never update or delete rows here.
-- ============================================================

create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete set null,
  action      audit_action not null,
  table_name  text not null,
  record_id   uuid,
  old_values  jsonb,
  new_values  jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index idx_audit_user    on audit_logs(user_id);
create index idx_audit_action  on audit_logs(action);
create index idx_audit_table   on audit_logs(table_name, record_id);
create index idx_audit_created on audit_logs(created_at desc);

-- Prevent deletes and updates on audit_logs (immutable)
create or replace rule no_delete_audit as on delete to audit_logs do instead nothing;
create or replace rule no_update_audit as on update to audit_logs do instead nothing;

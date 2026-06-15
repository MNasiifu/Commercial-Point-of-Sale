-- ============================================================
-- Kids & Baby Store POS — Migration 008: Returns
-- Run after 007
-- A customer return restocks (or writes off) goods at the branch
-- where the return is processed.
-- ============================================================

create table returns (
  id            uuid primary key default uuid_generate_v4(),
  branch_id     uuid not null references branches(id) on delete restrict,
  return_number text not null unique,
  sale_id       uuid not null references sales(id) on delete restrict,
  customer_id   uuid references customers(id) on delete set null,
  processed_by  uuid not null references profiles(id) on delete restrict,  -- manager/admin
  approved_by   uuid references profiles(id) on delete set null,
  reason        text not null,
  return_type   return_type not null,            -- restock | writeoff
  status        return_status not null default 'pending',
  total_refund  numeric(14,2) not null default 0,
  refund_method payment_method,
  notes         text,
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table return_items (
  id                uuid primary key default uuid_generate_v4(),
  return_id         uuid not null references returns(id) on delete cascade,
  sale_item_id      uuid not null references sale_items(id) on delete restrict,
  product_id        uuid not null references products(id) on delete restrict,
  quantity_returned numeric(12,2) not null,
  refund_amount     numeric(14,2) not null,
  restocked         boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_returns_branch       on returns(branch_id);
create index idx_returns_sale         on returns(sale_id);
create index idx_returns_processed_by on returns(processed_by);
create index idx_returns_status       on returns(status);
create index idx_return_items_return  on return_items(return_id);
create index idx_return_items_product on return_items(product_id);

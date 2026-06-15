-- ============================================================
-- Kids & Baby Store POS — Migration 006: Customers & Delivery Orders
-- Run after 005
-- ============================================================

-- ─── Customers ───────────────────────────────────────────────
create table customers (
  id            uuid primary key default uuid_generate_v4(),
  full_name     text not null,
  phone         text,
  email         text,
  address       text,
  customer_type customer_type not null default 'walk_in',
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz  -- soft delete
);

-- ─── Delivery Orders (phone/WhatsApp orders) ─────────────────
create table delivery_orders (
  id               uuid primary key default uuid_generate_v4(),
  branch_id        uuid not null references branches(id) on delete restrict,
  order_number     text not null unique,
  customer_id      uuid references customers(id) on delete set null,
  customer_name    text,
  customer_phone   text,
  order_source     order_source not null default 'phone',
  status           delivery_status not null default 'pending',
  delivery_address text,
  delivery_notes   text,
  teller_id        uuid not null references profiles(id) on delete restrict,
  sale_id          uuid,                  -- FK added after sales table
  total_amount     numeric(14,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table delivery_order_items (
  id                uuid primary key default uuid_generate_v4(),
  delivery_order_id uuid not null references delivery_orders(id) on delete cascade,
  product_id        uuid not null references products(id) on delete restrict,
  quantity          numeric(12,2) not null,
  unit_price        numeric(12,2) not null,
  line_total        numeric(14,2) not null,
  created_at        timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_customers_name   on customers using gin(full_name gin_trgm_ops);
create index idx_customers_phone  on customers(phone);
create index idx_customers_active on customers(is_active) where deleted_at is null;
create index idx_delivery_branch  on delivery_orders(branch_id);
create index idx_delivery_teller  on delivery_orders(teller_id);
create index idx_delivery_status  on delivery_orders(status);
create index idx_delivery_items   on delivery_order_items(delivery_order_id);

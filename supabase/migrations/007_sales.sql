-- ============================================================
-- Kids & Baby Store POS — Migration 007: Sales
-- Run after 006
--
-- No VAT in this version. Pricing is flat (retail / wholesale).
-- Each sale belongs to exactly one branch; sale_number is namespaced
-- by the branch code so every shop has its own uniquely-identified
-- transaction sequence (e.g. INV-BRA-20260614-0001).
-- A sale carries the wholesale flag when any line was charged wholesale.
-- ============================================================

create table sales (
  id               uuid primary key default uuid_generate_v4(),
  branch_id        uuid not null references branches(id) on delete restrict,
  sale_number      text not null unique,
  customer_id      uuid references customers(id) on delete set null,
  teller_id        uuid not null references profiles(id) on delete restrict,
  sale_type        sale_type not null default 'walk_in',
  delivery_order_id uuid references delivery_orders(id) on delete set null,
  total_amount     numeric(14,2) not null default 0,
  has_wholesale    boolean not null default false,  -- true if any line used wholesale price
  payment_status   payment_status not null default 'pending',
  is_voided        boolean not null default false,
  voided_by        uuid references profiles(id) on delete set null,
  voided_at        timestamptz,
  void_reason      text,
  receipt_printed  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Link delivery_orders.sale_id back to sales
alter table delivery_orders
  add constraint fk_delivery_sale
  foreign key (sale_id) references sales(id) on delete set null;

-- ─── Sale Items ──────────────────────────────────────────────
-- quantity is counted in sellable packs (the "sold in" unit).
-- price_tier records whether retail or wholesale price was applied.
create table sale_items (
  id          uuid primary key default uuid_generate_v4(),
  sale_id     uuid not null references sales(id) on delete cascade,
  product_id  uuid not null references products(id) on delete restrict,
  quantity    numeric(12,2) not null,
  unit_price  numeric(12,2) not null,
  price_tier  price_tier not null default 'retail',
  line_total  numeric(14,2) not null,
  created_at  timestamptz not null default now()
);

-- ─── Payments (split payment supported) ──────────────────────
create table payments (
  id               uuid primary key default uuid_generate_v4(),
  sale_id          uuid not null references sales(id) on delete cascade,
  payment_method   payment_method not null,
  amount           numeric(14,2) not null,
  reference_number text,    -- mobile money transaction ref
  created_at       timestamptz not null default now()
);

-- ─── sales_day helper (immutable, for per-day indexing) ──────
create or replace function sales_day(ts timestamptz)
  returns date language sql immutable parallel safe as
  $$ select (ts at time zone 'Africa/Kampala')::date $$;

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_sales_branch       on sales(branch_id);
create index idx_sales_teller       on sales(teller_id);
create index idx_sales_created_at   on sales(created_at desc);
create index idx_sales_date         on sales(sales_day(created_at));
create index idx_sales_number       on sales(sale_number);
create index idx_sales_voided       on sales(is_voided);
create index idx_sale_items_sale    on sale_items(sale_id);
create index idx_sale_items_product on sale_items(product_id);
create index idx_payments_sale      on payments(sale_id);
create index idx_payments_method    on payments(payment_method);

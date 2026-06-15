-- ============================================================
-- Kids & Baby Store POS — Migration 005: Inventory
-- Run after 004
--
-- Simple on-hand model: one quantity per product per branch.
-- No expiry, no batches. Stock flows:
--   receive_stock      → main store only (external supply in)
--   stock_transfers    → main store → branch, or branch → main (returns)
--   sales              → deduct from the selling branch
--   adjustments        → damage/theft/correction/loss
-- ============================================================

-- ─── Stock Levels (on-hand per product per branch) ───────────
create table stock_levels (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  branch_id   uuid not null references branches(id) on delete restrict,
  quantity    numeric(12,2) not null default 0 check (quantity >= 0),
  updated_at  timestamptz not null default now(),
  constraint uq_stock_level unique (product_id, branch_id)
);

-- ─── Stock Receivings (external supply into the MAIN store) ───
create table stock_receivings (
  id          uuid primary key default uuid_generate_v4(),
  branch_id   uuid not null references branches(id) on delete restrict, -- must be the main store
  reference   text,            -- optional supplier invoice / delivery note ref (free text)
  received_by uuid not null references profiles(id) on delete restrict,
  received_at timestamptz not null default now(),
  notes       text,
  created_at  timestamptz not null default now()
);

create table stock_receiving_items (
  id                  uuid primary key default uuid_generate_v4(),
  receiving_id        uuid not null references stock_receivings(id) on delete cascade,
  product_id          uuid not null references products(id) on delete restrict,
  quantity            numeric(12,2) not null check (quantity > 0),
  cost_price_per_unit numeric(12,2) not null default 0,
  created_at          timestamptz not null default now()
);

-- ─── Stock Transfers (two-step: send + confirm) ──────────────
-- On SEND: stock is deducted from from_branch (now "in transit").
-- On RECEIVE: confirmed quantity is added to to_branch.
-- A return is simply a transfer from a branch back to the main store.
create table stock_transfers (
  id              uuid primary key default uuid_generate_v4(),
  transfer_number text not null unique,
  from_branch_id  uuid not null references branches(id) on delete restrict,
  to_branch_id    uuid not null references branches(id) on delete restrict,
  status          stock_transfer_status not null default 'draft',
  notes           text,
  sent_by         uuid references profiles(id) on delete set null,
  sent_at         timestamptz,
  received_by     uuid references profiles(id) on delete set null,
  received_at     timestamptz,
  created_by      uuid not null references profiles(id) on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_transfer_branches check (from_branch_id <> to_branch_id)
);

create table stock_transfer_items (
  id                uuid primary key default uuid_generate_v4(),
  transfer_id       uuid not null references stock_transfers(id) on delete cascade,
  product_id        uuid not null references products(id) on delete restrict,
  quantity_sent     numeric(12,2) not null check (quantity_sent > 0),
  quantity_received numeric(12,2),       -- null until confirmed; may differ (short/damaged)
  created_at        timestamptz not null default now()
);

-- ─── Stock Adjustments (audit trail for manual changes) ──────
create table stock_adjustments (
  id              uuid primary key default uuid_generate_v4(),
  branch_id       uuid not null references branches(id) on delete restrict,
  product_id      uuid not null references products(id) on delete restrict,
  adjustment_type adjustment_type not null,
  quantity        numeric(12,2) not null,    -- positive = add, negative = remove
  reason          text,
  adjusted_by     uuid not null references profiles(id) on delete restrict,
  created_at      timestamptz not null default now()
);

-- ─── Stock Takes (physical counts) ───────────────────────────
create table stock_takes (
  id           uuid primary key default uuid_generate_v4(),
  branch_id    uuid not null references branches(id) on delete restrict,
  status       stock_take_status not null default 'draft',
  notes        text,
  started_by   uuid not null references profiles(id) on delete restrict,
  completed_by uuid references profiles(id) on delete set null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table stock_take_items (
  id               uuid primary key default uuid_generate_v4(),
  stock_take_id    uuid not null references stock_takes(id) on delete cascade,
  product_id       uuid not null references products(id) on delete restrict,
  system_quantity  numeric(12,2) not null default 0,
  counted_quantity numeric(12,2),
  variance         numeric(12,2) generated always as (counted_quantity - system_quantity) stored,
  notes            text,
  created_at       timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_stock_levels_branch       on stock_levels(branch_id);
create index idx_stock_levels_product      on stock_levels(product_id);
create index idx_stock_levels_low          on stock_levels(branch_id) where quantity <= 5;
create index idx_receivings_branch         on stock_receivings(branch_id);
create index idx_receiving_items_receiving on stock_receiving_items(receiving_id);
create index idx_transfers_from            on stock_transfers(from_branch_id);
create index idx_transfers_to              on stock_transfers(to_branch_id);
create index idx_transfers_status          on stock_transfers(status);
create index idx_transfer_items_transfer   on stock_transfer_items(transfer_id);
create index idx_stock_adjustments_product on stock_adjustments(product_id);
create index idx_stock_adjustments_branch  on stock_adjustments(branch_id);
create index idx_stock_take_items_take     on stock_take_items(stock_take_id);

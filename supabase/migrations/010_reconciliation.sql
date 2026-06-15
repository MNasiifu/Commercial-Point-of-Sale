-- ============================================================
-- DAS POS — Migration 010: Daily Reconciliation
-- Run after 009
-- ============================================================

-- ─── Daily Reconciliations ───────────────────────────────────
create table daily_reconciliations (
  id                      uuid primary key default uuid_generate_v4(),
  branch_id               uuid not null references branches(id) on delete restrict,
  reconciliation_date     date not null default current_date,
  status                  reconciliation_status not null default 'open',

  -- Cash
  expected_cash           numeric(14,2) not null default 0,
  actual_cash             numeric(14,2) not null default 0,
  cash_variance           numeric(14,2) generated always as (actual_cash - expected_cash) stored,

  -- MTN MoMo
  expected_mtn_momo       numeric(14,2) not null default 0,
  actual_mtn_momo         numeric(14,2) not null default 0,
  mtn_momo_variance       numeric(14,2) generated always as (actual_mtn_momo - expected_mtn_momo) stored,

  -- Airtel Money
  expected_airtel_money   numeric(14,2) not null default 0,
  actual_airtel_money     numeric(14,2) not null default 0,
  airtel_variance         numeric(14,2) generated always as (actual_airtel_money - expected_airtel_money) stored,

  -- Total
  total_expected          numeric(14,2) generated always as
    (expected_cash + expected_mtn_momo + expected_airtel_money) stored,
  total_actual            numeric(14,2) generated always as
    (actual_cash + actual_mtn_momo + actual_airtel_money) stored,
  total_variance          numeric(14,2) generated always as
    ((actual_cash + actual_mtn_momo + actual_airtel_money) -
     (expected_cash + expected_mtn_momo + expected_airtel_money)) stored,

  -- Meta
  submitted_by            uuid references profiles(id) on delete set null,
  approved_by             uuid references profiles(id) on delete set null,
  submitted_at            timestamptz,
  approved_at             timestamptz,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint uq_reconciliation_date_branch unique (branch_id, reconciliation_date)
);

-- ─── Cash Denomination Breakdown ─────────────────────────────
-- Uganda UGX denominations: 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100
create table reconciliation_denominations (
  id                  uuid primary key default uuid_generate_v4(),
  reconciliation_id   uuid not null references daily_reconciliations(id) on delete cascade,
  denomination        integer not null,    -- e.g. 50000, 20000, 10000 ...
  count               integer not null default 0,
  total_amount        integer generated always as (denomination * count) stored,
  created_at          timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_reconciliation_branch on daily_reconciliations(branch_id);
create index idx_reconciliation_date   on daily_reconciliations(reconciliation_date desc);
create index idx_reconciliation_status on daily_reconciliations(status);
create index idx_denomination_recon    on reconciliation_denominations(reconciliation_id);

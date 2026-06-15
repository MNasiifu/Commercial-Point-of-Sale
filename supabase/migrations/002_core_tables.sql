-- ============================================================
-- Kids & Baby Store POS — Migration 002: Core Reference & Catalog Tables
-- Run after 001
-- ============================================================

-- ─── Branches / Shops ────────────────────────────────────────
-- The main store both SELLS and DISTRIBUTES stock to branches.
-- Exactly one branch should have is_main_store = true.
-- `code` is a short shop code used to namespace sale numbers (e.g. MAIN, BRA, BRB).
create table branches (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  code          text not null unique,
  is_main_store boolean not null default false,
  address       text,
  phone         text,
  email         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Only one main store allowed
create unique index uq_branches_single_main
  on branches((is_main_store)) where is_main_store = true;

-- ─── Countries (country of origin) ───────────────────────────
create table countries (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null unique,
  code      char(2) unique,  -- ISO 3166-1 alpha-2
  is_active boolean not null default true
);

-- ─── Categories (required on every product) ──────────────────
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Brands (catalog-managed dropdown) ───────────────────────
create table brands (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Colors (catalog-managed dropdown) ───────────────────────
create table colors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  hex_code    text,           -- optional swatch, e.g. "#FF8800"
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Garment Types (catalog-managed dropdown) ────────────────
-- e.g. Shirt, T-Shirt, Shorts, Trouser, Dress, Romper, Onesie …
create table garment_types (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Sizes (catalog-managed dropdown) ────────────────────────
-- sort_order keeps age/size ranges in a sensible order (0-3M before 3-6M …)
create table sizes (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_branches_main   on branches(is_main_store) where is_main_store = true;
create index idx_sizes_sort_order on sizes(sort_order);

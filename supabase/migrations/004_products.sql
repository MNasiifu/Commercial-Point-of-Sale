-- ============================================================
-- Kids & Baby Store POS — Migration 004: Products
-- Run after 003
--
-- Each product row is ONE size+color SKU of a garment style.
-- Pricing is flat on the product: cost / retail / wholesale.
-- Wholesale price is auto-applied at checkout when a line reaches
-- the wholesale threshold (see get_wholesale_threshold() in 013).
-- ============================================================

create table products (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,                                   -- style/product name
  category_id      uuid not null references categories(id) on delete restrict,
  brand_id         uuid references brands(id) on delete set null,
  garment_type_id  uuid references garment_types(id) on delete set null,
  size_id          uuid references sizes(id) on delete set null,
  color_id         uuid references colors(id) on delete set null,
  country_id       uuid references countries(id) on delete set null,  -- country of origin
  gender           gender,
  age_text         text,            -- free text, e.g. "3-6 months", "2-3 years"
  store_location   text,            -- where the item sits in the shop, e.g. "Rack B3"
  pack_size        integer not null default 1
                     check (pack_size >= 1),  -- "sold in": pieces per sellable pack (1 = single item)
  cost_price       numeric(12,2) not null default 0,
  retail_price     numeric(12,2) not null default 0,
  wholesale_price  numeric(12,2) not null default 0,
  description      text,
  image_url        text,
  is_active        boolean not null default true,
  created_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz      -- soft delete
);

-- ─── Product Barcodes ────────────────────────────────────────
-- A SKU can have a scanned barcode and/or a generated one.
create table product_barcodes (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid not null references products(id) on delete cascade,
  barcode      text not null unique,
  is_generated boolean not null default false,  -- true = we generated it
  created_at   timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_products_name          on products using gin(name gin_trgm_ops);
create index idx_products_category      on products(category_id);
create index idx_products_brand         on products(brand_id);
create index idx_products_garment_type  on products(garment_type_id);
create index idx_products_size          on products(size_id);
create index idx_products_color         on products(color_id);
create index idx_products_active        on products(is_active) where deleted_at is null;
create index idx_barcodes_barcode       on product_barcodes(barcode);
create index idx_barcodes_product       on product_barcodes(product_id);

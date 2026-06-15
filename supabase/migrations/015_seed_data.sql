-- ============================================================
-- Kids & Baby Store POS — Migration 015: Seed Data
-- Run after 014
-- Inserts: main store + branches, garment catalog, walk-in customer
-- ============================================================

-- ─── Branches (Main Store + 2 branches) ──────────────────────
insert into branches (id, name, code, is_main_store, address, phone, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'Main Store', 'MAIN', true,
   'Kampala, Uganda', '0700000000', true),
  ('00000000-0000-0000-0000-00000000000a', 'Branch A', 'BRA', false,
   'Kampala, Uganda', '0700000001', true),
  ('00000000-0000-0000-0000-00000000000b', 'Branch B', 'BRB', false,
   'Kampala, Uganda', '0700000002', true)
on conflict (id) do nothing;

-- ─── Product Categories (children's wear) ────────────────────
insert into categories (name, description) values
  ('Baby Wear',        'Clothing for babies (0–24 months)'),
  ('Toddler Wear',     'Clothing for toddlers (2–4 years)'),
  ('Kids Wear',        'Clothing for children (4–12 years)'),
  ('Newborn Essentials','Bodysuits, mittens, caps and newborn basics'),
  ('Beach & Swimwear', 'Swimsuits, beach shorts and sets'),
  ('Underwear & Socks','Vests, briefs, socks and tights'),
  ('Outerwear',        'Sweaters, jackets and hoodies'),
  ('Accessories',      'Hats, bibs, headbands and small accessories'),
  ('Shoes',            'Baby and children footwear')
on conflict (name) do nothing;

-- ─── Garment Types ───────────────────────────────────────────
insert into garment_types (name, description) values
  ('T-Shirt',  'Short-sleeve top'),
  ('Shirt',    'Buttoned shirt'),
  ('Shorts',   'Short trousers'),
  ('Trouser',  'Long trousers'),
  ('Dress',    'Girls dress'),
  ('Romper',   'One-piece baby romper'),
  ('Onesie',   'Baby bodysuit'),
  ('Sweater',  'Knitted top'),
  ('Jacket',   'Outer jacket'),
  ('Set',      'Multi-piece coordinated set (e.g. beach set)'),
  ('Socks',    'Pair of socks'),
  ('Hat',      'Cap or hat')
on conflict (name) do nothing;

-- ─── Sizes (age-based, ordered) ──────────────────────────────
insert into sizes (name, sort_order) values
  ('0-3M',   10),
  ('3-6M',   20),
  ('6-9M',   30),
  ('9-12M',  40),
  ('12-18M', 50),
  ('18-24M', 60),
  ('2-3Y',   70),
  ('3-4Y',   80),
  ('4-5Y',   90),
  ('5-6Y',   100),
  ('7-8Y',   110),
  ('9-10Y',  120),
  ('11-12Y', 130)
on conflict (name) do nothing;

-- ─── Colors ──────────────────────────────────────────────────
insert into colors (name, hex_code) values
  ('White',   '#FFFFFF'),
  ('Black',   '#000000'),
  ('Red',     '#E53935'),
  ('Blue',    '#1E88E5'),
  ('Navy',    '#1A237E'),
  ('Pink',    '#F06292'),
  ('Yellow',  '#FDD835'),
  ('Green',   '#43A047'),
  ('Grey',    '#9E9E9E'),
  ('Cream',   '#FFF8E1'),
  ('Orange',  '#FB8C00'),
  ('Purple',  '#8E24AA')
on conflict (name) do nothing;

-- ─── Sample Brands ───────────────────────────────────────────
insert into brands (name) values
  ('Generic'),
  ('Carter''s'),
  ('Mothercare'),
  ('Next'),
  ('H&M Kids'),
  ('Local Tailor')
on conflict (name) do nothing;

-- ─── Common Countries of Origin ──────────────────────────────
insert into countries (name, code) values
  ('Uganda',         'UG'),
  ('Kenya',          'KE'),
  ('Tanzania',       'TZ'),
  ('China',          'CN'),
  ('India',          'IN'),
  ('Turkey',         'TR'),
  ('Bangladesh',     'BD'),
  ('United Kingdom', 'GB'),
  ('United States',  'US'),
  ('South Africa',   'ZA'),
  ('United Arab Emirates', 'AE'),
  ('Vietnam',        'VN')
on conflict (code) do nothing;

-- ─── Walk-in Anonymous Customer ──────────────────────────────
insert into customers (id, full_name, customer_type, is_active)
values ('00000000-0000-0000-0000-000000000002', 'Walk-In Customer', 'walk_in', true)
on conflict (id) do nothing;

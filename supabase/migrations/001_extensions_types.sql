-- ============================================================
-- Kids & Baby Store POS — Migration 001: Extensions & Enum Types
-- Run this first in Supabase SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";   -- fuzzy product search

-- ─── Enum: User Roles ────────────────────────────────────────
create type user_role as enum ('admin', 'manager', 'teller');

-- ─── Enum: Gender (children's garments) ──────────────────────
create type gender as enum ('boy', 'girl', 'unisex', 'newborn');

-- ─── Enum: Pricing tier applied to a sale line ───────────────
-- 'retail'    = normal price
-- 'wholesale' = automatically applied when qty on a line reaches the threshold
create type price_tier as enum ('retail', 'wholesale');

-- ─── Enum: Stock Adjustment Types ────────────────────────────
create type adjustment_type as enum (
  'damage', 'theft', 'correction', 'transfer_loss', 'other'
);

-- ─── Enum: Stock Take Status ─────────────────────────────────
create type stock_take_status as enum ('draft', 'in_progress', 'completed', 'cancelled');

-- ─── Enum: Stock Transfer Status ─────────────────────────────
-- Two-step transfer: main store SENDs (stock leaves source, "in transit"),
-- destination branch RECEIVEs (stock lands). Returns are just transfers
-- whose source is a branch and destination is the main store.
create type stock_transfer_status as enum ('draft', 'sent', 'received', 'cancelled');

-- ─── Enum: Customer Type ─────────────────────────────────────
create type customer_type as enum ('walk_in', 'account', 'delivery');

-- ─── Enum: Order Source ──────────────────────────────────────
create type order_source as enum ('phone', 'whatsapp', 'walk_in', 'other');

-- ─── Enum: Delivery Status ───────────────────────────────────
create type delivery_status as enum (
  'pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'
);

-- ─── Enum: Sale Type ─────────────────────────────────────────
create type sale_type as enum ('walk_in', 'delivery', 'account');

-- ─── Enum: Payment Status ────────────────────────────────────
create type payment_status as enum ('paid', 'partial', 'pending');

-- ─── Enum: Payment Method ────────────────────────────────────
create type payment_method as enum ('cash', 'mtn_momo', 'airtel_money');

-- ─── Enum: Return Type ───────────────────────────────────────
create type return_type as enum ('restock', 'writeoff');

-- ─── Enum: Return Status ─────────────────────────────────────
create type return_status as enum ('pending', 'approved', 'completed', 'rejected');

-- ─── Enum: Reconciliation Status ─────────────────────────────
create type reconciliation_status as enum ('open', 'submitted', 'approved');

-- ─── Enum: Audit Action ──────────────────────────────────────
create type audit_action as enum (
  'create', 'update', 'delete', 'void_sale', 'process_return',
  'complete_sale', 'adjust_stock', 'receive_stock', 'send_transfer',
  'receive_transfer', 'create_user', 'change_role', 'delete_user',
  'close_reconciliation', 'complete_stock_take'
);

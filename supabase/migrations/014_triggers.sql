-- ============================================================
-- Kids & Baby Store POS — Migration 014: Triggers
-- Run after 013
-- ============================================================

-- ─── Generic updated_at trigger function ─────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_branches_updated_at       before update on branches            for each row execute function touch_updated_at();
create trigger trg_categories_updated_at     before update on categories          for each row execute function touch_updated_at();
create trigger trg_brands_updated_at         before update on brands              for each row execute function touch_updated_at();
create trigger trg_colors_updated_at         before update on colors              for each row execute function touch_updated_at();
create trigger trg_garment_types_updated_at  before update on garment_types       for each row execute function touch_updated_at();
create trigger trg_sizes_updated_at          before update on sizes               for each row execute function touch_updated_at();
create trigger trg_profiles_updated_at       before update on profiles            for each row execute function touch_updated_at();
create trigger trg_products_updated_at       before update on products            for each row execute function touch_updated_at();
create trigger trg_stock_levels_updated_at   before update on stock_levels        for each row execute function touch_updated_at();
create trigger trg_stock_transfers_updated_at before update on stock_transfers    for each row execute function touch_updated_at();
create trigger trg_stock_takes_updated_at    before update on stock_takes         for each row execute function touch_updated_at();
create trigger trg_customers_updated_at      before update on customers           for each row execute function touch_updated_at();
create trigger trg_delivery_orders_updated_at before update on delivery_orders    for each row execute function touch_updated_at();
create trigger trg_sales_updated_at          before update on sales               for each row execute function touch_updated_at();
create trigger trg_returns_updated_at        before update on returns             for each row execute function touch_updated_at();
create trigger trg_reconciliations_updated_at before update on daily_reconciliations for each row execute function touch_updated_at();

-- ─── Prevent un-voiding a sale ───────────────────────────────
create or replace function prevent_void_on_completed()
returns trigger language plpgsql as $$
begin
  if old.is_voided = true and new.is_voided = false then
    raise exception 'Cannot un-void a sale';
  end if;
  return new;
end;
$$;

create trigger trg_sales_no_unvoid
  before update of is_voided on sales
  for each row execute function prevent_void_on_completed();

-- ─── Generate delivery order number ──────────────────────────
create or replace function generate_delivery_order_number()
returns trigger language plpgsql as $$
declare
  v_date text;
  v_seq  integer;
begin
  if new.order_number is null or new.order_number = '' then
    v_date := to_char(current_date, 'YYYYMMDD');
    select coalesce(max((regexp_match(order_number, '\d+$'))[1]::integer), 0) + 1
    into v_seq
    from delivery_orders
    where order_number like 'DEL-' || v_date || '-%';
    new.order_number := 'DEL-' || v_date || '-' || lpad(v_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_delivery_order_number
  before insert on delivery_orders
  for each row execute function generate_delivery_order_number();

-- ════════════════════════════════════════════════════════════
-- 017  Goods Received report
--
-- Replaces the "Stock Valuation" screen's data source. The old
-- get_stock_valuation (013) is a point-in-time snapshot of
-- stock_levels and is kept for any future use, but the Stock
-- report page now shows GOODS RECEIVED instead: one row per
-- supplier-received line item, dated by stock_receivings.received_at.
--
-- Why: a goods-received log answers "what came in, when, and what
-- did it cost us" — which is what the operator actually wants here.
-- Crucially it is sourced ONLY from stock_receivings /
-- stock_receiving_items, which are written exclusively by the
-- receive_stock RPC (013/016). Inter-branch transfers never touch
-- these tables, so transferred stock can NOT inflate the cost
-- total — those movements live in their own Transfers report.
--
-- Filters by received_at over an inclusive [p_date_from, p_date_to]
-- day range; null bounds mean "no lower / no upper bound".
-- Deleted products are intentionally still shown so historical
-- receipts remain complete (audit accuracy).
-- ════════════════════════════════════════════════════════════
create or replace function get_goods_received(
  p_date_from date default null,
  p_date_to   date default null
)
returns table (
  id            uuid,
  received_at   timestamptz,
  reference     text,
  product_name  text,
  category_name text,
  branch_name   text,
  received_by   text,
  quantity      numeric,
  cost_price    numeric,
  cost_value    numeric
)
language plpgsql
security definer stable
as $$
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can run the goods received report';
  end if;

  return query
  select
    sri.id,
    sr.received_at,
    sr.reference::text,
    p.name::text,
    cat.name::text,
    br.name::text,
    prof.full_name::text,
    sri.quantity,
    sri.cost_price_per_unit,
    round(sri.quantity * sri.cost_price_per_unit, 2)
  from stock_receiving_items sri
  join stock_receivings sr on sr.id = sri.receiving_id
  join products p          on p.id  = sri.product_id
  join branches br         on br.id = sr.branch_id
  left join categories cat on cat.id = p.category_id
  left join profiles prof  on prof.id = sr.received_by
  where (p_date_from is null or sr.received_at >= p_date_from::timestamptz)
    and (p_date_to   is null or sr.received_at <  ((p_date_to + 1)::date)::timestamptz)
  order by sr.received_at desc, p.name;
end; $$;

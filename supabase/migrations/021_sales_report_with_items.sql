-- ════════════════════════════════════════════════════════════
-- 021  Sales report — embed per-transaction line items
--
-- The Sales report page now lets admins expand a transaction row to
-- see the products it contained. Rather than a second round-trip per
-- expanded row, we embed the line items directly in get_sales_report
-- as a jsonb array (`items`). The same array feeds the Excel/PDF
-- exports, which need every transaction's products in one payload.
--
-- Each item carries: product_name, quantity, unit_price, price_tier
-- and amount (the stored line_total). Items are ordered by product
-- name for stable display. A sale with no items returns '[]'.
--
-- Adding the `items` return column changes the function's result
-- signature, so the previous 6-arg version (018) is dropped first —
-- create-or-replace cannot alter the OUT columns of an existing
-- function and would otherwise error.
--
-- NOTE: the category filter still scopes which SALES appear (a sale is
-- included if any of its items is in the category). The embedded
-- `items` array always lists the FULL transaction, not just the
-- matching category — admins expect to see the whole receipt.
-- ════════════════════════════════════════════════════════════

drop function if exists get_sales_report(text, text, uuid, uuid, text, uuid);

create or replace function get_sales_report(
  p_date_from   text,
  p_date_to     text,
  p_branch_id   uuid default null,
  p_teller_id   uuid default null,
  p_sale_type   text default null,
  p_category_id uuid default null
)
returns table (
  sale_number     text,
  sale_date       timestamptz,
  branch_name     text,
  teller_name     text,
  customer_name   text,
  sale_type       text,
  items_count     bigint,
  has_wholesale   boolean,
  total_amount    numeric,
  payment_methods text,
  is_voided       boolean,
  items           jsonb
)
language plpgsql
security definer stable
as $$
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can run the sales report';
  end if;

  return query
  select
    s.sale_number::text,
    s.created_at,
    br.name::text,
    pr.full_name::text,
    coalesce(cu.full_name, 'Walk-In')::text,
    s.sale_type::text,
    (select count(*) from sale_items si where si.sale_id = s.id),
    s.has_wholesale,
    s.total_amount,
    (select string_agg(distinct pay.payment_method::text, ', ') from payments pay where pay.sale_id = s.id)::text,
    s.is_voided,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'product_name', prod.name,
          'quantity',     si.quantity,
          'unit_price',   si.unit_price,
          'price_tier',   si.price_tier,
          'amount',       si.line_total
        )
        order by prod.name
      )
      from sale_items si
      join products prod on prod.id = si.product_id
      where si.sale_id = s.id
    ), '[]'::jsonb)
  from sales s
  join branches br on br.id = s.branch_id
  join profiles pr on pr.id = s.teller_id
  left join customers cu on cu.id = s.customer_id
  where sales_day(s.created_at) between p_date_from::date and p_date_to::date
    and (p_branch_id is null or s.branch_id = p_branch_id)
    and (p_teller_id is null or s.teller_id = p_teller_id)
    and (p_sale_type is null or s.sale_type::text = p_sale_type)
    and (
      p_category_id is null
      or exists (
        select 1
        from sale_items si
        join products prod on prod.id = si.product_id
        where si.sale_id = s.id
          and prod.category_id = p_category_id
      )
    )
  order by s.created_at desc;
end; $$;

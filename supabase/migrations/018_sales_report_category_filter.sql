-- ════════════════════════════════════════════════════════════
-- 018  Sales report — category filter
--
-- Adds an optional p_category_id argument to get_sales_report so
-- the Sales report page can scope transactions to a single product
-- category. A sale can span MULTIPLE categories (categories live on
-- products, reached via sale_items), so this is an "includes any
-- item in this category" filter — implemented with EXISTS, not a
-- join, to avoid duplicating sale rows. p_category_id = null keeps
-- the original "all categories" behaviour.
--
-- The added argument changes the function's signature, so the old
-- 5-arg version (013) is dropped explicitly first — create or replace
-- alone would leave it behind as a separate overload and make calls
-- ambiguous.
-- ════════════════════════════════════════════════════════════

drop function if exists get_sales_report(text, text, uuid, uuid, text);

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
  is_voided       boolean
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
    s.is_voided
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

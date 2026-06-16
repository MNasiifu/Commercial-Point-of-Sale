-- ════════════════════════════════════════════════════════════
-- 020  Product list / search RPC
--
-- Moves the product list query (filters + free-text search) out of
-- the client and into the database. Previously productService.getAll
-- fetched all matching rows via PostgREST and then filtered the search
-- term in JS (name / store_location / barcode). This RPC does the whole
-- thing server-side and additionally searches category / brand /
-- garment-type names.
--
-- Returns one JSONB row per product, shaped EXACTLY like the
-- ProductWithDetails type the frontend already consumes (nested
-- categories/brands/garment_types/sizes/colors/countries objects +
-- a product_barcodes array), so no frontend type changes are needed.
--
-- Text matching is case-insensitive substring (ILIKE '%q%'), matching
-- the old JS .includes() behaviour. The gin_trgm index on products.name
-- (migration 004) accelerates the name match.
--
-- Access mirrors the products_select RLS policy: any authenticated user
-- may list non-deleted products (POS + tellers rely on this). Soft-deleted
-- rows (deleted_at not null) are never returned.
--
-- showInactive is three-state to preserve existing call sites exactly:
--   false → active products only   (ProductPicker)
--   true  → active + inactive
--   null  → active + inactive      (ProductTable default)
-- ════════════════════════════════════════════════════════════

create or replace function search_products(
  p_search          text    default null,
  p_category_id     uuid    default null,
  p_brand_id        uuid    default null,
  p_garment_type_id uuid    default null,
  p_size_id         uuid    default null,
  p_color_id        uuid    default null,
  p_gender          text    default null,
  p_show_inactive   boolean default null
)
returns setof jsonb
language plpgsql
security definer stable
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    to_jsonb(p)
    || jsonb_build_object(
         'categories',    case when c.id  is not null
                            then jsonb_build_object('id', c.id,  'name', c.name) end,
         'brands',        case when b.id  is not null
                            then jsonb_build_object('id', b.id,  'name', b.name) end,
         'garment_types', case when gt.id is not null
                            then jsonb_build_object('id', gt.id, 'name', gt.name) end,
         'sizes',         case when sz.id is not null
                            then jsonb_build_object('id', sz.id, 'name', sz.name) end,
         'colors',        case when cl.id is not null
                            then jsonb_build_object('id', cl.id, 'name', cl.name,
                                                    'hex_code', cl.hex_code) end,
         'countries',     case when co.id is not null
                            then jsonb_build_object('id', co.id, 'name', co.name,
                                                    'code', co.code) end,
         'product_barcodes', coalesce(
           (select jsonb_agg(
                     jsonb_build_object('id', bc.id, 'barcode', bc.barcode,
                                        'is_generated', bc.is_generated)
                     order by bc.created_at)
              from product_barcodes bc
             where bc.product_id = p.id),
           '[]'::jsonb)
       )
  from products p
  left join categories    c  on c.id  = p.category_id
  left join brands        b  on b.id  = p.brand_id
  left join garment_types gt on gt.id = p.garment_type_id
  left join sizes         sz on sz.id = p.size_id
  left join colors        cl on cl.id = p.color_id
  left join countries     co on co.id = p.country_id
  where p.deleted_at is null
    and (p_show_inactive is distinct from false or p.is_active = true)
    and (p_category_id     is null or p.category_id     = p_category_id)
    and (p_brand_id        is null or p.brand_id        = p_brand_id)
    and (p_garment_type_id is null or p.garment_type_id = p_garment_type_id)
    and (p_size_id         is null or p.size_id         = p_size_id)
    and (p_color_id        is null or p.color_id        = p_color_id)
    and (p_gender          is null or p.gender::text    = p_gender)
    and (
      p_search is null or btrim(p_search) = ''
      or p.name           ilike '%' || p_search || '%'
      or p.store_location ilike '%' || p_search || '%'
      or c.name           ilike '%' || p_search || '%'
      or b.name           ilike '%' || p_search || '%'
      or gt.name          ilike '%' || p_search || '%'
      or exists (
           select 1 from product_barcodes bc
           where bc.product_id = p.id
             and bc.barcode ilike '%' || p_search || '%'
         )
    )
  order by p.name;
end;
$$;

grant execute on function
  search_products(text, uuid, uuid, uuid, uuid, uuid, text, boolean)
  to authenticated;

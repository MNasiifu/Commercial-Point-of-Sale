-- ============================================================
-- Kids & Baby Store POS — Migration 013: RPC Functions
-- Run after 012
--
-- Business rules encoded here:
--   • No VAT. Flat pricing: retail / wholesale.
--   • Wholesale price auto-applies to a whole line when its quantity
--     reaches get_wholesale_threshold() sellable units (packs).
--   • Stock is one quantity per product per branch (stock_levels).
--   • Main store receives external stock; transfers move it to branches
--     in two steps (send → confirm). Returns are branch→main transfers.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 0. CONFIGURABLE CONSTANTS
-- ════════════════════════════════════════════════════════════

-- A customer qualifies for wholesale on a line once they buy this many
-- sellable units (packs) of the same product. Change here to retune.
create or replace function get_wholesale_threshold()
returns integer language sql immutable as $$ select 6 $$;

-- Stock at or below this count is flagged "low stock" on the dashboard.
create or replace function get_low_stock_threshold()
returns integer language sql immutable as $$ select 5 $$;

-- ════════════════════════════════════════════════════════════
-- 1. NUMBER GENERATORS (per-shop sale numbering)
-- ════════════════════════════════════════════════════════════
create or replace function generate_sale_number(p_branch_id uuid)
returns text language plpgsql as $$
declare v_code text; v_date text; v_seq int;
begin
  select code into v_code from branches where id = p_branch_id;
  v_code := coalesce(v_code, 'XXX');
  v_date := to_char(current_date, 'YYYYMMDD');
  select coalesce(max((regexp_match(sale_number, '\d+$'))[1]::int), 0) + 1
    into v_seq
  from sales
  where sale_number like 'INV-' || v_code || '-' || v_date || '-%';
  return 'INV-' || v_code || '-' || v_date || '-' || lpad(v_seq::text, 4, '0');
end; $$;

create or replace function generate_return_number(p_branch_id uuid)
returns text language plpgsql as $$
declare v_code text; v_date text; v_seq int;
begin
  select code into v_code from branches where id = p_branch_id;
  v_code := coalesce(v_code, 'XXX');
  v_date := to_char(current_date, 'YYYYMMDD');
  select coalesce(max((regexp_match(return_number, '\d+$'))[1]::int), 0) + 1
    into v_seq
  from returns
  where return_number like 'RET-' || v_code || '-' || v_date || '-%';
  return 'RET-' || v_code || '-' || v_date || '-' || lpad(v_seq::text, 4, '0');
end; $$;

create or replace function generate_transfer_number()
returns text language plpgsql as $$
declare v_date text; v_seq int;
begin
  v_date := to_char(current_date, 'YYYYMMDD');
  select coalesce(max((regexp_match(transfer_number, '\d+$'))[1]::int), 0) + 1
    into v_seq
  from stock_transfers
  where transfer_number like 'TRF-' || v_date || '-%';
  return 'TRF-' || v_date || '-' || lpad(v_seq::text, 4, '0');
end; $$;

-- ════════════════════════════════════════════════════════════
-- 2. STOCK HELPER — upsert + lock a (product, branch) on-hand row
-- ════════════════════════════════════════════════════════════
create or replace function adjust_stock_level(p_product uuid, p_branch uuid, p_delta numeric)
returns numeric
language plpgsql
security definer
as $$
declare v_qty numeric;
begin
  insert into stock_levels (product_id, branch_id, quantity)
  values (p_product, p_branch, 0)
  on conflict (product_id, branch_id) do nothing;

  select quantity into v_qty
  from stock_levels
  where product_id = p_product and branch_id = p_branch
  for update;

  v_qty := v_qty + p_delta;
  if v_qty < 0 then
    raise exception 'Insufficient stock for product % at this branch (short by %)',
      p_product, abs(v_qty);
  end if;

  update stock_levels
  set quantity = v_qty, updated_at = now()
  where product_id = p_product and branch_id = p_branch;

  return v_qty;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 3. COMPLETE SALE (auto retail/wholesale tiering, stock deduction)
-- p_data: { branch_id, customer_id, sale_type, delivery_order_id,
--           items:[{product_id, quantity}],
--           payments:[{payment_method, amount, reference_number}] }
-- ════════════════════════════════════════════════════════════
create or replace function complete_sale(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_branch_id   uuid := coalesce((p_data->>'branch_id')::uuid, get_user_branch_id());
  v_teller_id   uuid := auth.uid();
  v_threshold   int  := get_wholesale_threshold();
  v_sale_id     uuid;
  v_sale_number text;
  v_total       numeric := 0;
  v_has_ws      boolean := false;
  v_paid        numeric := 0;
  v_pay_status  payment_status;
  v_item        jsonb;
  v_pay         jsonb;
  v_prod        products%rowtype;
  v_qty         numeric;
  v_tier        price_tier;
  v_unit_price  numeric;
  v_line_total  numeric;
begin
  if v_branch_id is null then
    raise exception 'No branch specified for this sale';
  end if;

  v_sale_number := generate_sale_number(v_branch_id);

  insert into sales (branch_id, sale_number, customer_id, teller_id, sale_type,
                     delivery_order_id, total_amount, payment_status)
  values (v_branch_id, v_sale_number,
          (p_data->>'customer_id')::uuid, v_teller_id,
          coalesce((p_data->>'sale_type')::sale_type, 'walk_in'),
          (p_data->>'delivery_order_id')::uuid, 0, 'pending')
  returning id into v_sale_id;

  -- Line items: price tier resolved server-side
  for v_item in select * from jsonb_array_elements(p_data->'items')
  loop
    select * into v_prod from products
    where id = (v_item->>'product_id')::uuid and deleted_at is null;
    if not found then
      raise exception 'Product % not found', v_item->>'product_id';
    end if;

    v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for product %', v_prod.name;
    end if;

    if v_qty >= v_threshold then
      v_tier := 'wholesale';
      v_unit_price := v_prod.wholesale_price;
      v_has_ws := true;
    else
      v_tier := 'retail';
      v_unit_price := v_prod.retail_price;
    end if;

    v_line_total := round(v_unit_price * v_qty, 2);
    v_total := v_total + v_line_total;

    insert into sale_items (sale_id, product_id, quantity, unit_price, price_tier, line_total)
    values (v_sale_id, v_prod.id, v_qty, v_unit_price, v_tier, v_line_total);

    -- Deduct from the selling branch's on-hand
    perform adjust_stock_level(v_prod.id, v_branch_id, -v_qty);
  end loop;

  -- Payments
  for v_pay in select * from jsonb_array_elements(coalesce(p_data->'payments', '[]'::jsonb))
  loop
    insert into payments (sale_id, payment_method, amount, reference_number)
    values (v_sale_id, (v_pay->>'payment_method')::payment_method,
            (v_pay->>'amount')::numeric, v_pay->>'reference_number');
    v_paid := v_paid + (v_pay->>'amount')::numeric;
  end loop;

  v_pay_status := case
    when v_paid >= v_total then 'paid'
    when v_paid > 0        then 'partial'
    else 'pending' end;

  update sales
  set total_amount = v_total, has_wholesale = v_has_ws, payment_status = v_pay_status
  where id = v_sale_id;

  -- Link delivery order if any
  if (p_data->>'delivery_order_id') is not null then
    update delivery_orders
    set sale_id = v_sale_id, status = 'delivered'
    where id = (p_data->>'delivery_order_id')::uuid;
  end if;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (v_teller_id, 'complete_sale', 'sales', v_sale_id,
          jsonb_build_object('sale_number', v_sale_number, 'total', v_total,
                             'has_wholesale', v_has_ws));

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'sale_number', v_sale_number,
    'total_amount', v_total,
    'has_wholesale', v_has_ws,
    'payment_status', v_pay_status
  );
end; $$;

-- ════════════════════════════════════════════════════════════
-- 4. VOID SALE (restores stock to the sale's branch)
-- ════════════════════════════════════════════════════════════
create or replace function void_sale(p_sale_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
as $$
declare v_sale sales%rowtype; v_it sale_items%rowtype;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can void a sale';
  end if;

  select * into v_sale from sales where id = p_sale_id;
  if not found then raise exception 'Sale not found'; end if;
  if v_sale.is_voided then raise exception 'Sale already voided'; end if;

  for v_it in select * from sale_items where sale_id = p_sale_id loop
    perform adjust_stock_level(v_it.product_id, v_sale.branch_id, v_it.quantity);
  end loop;

  update sales
  set is_voided = true, voided_by = auth.uid(), voided_at = now(),
      void_reason = p_reason, payment_status = 'pending'
  where id = p_sale_id;

  insert into audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  values (auth.uid(), 'void_sale', 'sales', p_sale_id,
          jsonb_build_object('sale_number', v_sale.sale_number),
          jsonb_build_object('reason', p_reason));

  return jsonb_build_object('sale_id', p_sale_id, 'voided', true);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 5. PROCESS RETURN (restock or write-off at a branch)
-- p_data: { branch_id, sale_id, customer_id, reason, return_type,
--           refund_method, notes,
--           items:[{sale_item_id, product_id, quantity_returned, refund_amount}] }
-- ════════════════════════════════════════════════════════════
create or replace function process_return(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sale       sales%rowtype;
  v_branch_id  uuid;
  v_return_id  uuid;
  v_ret_number text;
  v_total      numeric := 0;
  v_type       return_type := (p_data->>'return_type')::return_type;
  v_item       jsonb;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can process a return';
  end if;

  select * into v_sale from sales where id = (p_data->>'sale_id')::uuid;
  if not found then raise exception 'Original sale not found'; end if;

  v_branch_id := coalesce((p_data->>'branch_id')::uuid, v_sale.branch_id);
  v_ret_number := generate_return_number(v_branch_id);

  insert into returns (branch_id, return_number, sale_id, customer_id, processed_by,
                       approved_by, reason, return_type, status, refund_method, notes,
                       approved_at)
  values (v_branch_id, v_ret_number, v_sale.id, (p_data->>'customer_id')::uuid,
          auth.uid(), auth.uid(), p_data->>'reason', v_type, 'completed',
          (p_data->>'refund_method')::payment_method, p_data->>'notes', now())
  returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(p_data->'items')
  loop
    insert into return_items (return_id, sale_item_id, product_id, quantity_returned,
                              refund_amount, restocked)
    values (v_return_id, (v_item->>'sale_item_id')::uuid, (v_item->>'product_id')::uuid,
            (v_item->>'quantity_returned')::numeric, (v_item->>'refund_amount')::numeric,
            v_type = 'restock');

    v_total := v_total + (v_item->>'refund_amount')::numeric;

    if v_type = 'restock' then
      perform adjust_stock_level((v_item->>'product_id')::uuid, v_branch_id,
                                 (v_item->>'quantity_returned')::numeric);
    end if;
  end loop;

  update returns set total_refund = v_total where id = v_return_id;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'process_return', 'returns', v_return_id,
          jsonb_build_object('return_number', v_ret_number, 'total_refund', v_total,
                             'type', v_type));

  return jsonb_build_object('return_id', v_return_id, 'return_number', v_ret_number,
                            'total_refund', v_total);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 6. RECEIVE STOCK (external supply → MAIN STORE only)
-- p_data: { branch_id, reference, notes, received_date,
--           items:[{product_id, quantity, cost_price_per_unit}] }
--   received_date: optional ISO date the delivery arrived; defaults to now()
-- ════════════════════════════════════════════════════════════
create or replace function receive_stock(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_branch_id    uuid := coalesce((p_data->>'branch_id')::uuid, get_user_branch_id());
  v_received_at  timestamptz := coalesce((p_data->>'received_date')::date::timestamptz, now());
  v_receiving_id uuid;
  v_item         jsonb;
  v_count        int := 0;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can receive stock';
  end if;
  if not is_main_store(v_branch_id) then
    raise exception 'Stock can only be received into the main store';
  end if;

  insert into stock_receivings (branch_id, reference, received_by, notes, received_at)
  values (v_branch_id, p_data->>'reference', auth.uid(), p_data->>'notes', v_received_at)
  returning id into v_receiving_id;

  for v_item in select * from jsonb_array_elements(p_data->'items')
  loop
    insert into stock_receiving_items (receiving_id, product_id, quantity, cost_price_per_unit)
    values (v_receiving_id, (v_item->>'product_id')::uuid,
            (v_item->>'quantity')::numeric,
            coalesce((v_item->>'cost_price_per_unit')::numeric, 0));

    perform adjust_stock_level((v_item->>'product_id')::uuid, v_branch_id,
                               (v_item->>'quantity')::numeric);

    -- Keep product cost in step with the latest landed cost (for valuation)
    if coalesce((v_item->>'cost_price_per_unit')::numeric, 0) > 0 then
      update products set cost_price = (v_item->>'cost_price_per_unit')::numeric
      where id = (v_item->>'product_id')::uuid;
    end if;
    v_count := v_count + 1;
  end loop;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'receive_stock', 'stock_receivings', v_receiving_id,
          jsonb_build_object('items', v_count, 'received_at', v_received_at));

  return jsonb_build_object('receiving_id', v_receiving_id, 'items', v_count);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 7. CREATE & SEND STOCK TRANSFER (deducts source immediately)
-- p_data: { from_branch_id, to_branch_id, notes, items:[{product_id, quantity}] }
-- ════════════════════════════════════════════════════════════
create or replace function create_stock_transfer(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_from   uuid := coalesce((p_data->>'from_branch_id')::uuid, get_user_branch_id());
  v_to     uuid := (p_data->>'to_branch_id')::uuid;
  v_id     uuid;
  v_number text;
  v_item   jsonb;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can transfer stock';
  end if;
  if v_to is null then raise exception 'Destination branch is required'; end if;
  if v_from = v_to then raise exception 'Source and destination must differ'; end if;

  v_number := generate_transfer_number();

  insert into stock_transfers (transfer_number, from_branch_id, to_branch_id, status,
                               notes, sent_by, sent_at, created_by)
  values (v_number, v_from, v_to, 'sent', p_data->>'notes', auth.uid(), now(), auth.uid())
  returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_data->'items')
  loop
    insert into stock_transfer_items (transfer_id, product_id, quantity_sent)
    values (v_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::numeric);

    -- Stock leaves the source now and is "in transit" until confirmed
    perform adjust_stock_level((v_item->>'product_id')::uuid, v_from,
                               -(v_item->>'quantity')::numeric);
  end loop;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'send_transfer', 'stock_transfers', v_id,
          jsonb_build_object('transfer_number', v_number, 'to', v_to));

  return jsonb_build_object('transfer_id', v_id, 'transfer_number', v_number);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 8. CONFIRM (RECEIVE) STOCK TRANSFER — destination branch accepts
-- p_data: { transfer_id, notes, items:[{item_id, quantity_received}] }
--   items optional; missing quantity_received defaults to quantity_sent.
-- ════════════════════════════════════════════════════════════
create or replace function confirm_stock_transfer(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_transfer stock_transfers%rowtype;
  v_ti       stock_transfer_items%rowtype;
  v_override jsonb := coalesce(p_data->'items', '[]'::jsonb);
  v_recv     numeric;
  v_short    numeric := 0;
begin
  select * into v_transfer from stock_transfers where id = (p_data->>'transfer_id')::uuid;
  if not found then raise exception 'Transfer not found'; end if;
  if v_transfer.status <> 'sent' then
    raise exception 'Only sent transfers can be confirmed (status: %)', v_transfer.status;
  end if;
  if not (is_admin() or v_transfer.to_branch_id = get_user_branch_id()) then
    raise exception 'Only the destination branch can confirm this transfer';
  end if;

  for v_ti in select * from stock_transfer_items where transfer_id = v_transfer.id
  loop
    -- Per-line received override, else accept everything that was sent
    select (e->>'quantity_received')::numeric into v_recv
    from jsonb_array_elements(v_override) e
    where (e->>'item_id')::uuid = v_ti.id;
    v_recv := coalesce(v_recv, v_ti.quantity_sent);
    if v_recv < 0 then v_recv := 0; end if;
    if v_recv > v_ti.quantity_sent then v_recv := v_ti.quantity_sent; end if;

    update stock_transfer_items set quantity_received = v_recv where id = v_ti.id;
    perform adjust_stock_level(v_ti.product_id, v_transfer.to_branch_id, v_recv);
    v_short := v_short + (v_ti.quantity_sent - v_recv);
  end loop;

  update stock_transfers
  set status = 'received', received_by = auth.uid(), received_at = now(),
      notes = coalesce(p_data->>'notes', notes)
  where id = v_transfer.id;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'receive_transfer', 'stock_transfers', v_transfer.id,
          jsonb_build_object('transfer_number', v_transfer.transfer_number,
                             'shortfall', v_short));

  return jsonb_build_object('transfer_id', v_transfer.id, 'status', 'received',
                            'shortfall', v_short);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 9. CANCEL STOCK TRANSFER (restores source stock if still in transit)
-- ════════════════════════════════════════════════════════════
create or replace function cancel_stock_transfer(p_transfer_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare v_transfer stock_transfers%rowtype; v_ti stock_transfer_items%rowtype;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can cancel a transfer';
  end if;
  select * into v_transfer from stock_transfers where id = p_transfer_id;
  if not found then raise exception 'Transfer not found'; end if;
  if v_transfer.status <> 'sent' then
    raise exception 'Only an in-transit (sent) transfer can be cancelled';
  end if;

  for v_ti in select * from stock_transfer_items where transfer_id = p_transfer_id loop
    perform adjust_stock_level(v_ti.product_id, v_transfer.from_branch_id, v_ti.quantity_sent);
  end loop;

  update stock_transfers set status = 'cancelled' where id = p_transfer_id;
  return jsonb_build_object('transfer_id', p_transfer_id, 'status', 'cancelled');
end; $$;

-- ════════════════════════════════════════════════════════════
-- 10. APPLY STOCK ADJUSTMENT
-- p_data: { branch_id, product_id, adjustment_type, quantity (±), reason }
-- ════════════════════════════════════════════════════════════
create or replace function apply_stock_adjustment(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_branch_id uuid := coalesce((p_data->>'branch_id')::uuid, get_user_branch_id());
  v_adj_id    uuid;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can adjust stock';
  end if;

  perform adjust_stock_level((p_data->>'product_id')::uuid, v_branch_id,
                             (p_data->>'quantity')::numeric);

  insert into stock_adjustments (branch_id, product_id, adjustment_type, quantity, reason, adjusted_by)
  values (v_branch_id, (p_data->>'product_id')::uuid,
          (p_data->>'adjustment_type')::adjustment_type,
          (p_data->>'quantity')::numeric, p_data->>'reason', auth.uid())
  returning id into v_adj_id;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'adjust_stock', 'stock_adjustments', v_adj_id, p_data);

  return jsonb_build_object('adjustment_id', v_adj_id);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 11. COMPLETE STOCK TAKE (reconcile counted vs system)
-- ════════════════════════════════════════════════════════════
create or replace function complete_stock_take(p_stock_take_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare v_take stock_takes%rowtype; v_it stock_take_items%rowtype; v_count int := 0;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can complete a stock take';
  end if;
  select * into v_take from stock_takes where id = p_stock_take_id;
  if not found then raise exception 'Stock take not found'; end if;

  for v_it in
    select * from stock_take_items
    where stock_take_id = p_stock_take_id
      and counted_quantity is not null
      and counted_quantity <> system_quantity
  loop
    perform adjust_stock_level(v_it.product_id, v_take.branch_id, v_it.variance);
    insert into stock_adjustments (branch_id, product_id, adjustment_type, quantity, reason, adjusted_by)
    values (v_take.branch_id, v_it.product_id, 'correction', v_it.variance,
            'Stock take ' || p_stock_take_id, auth.uid());
    v_count := v_count + 1;
  end loop;

  update stock_takes
  set status = 'completed', completed_by = auth.uid(), completed_at = now()
  where id = p_stock_take_id;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'complete_stock_take', 'stock_takes', p_stock_take_id,
          jsonb_build_object('adjustments', v_count));

  return jsonb_build_object('stock_take_id', p_stock_take_id, 'adjustments', v_count);
end; $$;

-- ════════════════════════════════════════════════════════════
-- 12. USER MANAGEMENT (called by Edge Functions — signatures preserved)
-- ════════════════════════════════════════════════════════════
create or replace function admin_setup_new_user(
  p_user_id   uuid,
  p_full_name text,
  p_email     text,
  p_role      user_role,
  p_branch_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data ||
    jsonb_build_object('role', p_role, 'branch_id', p_branch_id)
  where id = p_user_id;

  insert into profiles (id, email, full_name, role, branch_id, must_change_password, created_by)
  values (p_user_id, p_email, p_full_name, p_role, p_branch_id, true, auth.uid())
  on conflict (id) do update
  set full_name            = excluded.full_name,
      role                 = excluded.role,
      branch_id            = excluded.branch_id,
      must_change_password = true,
      created_by           = excluded.created_by,
      updated_at           = now();

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'create_user', 'profiles', p_user_id,
          jsonb_build_object('email', p_email, 'role', p_role));
end; $$;

create or replace function admin_soft_delete_user(p_user_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_profile profiles%rowtype;
begin
  if not is_admin() then raise exception 'Forbidden: admin access required'; end if;
  if p_user_id = auth.uid() then raise exception 'You cannot remove your own account'; end if;

  select * into v_profile from profiles where id = p_user_id and deleted_at is null;
  if not found then raise exception 'User not found or already removed'; end if;
  if lower(trim(v_profile.email)) <> lower(trim(p_email)) then
    raise exception 'Email does not match this account';
  end if;

  update profiles set deleted_at = now(), is_active = false, updated_at = now()
  where id = p_user_id;

  insert into audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  values (auth.uid(), 'delete_user', 'profiles', p_user_id,
          jsonb_build_object('email', v_profile.email, 'role', v_profile.role),
          jsonb_build_object('deleted_at', now(), 'is_active', false));
end; $$;

-- ════════════════════════════════════════════════════════════
-- 13. PRODUCT SEARCH (POS search bar) — returns retail & wholesale
-- ════════════════════════════════════════════════════════════
create or replace function search_products(p_query text, p_branch_id uuid default null)
returns table (
  product_id          uuid,
  product_name        text,
  brand_name          text,
  garment_type_name   text,
  size_name           text,
  color_name          text,
  barcode             text,
  pack_size           integer,
  retail_price        numeric,
  wholesale_price     numeric,
  wholesale_threshold integer,
  stock_available     numeric
)
language plpgsql
security definer stable
as $$
declare v_branch_id uuid := coalesce(p_branch_id, get_user_branch_id());
begin
  return query
  select
    p.id,
    p.name::text,
    b.name::text,
    gt.name::text,
    sz.name::text,
    c.name::text,
    (select pb.barcode from product_barcodes pb where pb.product_id = p.id limit 1)::text,
    p.pack_size,
    p.retail_price,
    p.wholesale_price,
    get_wholesale_threshold(),
    coalesce((select sl.quantity from stock_levels sl
              where sl.product_id = p.id and sl.branch_id = v_branch_id), 0)::numeric
  from products p
  left join brands b        on b.id = p.brand_id
  left join garment_types gt on gt.id = p.garment_type_id
  left join sizes sz        on sz.id = p.size_id
  left join colors c        on c.id = p.color_id
  where p.is_active = true and p.deleted_at is null
    and (
      p.name ilike '%' || p_query || '%'
      or exists (select 1 from product_barcodes pb where pb.product_id = p.id and pb.barcode = p_query)
      or p.name % p_query
    )
  order by
    case when exists (select 1 from product_barcodes pb where pb.product_id = p.id and pb.barcode = p_query) then 0 else 1 end,
    similarity(p.name, p_query) desc
  limit 30;
end; $$;

create or replace function get_product_by_barcode(p_barcode text, p_branch_id uuid default null)
returns jsonb
language plpgsql
security definer stable
as $$
declare v_branch_id uuid := coalesce(p_branch_id, get_user_branch_id()); v_result jsonb;
begin
  select jsonb_build_object(
    'product_id', p.id,
    'name', p.name,
    'brand', b.name,
    'garment_type', gt.name,
    'size', sz.name,
    'color', c.name,
    'pack_size', p.pack_size,
    'retail_price', p.retail_price,
    'wholesale_price', p.wholesale_price,
    'wholesale_threshold', get_wholesale_threshold(),
    'stock', coalesce((select sl.quantity from stock_levels sl
                       where sl.product_id = p.id and sl.branch_id = v_branch_id), 0)
  )
  into v_result
  from product_barcodes pb
  join products p on p.id = pb.product_id
  left join brands b        on b.id = p.brand_id
  left join garment_types gt on gt.id = p.garment_type_id
  left join sizes sz        on sz.id = p.size_id
  left join colors c        on c.id = p.color_id
  where pb.barcode = p_barcode and p.is_active = true and p.deleted_at is null;

  return v_result;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 14. DASHBOARD KPIs (branch-scoped; admin may pass null for all)
-- ════════════════════════════════════════════════════════════
create or replace function get_dashboard_kpis(p_branch_id uuid default null)
returns jsonb
language plpgsql
security definer stable
as $$
declare
  v_branch_id uuid;
  v_result    jsonb;
begin
  -- admin with null → all branches; others → their own branch
  v_branch_id := case when is_admin() then p_branch_id else get_user_branch_id() end;

  select jsonb_build_object(
    'today_revenue', coalesce((
      select sum(total_amount) from sales s
      where sales_day(s.created_at) = current_date and s.is_voided = false
        and (v_branch_id is null or s.branch_id = v_branch_id)), 0),
    'today_transactions', coalesce((
      select count(*) from sales s
      where sales_day(s.created_at) = current_date and s.is_voided = false
        and (v_branch_id is null or s.branch_id = v_branch_id)), 0),
    'today_wholesale_sales', coalesce((
      select count(*) from sales s
      where sales_day(s.created_at) = current_date and s.is_voided = false and s.has_wholesale
        and (v_branch_id is null or s.branch_id = v_branch_id)), 0),
    'low_stock_count', coalesce((
      select count(*) from stock_levels sl
      where sl.quantity > 0 and sl.quantity <= get_low_stock_threshold()
        and (v_branch_id is null or sl.branch_id = v_branch_id)), 0),
    'out_of_stock_count', coalesce((
      select count(*) from stock_levels sl
      where sl.quantity = 0
        and (v_branch_id is null or sl.branch_id = v_branch_id)), 0),
    'pending_transfers', coalesce((
      select count(*) from stock_transfers t
      where t.status = 'sent'
        and (v_branch_id is null or t.to_branch_id = v_branch_id)), 0),
    'top_products_today', coalesce((
      select jsonb_agg(x) from (
        select p.name, sum(si.quantity) as qty, sum(si.line_total) as revenue
        from sale_items si
        join sales s on s.id = si.sale_id
        join products p on p.id = si.product_id
        where sales_day(s.created_at) = current_date and s.is_voided = false
          and (v_branch_id is null or s.branch_id = v_branch_id)
        group by p.name order by qty desc limit 5
      ) x), '[]'::jsonb),
    'payment_breakdown_today', coalesce((
      select jsonb_object_agg(method, amt) from (
        select pay.payment_method::text as method, sum(pay.amount) as amt
        from payments pay
        join sales s on s.id = pay.sale_id
        where sales_day(s.created_at) = current_date and s.is_voided = false
          and (v_branch_id is null or s.branch_id = v_branch_id)
        group by pay.payment_method
      ) y), '{}'::jsonb),
    'branch_sales_today', coalesce((
      select jsonb_agg(z) from (
        select br.name, br.code, coalesce(sum(s.total_amount), 0) as revenue,
               count(s.id) filter (where s.is_voided = false) as transactions
        from branches br
        left join sales s on s.branch_id = br.id
          and sales_day(s.created_at) = current_date and s.is_voided = false
        where (v_branch_id is null or br.id = v_branch_id)
        group by br.name, br.code order by revenue desc
      ) z), '[]'::jsonb)
  ) into v_result;

  return v_result;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 15. TELLER SUMMARY
-- ════════════════════════════════════════════════════════════
create or replace function get_teller_summary(
  p_teller_id uuid,
  p_date_from text,
  p_date_to   text,
  p_branch_id uuid default null
)
returns jsonb
language plpgsql
security definer stable
as $$
declare v_result jsonb;
begin
  if not (is_admin_or_manager() or p_teller_id = auth.uid()) then
    raise exception 'You can only view your own summary';
  end if;

  select jsonb_build_object(
    'transaction_count', count(*) filter (where not is_voided),
    'total_sales', coalesce(sum(total_amount) filter (where not is_voided), 0),
    'voided_count', count(*) filter (where is_voided),
    'wholesale_count', count(*) filter (where not is_voided and has_wholesale),
    'cash_total', coalesce((select sum(pay.amount) from payments pay join sales s2 on s2.id = pay.sale_id
        where s2.teller_id = p_teller_id and not s2.is_voided and pay.payment_method = 'cash'
        and sales_day(s2.created_at) between p_date_from::date and p_date_to::date), 0),
    'mtn_momo_total', coalesce((select sum(pay.amount) from payments pay join sales s2 on s2.id = pay.sale_id
        where s2.teller_id = p_teller_id and not s2.is_voided and pay.payment_method = 'mtn_momo'
        and sales_day(s2.created_at) between p_date_from::date and p_date_to::date), 0),
    'airtel_money_total', coalesce((select sum(pay.amount) from payments pay join sales s2 on s2.id = pay.sale_id
        where s2.teller_id = p_teller_id and not s2.is_voided and pay.payment_method = 'airtel_money'
        and sales_day(s2.created_at) between p_date_from::date and p_date_to::date), 0)
  ) into v_result
  from sales s
  where s.teller_id = p_teller_id
    and sales_day(s.created_at) between p_date_from::date and p_date_to::date
    and (p_branch_id is null or s.branch_id = p_branch_id);

  return v_result;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 16. SALES REPORT
-- ════════════════════════════════════════════════════════════
create or replace function get_sales_report(
  p_date_from text,
  p_date_to   text,
  p_branch_id uuid default null,
  p_teller_id uuid default null,
  p_sale_type text default null
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
  order by s.created_at desc;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 17. STOCK VALUATION (cost & retail value per branch)
-- ════════════════════════════════════════════════════════════
create or replace function get_stock_valuation(p_branch_id uuid default null)
returns table (
  product_name      text,
  category_name     text,
  branch_name       text,
  quantity          numeric,
  cost_price        numeric,
  retail_price      numeric,
  stock_cost_value  numeric,
  stock_retail_value numeric
)
language plpgsql
security definer stable
as $$
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can run the stock report';
  end if;

  return query
  select
    p.name::text,
    cat.name::text,
    br.name::text,
    sl.quantity,
    p.cost_price,
    p.retail_price,
    round(sl.quantity * p.cost_price, 2),
    round(sl.quantity * p.retail_price, 2)
  from stock_levels sl
  join products p on p.id = sl.product_id and p.deleted_at is null
  join branches br on br.id = sl.branch_id
  left join categories cat on cat.id = p.category_id
  where (p_branch_id is null or sl.branch_id = p_branch_id)
    and sl.quantity > 0
  order by br.name, p.name;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 18. STOCK TRANSFER REPORT
-- ════════════════════════════════════════════════════════════
create or replace function get_transfer_report(
  p_date_from text,
  p_date_to   text,
  p_branch_id uuid default null
)
returns table (
  transfer_number text,
  from_branch     text,
  to_branch       text,
  status          text,
  items_count     bigint,
  total_sent      numeric,
  total_received  numeric,
  created_at      timestamptz,
  received_at     timestamptz
)
language plpgsql
security definer stable
as $$
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can run the transfer report';
  end if;

  return query
  select
    t.transfer_number::text,
    fb.name::text,
    tb.name::text,
    t.status::text,
    (select count(*) from stock_transfer_items ti where ti.transfer_id = t.id),
    coalesce((select sum(ti.quantity_sent) from stock_transfer_items ti where ti.transfer_id = t.id), 0),
    coalesce((select sum(ti.quantity_received) from stock_transfer_items ti where ti.transfer_id = t.id), 0),
    t.created_at,
    t.received_at
  from stock_transfers t
  join branches fb on fb.id = t.from_branch_id
  join branches tb on tb.id = t.to_branch_id
  where t.created_at::date between p_date_from::date and p_date_to::date
    and (p_branch_id is null or t.from_branch_id = p_branch_id or t.to_branch_id = p_branch_id)
  order by t.created_at desc;
end; $$;

-- ════════════════════════════════════════════════════════════
-- 19. RECONCILIATION (preview + close)
-- ════════════════════════════════════════════════════════════
create or replace function get_reconciliation_preview(p_date text, p_branch_id uuid default null)
returns jsonb
language plpgsql
security definer stable
as $$
declare
  v_branch_id uuid := coalesce(p_branch_id, get_user_branch_id());
  v_result    jsonb;
  v_existing  daily_reconciliations%rowtype;
begin
  select * into v_existing from daily_reconciliations
  where branch_id = v_branch_id and reconciliation_date = p_date::date;

  select jsonb_build_object(
    'branch_id', v_branch_id,
    'date', p_date,
    'expected_cash', coalesce(sum(amt) filter (where method = 'cash'), 0),
    'expected_mtn_momo', coalesce(sum(amt) filter (where method = 'mtn_momo'), 0),
    'expected_airtel_money', coalesce(sum(amt) filter (where method = 'airtel_money'), 0),
    'total_expected', coalesce(sum(amt), 0),
    'transaction_count', coalesce((
      select count(*) from sales s where s.branch_id = v_branch_id
      and sales_day(s.created_at) = p_date::date and not s.is_voided), 0),
    'existing_id', v_existing.id,
    'existing_status', v_existing.status,
    'existing_notes', v_existing.notes
  ) into v_result
  from (
    select pay.payment_method as method, pay.amount as amt
    from payments pay
    join sales s on s.id = pay.sale_id
    where s.branch_id = v_branch_id and sales_day(s.created_at) = p_date::date and not s.is_voided
  ) t;

  return v_result;
end; $$;

create or replace function close_reconciliation(p_data jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_branch_id uuid := coalesce((p_data->>'branch_id')::uuid, get_user_branch_id());
  v_date      date := (p_data->>'reconciliation_date')::date;
  v_id        uuid;
  v_status    reconciliation_status;
  v_denom     jsonb;
begin
  if not is_admin_or_manager() then
    raise exception 'Only a manager or admin can close a reconciliation';
  end if;

  select id, status into v_id, v_status from daily_reconciliations
  where branch_id = v_branch_id and reconciliation_date = v_date;

  if v_status = 'approved' then
    raise exception 'This reconciliation is approved and cannot be changed';
  end if;

  -- Recompute expected from sales
  insert into daily_reconciliations (branch_id, reconciliation_date, status,
      expected_cash, expected_mtn_momo, expected_airtel_money,
      actual_cash, actual_mtn_momo, actual_airtel_money, submitted_by, submitted_at, notes)
  select v_branch_id, v_date, 'submitted',
      coalesce(sum(amt) filter (where method = 'cash'), 0),
      coalesce(sum(amt) filter (where method = 'mtn_momo'), 0),
      coalesce(sum(amt) filter (where method = 'airtel_money'), 0),
      coalesce((p_data->>'actual_cash')::numeric, 0),
      coalesce((p_data->>'actual_mtn_momo')::numeric, 0),
      coalesce((p_data->>'actual_airtel_money')::numeric, 0),
      auth.uid(), now(), p_data->>'notes'
  from (
    select pay.payment_method as method, pay.amount as amt
    from payments pay join sales s on s.id = pay.sale_id
    where s.branch_id = v_branch_id and sales_day(s.created_at) = v_date and not s.is_voided
  ) t
  on conflict (branch_id, reconciliation_date) do update
  set expected_cash         = excluded.expected_cash,
      expected_mtn_momo     = excluded.expected_mtn_momo,
      expected_airtel_money = excluded.expected_airtel_money,
      actual_cash           = excluded.actual_cash,
      actual_mtn_momo       = excluded.actual_mtn_momo,
      actual_airtel_money   = excluded.actual_airtel_money,
      status                = 'submitted',
      submitted_by          = auth.uid(),
      submitted_at          = now(),
      notes                 = excluded.notes
  returning id into v_id;

  -- Replace denomination breakdown
  delete from reconciliation_denominations where reconciliation_id = v_id;
  for v_denom in select * from jsonb_array_elements(coalesce(p_data->'denominations', '[]'::jsonb))
  loop
    insert into reconciliation_denominations (reconciliation_id, denomination, count)
    values (v_id, (v_denom->>'denomination')::int, (v_denom->>'count')::int);
  end loop;

  insert into audit_logs (user_id, action, table_name, record_id, new_values)
  values (auth.uid(), 'close_reconciliation', 'daily_reconciliations', v_id, p_data);

  return jsonb_build_object('reconciliation_id', v_id, 'status', 'submitted');
end; $$;

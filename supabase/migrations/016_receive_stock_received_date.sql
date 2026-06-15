-- ════════════════════════════════════════════════════════════
-- 016  Allow the user to set the date stock was received
--
-- The stock_receivings.received_at column already exists
-- (timestamptz, default now()). Until now the receive_stock RPC
-- never let callers set it, so every receiving was stamped with
-- the moment it was entered. This lets the main-store operator
-- record the actual date the delivery arrived (e.g. backdating a
-- delivery note entered the next day).
--
-- p_data now optionally carries `received_date` (an ISO date
-- string, e.g. "2026-06-15"). When present it is stored as the
-- start of that day; when absent we fall back to now() so older
-- callers keep working unchanged.
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

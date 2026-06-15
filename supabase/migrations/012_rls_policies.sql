-- ============================================================
-- Kids & Baby Store POS — Migration 012: Row-Level Security
-- Run after 011
--
-- Scoping model:
--   admin   → sees & manages every branch
--   manager → manages their own branch
--   teller  → operates their own branch; sees only their own sales
-- Most writes happen through SECURITY DEFINER RPCs (013); these
-- policies govern direct reads and any direct table writes.
-- ============================================================

-- Enable RLS everywhere
alter table branches               enable row level security;
alter table countries              enable row level security;
alter table categories             enable row level security;
alter table brands                 enable row level security;
alter table colors                 enable row level security;
alter table garment_types          enable row level security;
alter table sizes                  enable row level security;
alter table profiles               enable row level security;
alter table products               enable row level security;
alter table product_barcodes       enable row level security;
alter table stock_levels           enable row level security;
alter table stock_receivings       enable row level security;
alter table stock_receiving_items  enable row level security;
alter table stock_transfers        enable row level security;
alter table stock_transfer_items   enable row level security;
alter table stock_adjustments      enable row level security;
alter table stock_takes            enable row level security;
alter table stock_take_items       enable row level security;
alter table customers              enable row level security;
alter table delivery_orders        enable row level security;
alter table delivery_order_items   enable row level security;
alter table sales                  enable row level security;
alter table sale_items             enable row level security;
alter table payments               enable row level security;
alter table returns                enable row level security;
alter table return_items           enable row level security;
alter table daily_reconciliations  enable row level security;
alter table reconciliation_denominations enable row level security;
alter table audit_logs             enable row level security;

-- ════════════════════════════════════════════════════════════
-- BRANCHES — everyone reads, admin manages
-- ════════════════════════════════════════════════════════════
create policy branches_select on branches for select to authenticated using (true);
create policy branches_admin  on branches for all    to authenticated using (is_admin()) with check (is_admin());

-- ════════════════════════════════════════════════════════════
-- CATALOG / REFERENCE LISTS — read all, manager+ writes, admin deletes
-- ════════════════════════════════════════════════════════════
do $$
declare t text;
begin
  foreach t in array array['countries','categories','brands','colors','garment_types','sizes']
  loop
    execute format('create policy %1$s_select on %1$s for select to authenticated using (true);', t);
    execute format('create policy %1$s_insert on %1$s for insert to authenticated with check (is_admin_or_manager());', t);
    execute format('create policy %1$s_update on %1$s for update to authenticated using (is_admin_or_manager()) with check (is_admin_or_manager());', t);
    execute format('create policy %1$s_delete on %1$s for delete to authenticated using (is_admin());', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or is_admin());
create policy profiles_insert on profiles for insert to authenticated
  with check (is_admin());
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy profiles_delete on profiles for delete to authenticated
  using (is_admin());

-- ════════════════════════════════════════════════════════════
-- PRODUCTS & BARCODES
-- ════════════════════════════════════════════════════════════
create policy products_select on products for select to authenticated
  using (deleted_at is null or is_admin_or_manager());
create policy products_insert on products for insert to authenticated
  with check (is_admin_or_manager());
create policy products_update on products for update to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy products_delete on products for delete to authenticated
  using (is_admin());

create policy barcodes_select on product_barcodes for select to authenticated using (true);
create policy barcodes_write  on product_barcodes for all    to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- STOCK LEVELS — read own branch (admin all); writes manager+
-- ════════════════════════════════════════════════════════════
create policy stock_levels_select on stock_levels for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy stock_levels_write on stock_levels for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- STOCK RECEIVINGS (main store only, manager+)
-- ════════════════════════════════════════════════════════════
create policy receivings_select on stock_receivings for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy receivings_write on stock_receivings for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy receiving_items_select on stock_receiving_items for select to authenticated
  using (exists (select 1 from stock_receivings r where r.id = receiving_id
                 and (is_admin() or r.branch_id = get_user_branch_id())));
create policy receiving_items_write on stock_receiving_items for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- STOCK TRANSFERS — visible to source & destination branches
-- ════════════════════════════════════════════════════════════
create policy transfers_select on stock_transfers for select to authenticated
  using (is_admin() or from_branch_id = get_user_branch_id() or to_branch_id = get_user_branch_id());
create policy transfers_write on stock_transfers for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy transfer_items_select on stock_transfer_items for select to authenticated
  using (exists (select 1 from stock_transfers t where t.id = transfer_id
                 and (is_admin() or t.from_branch_id = get_user_branch_id()
                      or t.to_branch_id = get_user_branch_id())));
create policy transfer_items_write on stock_transfer_items for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- STOCK ADJUSTMENTS / TAKES — own branch (admin all), manager+ writes
-- ════════════════════════════════════════════════════════════
create policy adjustments_select on stock_adjustments for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy adjustments_write on stock_adjustments for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

create policy stock_takes_select on stock_takes for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy stock_takes_write on stock_takes for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy stock_take_items_select on stock_take_items for select to authenticated
  using (exists (select 1 from stock_takes s where s.id = stock_take_id
                 and (is_admin() or s.branch_id = get_user_branch_id())));
create policy stock_take_items_write on stock_take_items for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- CUSTOMERS — all staff read/write, manager+ deletes
-- ════════════════════════════════════════════════════════════
create policy customers_select on customers for select to authenticated
  using (deleted_at is null or is_admin_or_manager());
create policy customers_insert on customers for insert to authenticated with check (true);
create policy customers_update on customers for update to authenticated using (true) with check (true);
create policy customers_delete on customers for delete to authenticated using (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- DELIVERY ORDERS — own branch
-- ════════════════════════════════════════════════════════════
create policy delivery_select on delivery_orders for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy delivery_write on delivery_orders for all to authenticated
  using (is_admin() or branch_id = get_user_branch_id())
  with check (is_admin() or branch_id = get_user_branch_id());
create policy delivery_items_select on delivery_order_items for select to authenticated
  using (exists (select 1 from delivery_orders d where d.id = delivery_order_id
                 and (is_admin() or d.branch_id = get_user_branch_id())));
create policy delivery_items_write on delivery_order_items for all to authenticated
  using (true) with check (true);

-- ════════════════════════════════════════════════════════════
-- SALES — admin all; manager own branch; teller own sales
-- ════════════════════════════════════════════════════════════
create policy sales_select on sales for select to authenticated
  using (
    is_admin()
    or (get_user_role() = 'manager' and branch_id = get_user_branch_id())
    or teller_id = auth.uid()
  );
create policy sales_insert on sales for insert to authenticated
  with check (is_admin() or branch_id = get_user_branch_id());
create policy sales_update on sales for update to authenticated
  using (is_admin() or (is_admin_or_manager() and branch_id = get_user_branch_id()))
  with check (is_admin() or branch_id = get_user_branch_id());

-- sale_items & payments inherit visibility from their sale
create policy sale_items_select on sale_items for select to authenticated
  using (exists (select 1 from sales s where s.id = sale_id
                 and (is_admin()
                      or (get_user_role() = 'manager' and s.branch_id = get_user_branch_id())
                      or s.teller_id = auth.uid())));
create policy sale_items_insert on sale_items for insert to authenticated with check (true);

create policy payments_select on payments for select to authenticated
  using (exists (select 1 from sales s where s.id = sale_id
                 and (is_admin()
                      or (get_user_role() = 'manager' and s.branch_id = get_user_branch_id())
                      or s.teller_id = auth.uid())));
create policy payments_insert on payments for insert to authenticated with check (true);

-- ════════════════════════════════════════════════════════════
-- RETURNS — own branch, manager+ only
-- ════════════════════════════════════════════════════════════
create policy returns_select on returns for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy returns_write on returns for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy return_items_select on return_items for select to authenticated
  using (exists (select 1 from returns r where r.id = return_id
                 and (is_admin() or r.branch_id = get_user_branch_id())));
create policy return_items_write on return_items for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- RECONCILIATION — own branch, manager+
-- ════════════════════════════════════════════════════════════
create policy recon_select on daily_reconciliations for select to authenticated
  using (is_admin() or branch_id = get_user_branch_id());
create policy recon_write on daily_reconciliations for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());
create policy denom_select on reconciliation_denominations for select to authenticated
  using (exists (select 1 from daily_reconciliations d where d.id = reconciliation_id
                 and (is_admin() or d.branch_id = get_user_branch_id())));
create policy denom_write on reconciliation_denominations for all to authenticated
  using (is_admin_or_manager()) with check (is_admin_or_manager());

-- ════════════════════════════════════════════════════════════
-- AUDIT LOG — admin reads; any authenticated may append
-- ════════════════════════════════════════════════════════════
create policy audit_select on audit_logs for select to authenticated using (is_admin());
create policy audit_insert on audit_logs for insert to authenticated with check (true);

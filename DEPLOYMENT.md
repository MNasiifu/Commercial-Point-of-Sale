# DAS POS — Deployment Guide

TIN: **10756690689** | Stack: Vite + React 19 + Supabase + MUI v6

---

## 1. Supabase project setup

### 1.1 Create project
1. Go to [supabase.com](https://supabase.com) → New project.
2. Note down: **Project URL**, **anon key**, **service role key**.
3. Set region closest to Kampala (e.g., `eu-west-2` or `af-south-1`).

### 1.2 Run migrations **in order**
Open **SQL Editor** in the Supabase dashboard and run each file in sequence:

| Order | File | Description |
|-------|------|-------------|
| 1  | `supabase/migrations/001_extensions_types.sql`     | UUID extension, custom enums |
| 2  | `supabase/migrations/002_core_tables.sql`           | Branches, organisations |
| 3  | `supabase/migrations/003_profiles.sql`              | User profiles, roles |
| 4  | `supabase/migrations/004_products.sql`              | Products, categories, units |
| 5  | `supabase/migrations/005_inventory.sql`             | Stock batches, adjustments |
| 6  | `supabase/migrations/006_customers_deliveries.sql`  | Customers, delivery orders |
| 7  | `supabase/migrations/007_sales.sql`                 | Sales, sale items, payments |
| 8  | `supabase/migrations/008_returns.sql`               | Returns, return items |
| 9  | `supabase/migrations/009_vat.sql`                   | VAT helpers |
| 10 | `supabase/migrations/010_reconciliation.sql`        | Daily reconciliation tables |
| 11 | `supabase/migrations/011_efris_audit.sql`           | EFRIS submissions, audit log |
| 12 | `supabase/migrations/012_rls_policies.sql`          | Row Level Security policies |
| 13 | `supabase/migrations/013_rpc_functions.sql`         | Core RPCs (complete_sale, etc.) |
| 14 | `supabase/migrations/014_triggers.sql`              | Auto-timestamps, numbering triggers |
| 15 | `supabase/migrations/015_seed_data.sql`             | Denominations, default branch |
| 16 | `supabase/migrations/016_fix_search_products_unit_id.sql` | Search RPC patch |
| 17 | `supabase/migrations/phase6_returns_and_void.sql`   | void_sale, process_return RPCs |
| 18 | `supabase/migrations/phase7_dashboard_rpcs.sql`     | Dashboard KPI RPCs |
| 19 | `supabase/migrations/phase8_report_rpcs.sql`        | Report RPCs (sales, stock, VAT…) |
| 20 | `supabase/migrations/phase9_reconciliation_rpcs.sql`| Reconciliation RPCs |
| 21 | `supabase/migrations/phase10_efris_rpcs.sql`        | EFRIS result recording RPC |

> **Tip:** If a migration fails, fix the error and re-run only that file. All migrations are idempotent where possible (`CREATE OR REPLACE`).

### 1.3 Enable email auth
Dashboard → Authentication → Providers → Email → **enable**.  
Turn off **email confirmation** for internal staff accounts (they log in with temp passwords you issue).

### 1.4 Create the first admin user
```sql
-- Run in SQL Editor after migrations are complete
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES (
  gen_random_uuid(),
  'admin@inframedik.ug',
  crypt('CHANGE_ME_STRONG_PASSWORD', gen_salt('bf')),
  now(),
  'authenticated'
);
-- Then insert the profile
INSERT INTO profiles (id, full_name, role, branch_id, must_change_password)
SELECT id, 'System Admin', 'admin',
  (SELECT id FROM branches LIMIT 1),
  true
FROM auth.users WHERE email = 'admin@inframedik.ug';
```
The user will be forced to change their password on first login.

---

## 2. Environment variables

Create `.env.local` (never commit this file):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

For production deployments (Vercel / Netlify), set these as environment variables in the hosting dashboard.

---

## 3. Deploy the frontend

### Option A — Vercel (recommended)
1. Push the repo to GitHub.
2. Import project in [vercel.com](https://vercel.com).
3. Framework preset: **Vite**.
4. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
5. Deploy. Vercel auto-handles the SPA fallback (`index.html` for all routes).

### Option B — Netlify
1. Build command: `yarn build`
2. Publish directory: `dist`
3. Add a `_redirects` file in `public/`:
   ```
   /*  /index.html  200
   ```
4. Add env vars in Netlify dashboard.

### Option C — Self-hosted (Nginx)
```nginx
server {
    listen 80;
    root /var/www/inframedik-pos/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```
Upload `dist/` after running `yarn build`. Add HTTPS via Let's Encrypt (`certbot`).

---

## 4. EFRIS (URA Uganda) setup

### 4.1 Register a device with URA
1. Log in to the URA EFRIS portal.
2. Register a new POS device → obtain **Device Serial Number** and **Device Secret**.
3. Note the sandbox vs production API URL.

### 4.2 Deploy the Edge Function
1. Supabase dashboard → Edge Functions → **New function** → name it `efris-submit`.
2. Paste the contents of `supabase/functions/efris-submit/index.ts`.
3. Deploy.

### 4.3 Set Edge Function secrets
Dashboard → Settings → Edge Functions → Add secrets:

| Secret | Value |
|--------|-------|
| `EFRIS_API_URL`      | `https://efristest.ura.go.ug/efrisws/ws/taMapping` (sandbox) |
| `EFRIS_DEVICE_NO`    | Device serial from URA |
| `EFRIS_DEVICE_SECRET`| Device secret from URA |
| `EFRIS_TIN`          | `10756690689` |

Switch `EFRIS_API_URL` to the production URL once sandbox testing passes.

---

## 5. QZ Tray (80mm thermal printer)

QZ Tray bridges the browser to the USB thermal printer.

1. Download and install **QZ Tray** from [qz.io](https://qz.io/download/) on the POS machine.
2. Start QZ Tray — it runs as a system tray service on port 8182.
3. In the POS app, the receipt dialog uses `receiptToHtml()` to print via the browser's `window.print()`. For direct USB printing via QZ Tray, integrate the `qz-tray` npm package:
   ```bash
   yarn add qz-tray
   ```
   Then call `qz.print(config, data)` where `data` is the HTML receipt string or ESC/POS commands.
4. Configure your printer name in the POS settings page (Phase 1 — Settings).

---

## 6. PWA icons

Before going to production, generate PNG icons from the SVG:

```bash
# Using Inkscape (CLI)
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-512.png

# Or use any online SVG→PNG converter
```

The `icon-512.png` is also used as the maskable icon — ensure the medical cross has sufficient padding (safe zone = inner 80% of the canvas).

---

## 7. Post-deployment checklist

- [ ] All 21 SQL migrations run without errors
- [ ] First admin user created and can log in
- [ ] Admin forced to change password on first login
- [ ] At least one branch exists in the `branches` table
- [ ] Products seeded (or imported) — product search works on POS
- [ ] Thermal printer connected, QZ Tray running, test receipt prints
- [ ] EFRIS Edge Function deployed with secrets — test sale submits to sandbox
- [ ] PWA icons (`icon-192.png`, `icon-512.png`) present in `public/icons/`
- [ ] App installable on Android Chrome (A2HS prompt appears)
- [ ] Offline banner appears when network is disconnected
- [ ] Lighthouse audit: PWA score ≥ 90, Accessibility ≥ 90

---

## 8. Roles and permissions summary

| Role    | POS | Customers | Deliveries | Returns | Reports | Reconciliation | Users/Settings |
|---------|-----|-----------|------------|---------|---------|----------------|----------------|
| Teller  | ✅  | ✅        | ✅         | ❌      | ❌      | ❌             | ❌             |
| Manager | ✅  | ✅        | ✅         | ✅      | ✅      | ✅             | ❌             |
| Admin   | ✅  | ✅        | ✅         | ✅      | ✅      | ✅             | ✅             |

---

## 9. Useful Supabase queries for ops

```sql
-- Check EFRIS pending submissions
SELECT * FROM get_efris_pending_sales(50);

-- List all users and their roles
SELECT p.full_name, p.role, b.name as branch, p.is_active
FROM profiles p LEFT JOIN branches b ON b.id = p.branch_id
ORDER BY p.role, p.full_name;

-- Today's sales summary
SELECT COUNT(*) as sales, SUM(total_amount) as revenue, SUM(vat_amount) as vat
FROM sales
WHERE DATE(created_at AT TIME ZONE 'Africa/Kampala') = CURRENT_DATE
  AND is_voided = FALSE;

-- Reset a user's password (they'll be forced to change on next login)
UPDATE profiles SET must_change_password = TRUE WHERE id = '<user_uuid>';
UPDATE auth.users SET encrypted_password = crypt('TempPass123!', gen_salt('bf'))
WHERE id = '<user_uuid>';
```

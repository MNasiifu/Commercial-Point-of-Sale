# DAS POS

Point-of-sale system for **DAS Drug Shop**, Kampala Uganda.  
Handles sales, inventory, returns, reconciliation, VAT reporting, and URA EFRIS e-invoicing.

**TIN:** 10756690689 | **VAT rate:** 18% (inclusive pricing throughout)

---

## Table of contents

1. [Tech stack](#1-tech-stack)
2. [Prerequisites](#2-prerequisites)
3. [Local development setup](#3-local-development-setup)
4. [Environment variables](#4-environment-variables)
5. [Project structure](#5-project-structure)
6. [Architecture & patterns](#6-architecture--patterns)
7. [Database & Supabase](#7-database--supabase)
8. [Domain concepts](#8-domain-concepts)
9. [Roles & permissions](#9-roles--permissions)
10. [Adding a new feature](#10-adding-a-new-feature)
11. [Scripts reference](#11-scripts-reference)
12. [Code conventions](#12-code-conventions)
13. [Deployment](#13-deployment)

---

## 1. Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + Vite 6 | `StrictMode` enabled |
| Language | TypeScript 5 strict | `noUnusedLocals`, `noUnusedParameters` |
| UI library | MUI v6 + Emotion | Light/dark theme via `themeStore` |
| Data grids & charts | MUI X DataGrid v7, MUI X Charts v7 | |
| Server state | TanStack Query v5 | `staleTime` per-query, `refetchInterval` for live KPIs |
| Client state | Zustand v5 | Cart, auth profile, theme mode, notifications |
| Forms | React Hook Form v7 + Zod v3 | `zodResolver` on every form |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | RLS enabled on all tables |
| Offline DB | Dexie (IndexedDB) | Offline queue + product cache |
| PWA | vite-plugin-pwa + Workbox | Service worker auto-generated on build |
| Barcode | bwip-js | Renders barcodes on product labels |
| Excel export | ExcelJS | Styled headers, auto-filter, metadata rows |
| PDF / print | HTML-to-print (`window.print`) | 80mm thermal receipt via QZ Tray |
| EFRIS | URA Uganda T109 e-invoice | Supabase Edge Function `efris-submit` |
| Web Vitals | web-vitals v5 | CLS, FCP, INP, LCP, TTFB logged in dev |

---

## 2. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | **22.19.0** (via nvm) | Locked — always `nvm use 22.19.0` before install |
| Yarn | 1.x (classic) | Package manager — **never use npm** |
| Supabase account | any | Project URL + keys |
| Git | any | |

> **nvm:** If you don't have nvm, install it first:
> `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
> Then `nvm install 22.19.0`.

---

## 3. Local development setup

```bash
# 1. Clone
git clone <repo-url>
cd point-of-sale

# 2. Use the correct Node version
nvm use 22.19.0

# 3. Install dependencies (Yarn only)
yarn

# 4. Copy environment file
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see §4)

# 5. Start dev server
yarn dev
# App runs at http://localhost:5173
```

### Supabase setup (first time)
The Supabase project and all migrations must already be run.  
See [DEPLOYMENT.md](DEPLOYMENT.md) §1 for the full migration order (21 SQL files).  
Once the DB is live, log in with the first admin account and the app is ready.

---

## 4. Environment variables

Create `.env.local` in the project root (this file is git-ignored):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

These are the **only** client-side secrets needed. All other secrets (EFRIS credentials, service role key) live as Supabase Edge Function secrets — never in `.env`.

| Variable | Where to find |
|----------|--------------|
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Same page, "anon public" key |

---

## 5. Project structure

```
point-of-sale/
├── public/
│   └── icons/                   # PWA icons (icon.svg + icon-192.png + icon-512.png)
├── supabase/
│   ├── migrations/              # All SQL — run manually in Supabase SQL Editor
│   │   ├── 001_extensions_types.sql   … 016_fix_search_products_unit_id.sql
│   │   ├── phase6_returns_and_void.sql
│   │   ├── phase7_dashboard_rpcs.sql
│   │   ├── phase8_report_rpcs.sql
│   │   ├── phase9_reconciliation_rpcs.sql
│   │   └── phase10_efris_rpcs.sql
│   └── functions/
│       └── efris-submit/
│           └── index.ts         # Deno edge function — T109 e-invoice to URA
├── src/
│   ├── main.tsx                 # Entry point — providers, web vitals
│   ├── App.tsx                  # ErrorBoundary + RouterProvider
│   ├── vite-env.d.ts            # Vite + vite-plugin-pwa type references
│   │
│   ├── pages/                   # One directory per route (see §5.2)
│   ├── components/
│   │   ├── atoms/               # Smallest reusable pieces (Logo, StatusDot)
│   │   ├── molecules/           # Composed atoms (StatCard, FormField, OfflineBanner,
│   │   │                        #   PwaUpdatePrompt, InstallPrompt, InactivityWarning,
│   │   │                        #   CustomerSearchAutocomplete, BarcodeDisplay)
│   │   ├── organisms/           # Feature-complete blocks (see §5.1)
│   │   └── templates/
│   │       ├── AuthTemplate/    # Centred card layout for Login/ChangePassword
│   │       └── DashboardTemplate/ # Sidebar + header + offline banner + update prompt
│   │
│   ├── hooks/                   # Custom hooks, grouped by domain (see §5.3)
│   ├── services/                # All Supabase calls — no DB logic in components
│   ├── store/                   # Zustand stores (auth, cart, theme, notifications)
│   ├── lib/                     # Pure utilities (formatters, VAT, receipt, export…)
│   ├── routes/                  # Router config with React.lazy page splitting
│   ├── types/
│   │   └── database.types.ts    # Hand-maintained TypeScript interfaces for all DB tables
│   └── theme/                   # MUI light/dark theme tokens
│
├── index.html
├── vite.config.ts               # VitePWA + manualChunks
├── tsconfig.json
├── DEPLOYMENT.md                # Ops / production runbook
└── README.md                    # This file
```

### 5.1 Organisms

| Organism | Purpose |
|----------|---------|
| `AppHeader` | Fixed top bar — page title, install button, theme toggle |
| `AppSidebar` | Navigation drawer — role-aware menu items |
| `ProductSearchBar` | Debounced search + barcode scan entry for POS |
| `BarcodeManager` | Attach / remove barcodes on a product |
| `CartPanel` | POS cart — line items, quantities, totals |
| `PaymentPanel` | Split-payment entry (Cash / MTN MoMo / Airtel Money) |
| `ReceiptDialog` | Post-sale receipt preview + print + new sale |
| `CustomerForm / Table` | CRUD for customer accounts |
| `DeliveryForm / Table` | Delivery order creation and status management |
| `SaleSearchPanel` | Right-side drawer to search past sales (for returns/void) |
| `VoidSaleDialog` | Confirmation + reason for voiding a sale |
| `ReturnForm / Table` | Multi-item return with quantity validation |
| `ReconciliationForm` | Denomination grid + mobile money actuals + variance |
| `ProductForm / Table` | Product catalogue management |
| `ProductUnitManager` | Units of measure per product (e.g. Tablet, Strip, Box) |
| `NotificationManager` | Toast notifications (wraps MUI Snackbar) |
| `ErrorBoundary` | Catches unhandled React render errors |

### 5.2 Pages

| Route | Page | Roles |
|-------|------|-------|
| `/login` | `LoginPage` | Public |
| `/change-password` | `ChangePasswordPage` | Authenticated (any) |
| `/dashboard` | `DashboardPage` | All |
| `/pos` | `POSPage` | All |
| `/customers` | `CustomersPage` | All |
| `/delivery-orders` | `DeliveriesPage` | All |
| `/delivery-orders/:id` | `DeliveryDetailPage` | All |
| `/my-summary` | `MySummaryPage` | All |
| `/products` | `ProductsPage` | Admin, Manager |
| `/products/new` `/products/:id` | `ProductFormPage` | Admin, Manager |
| `/returns` | `ReturnsPage` | Admin, Manager |
| `/returns/:id` | `ReturnDetailPage` | Admin, Manager |
| `/reports` | `ReportsPage` | Admin, Manager |
| `/reports/sales` | `SalesReportPage` | Admin, Manager |
| `/reports/stock` | `StockReportPage` | Admin, Manager |
| `/reports/expiry` | `ExpiryReportPage` | Admin, Manager |
| `/reports/vat` | `VatReportPage` | Admin, Manager |
| `/reports/reconciliation` | `ReconciliationPage` | Admin, Manager |
| `/reports/reconciliation/:id` | `ReconciliationDetailPage` | Admin, Manager |
| `/users` | PlaceholderPage (Phase 1) | Admin |
| `/settings` | PlaceholderPage (Phase 1) | Admin |

All pages are **lazy-loaded** via `React.lazy` — initial bundle is ~234 kB gzipped.

### 5.3 Hooks by domain

```
hooks/
├── app/           useNetworkStatus, useInstallPrompt
├── auth/          useAuth, usePermissions, useInactivityLogout
├── customers/     useCustomers, useCustomerMutations
├── dashboard/     useDashboard, useTellerSummary
├── deliveries/    useDeliveries, useDeliveryMutations
├── efris/         useSubmitEfrisInvoice
├── offline/       useOnlineStatus
├── pos/           useCompleteSale, useProductSearch, useBarcodeScanner
├── products/      useProducts, useProductMutations
├── reconciliation/useReconciliations, useReconciliation,
│                  useReconciliationPreview, useCloseReconciliation
├── reports/       useSalesReport, useStockValuation,
│                  useExpiryReport, useVatReport, useTellers
├── returns/       useReturns, useReturn, useProcessReturn
├── sales/         useSales, useSale, useVoidSale
└── shared/        useReferenceData, useVatRate
```

---

## 6. Architecture & patterns

### Data flow

```
UI component
  └─ custom hook  (e.g. useProducts)
       └─ TanStack Query / useMutation
            └─ service  (e.g. productService.getAll)
                 └─ Supabase client  (.from / .rpc)
                      └─ Supabase Postgres (RLS-enforced)
```

No component ever calls Supabase directly. All DB access goes through `src/services/`.

### Supabase client workaround

Supabase's TypeScript generics require a generated `Database` type. Because we maintain hand-written interfaces instead of using the Supabase CLI generator, every service file casts the client:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any
```

This is intentional and project-wide — do not remove it.

### TanStack Query conventions

```typescript
// Read — always set staleTime to avoid redundant refetches
useQuery({ queryKey: ['products', branchId], queryFn: ..., staleTime: 30_000 })

// Live data — use refetchInterval (dashboard KPIs only)
useQuery({ ..., refetchInterval: 60_000 })

// On-demand reports — start with enabled: false, flip to true on user action
const [run, setRun] = useState(false)
useQuery({ ..., enabled: run })

// After mutation — always invalidate the affected query key
queryClient.invalidateQueries({ queryKey: ['products'] })
```

### Zustand stores

| Store | What it holds |
|-------|---------------|
| `authStore` | `user` (Supabase auth), `profile` (role, branch_id, full_name) |
| `cartStore` | POS cart lines, customer, computed totals |
| `themeStore` | `'light' \| 'dark'` — persisted to localStorage |
| `notificationStore` | Queue of toast messages (`notify.success / error / warning / info`) |

### Forms

Every form uses **React Hook Form + Zod**:

```typescript
const { control, register, handleSubmit, formState: { errors } } =
  useForm<MyFormValues>({ resolver: zodResolver(mySchema) })
```

Schemas live in `src/lib/zod-schemas/`. Never put validation logic in components.

### Component conventions (Atomic Design)

| Level | Rule |
|-------|------|
| Atom | No business logic. No hooks except `useTheme`. |
| Molecule | May call read-only hooks. No mutations. |
| Organism | May call any hook. Owns its own loading/error states. |
| Template | Layout only — no data fetching. |
| Page | Composes organisms. Passes route params down. |

---

## 7. Database & Supabase

### Key tables

| Table | Description |
|-------|-------------|
| `branches` | Physical shop locations |
| `profiles` | Extended user data (role, branch, must_change_password) |
| `products` | Drug catalogue (name, generic name, category, VAT exempt flag) |
| `product_units` | Units of measure per product with pricing |
| `product_barcodes` | One-to-many barcodes per product unit |
| `stock_batches` | Inventory batches with expiry dates and cost |
| `customers` | Customer accounts (name, phone, TIN for business buyers) |
| `delivery_orders` | Delivery orders linked to customers |
| `sales` | Completed sales (teller, branch, totals, EFRIS status) |
| `sale_items` | Line items with VAT breakdown per item |
| `payments` | Split-payment records (cash, MTN MoMo, Airtel) |
| `returns` | Return transactions |
| `return_items` | Return line items |
| `daily_reconciliations` | End-of-day cash + mobile money reconciliation |
| `reconciliation_denominations` | Denomination counts for cash reconciliation |
| `efris_submissions` | Audit log of every URA EFRIS API call |
| `audit_logs` | Immutable append-only log of all significant actions |

### RPC functions (called via `.rpc()`)

| RPC | Called by |
|-----|-----------|
| `complete_sale` | `useCompleteSale` |
| `void_sale` | `useVoidSale` |
| `process_return` | `useProcessReturn` |
| `search_products` | `useProductSearch` |
| `get_dashboard_kpis` | `useDashboard` |
| `get_teller_summary` | `useTellerSummary` |
| `get_sales_report` | `useSalesReport` |
| `get_stock_valuation` | `useStockValuation` |
| `get_expiry_report` | `useExpiryReport` |
| `get_vat_report` | `useVatReport` |
| `get_reconciliation_preview` | `useReconciliationPreview` |
| `close_reconciliation` | `useCloseReconciliation` |
| `record_efris_result` | `efris-submit` edge function |
| `get_efris_pending_sales` | Admin ops / retry tooling |

### Adding a new RPC

1. Write the SQL in a new `phaseN_*.sql` file in `supabase/migrations/`.
2. Run it manually in the Supabase SQL Editor.
3. Add the call in the relevant service file (`src/services/`).
4. Add the TypeScript return type to `src/types/database.types.ts`.

**Never use the Supabase CLI** — there is no linked project config in the repo.

### Row Level Security

RLS is enabled on all tables. Policies are in `012_rls_policies.sql`.  
General rules:
- Tellerss can read/write their own branch's sales.
- Managers can read/write all data for their branch.
- Admins have full access.
- `audit_logs` and `efris_submissions` are insert-only (no update/delete).

---

## 8. Domain concepts

### VAT (18%, inclusive)

All selling prices are **VAT-inclusive**. The VAT portion is back-calculated:

```
VAT amount = total_inclusive × (18 / 118)
Net amount = total_inclusive × (100 / 118)
```

This logic lives in `src/lib/vat.ts → computeLineTotal()`.  
Products can be flagged `is_vat_exempt = true` (e.g. basic medicines) — VAT is then 0.

### POS sale flow

```
1. Teller searches for product (debounced via search_products RPC)
2. Item added to cart → CartStore updates (VAT computed client-side)
3. Teller optionally links a customer
4. Teller opens PaymentPanel → enters cash/MoMo/Airtel amounts
5. Confirm → complete_sale RPC (atomic: creates sale + items + payments + stock deduction)
6. EFRIS edge function fires → T109 submitted to URA in background
7. Receipt dialog opens with EFRIS verification code (if submission succeeded)
8. Teller prints receipt (browser print / QZ Tray for thermal)
```

### Reconciliation flow

```
1. Manager opens "Open today's reconciliation"
2. ReconciliationForm shows system-expected totals (from get_reconciliation_preview RPC)
3. Manager counts physical cash by denomination, enters MTN/Airtel actuals
4. Submit → close_reconciliation RPC (upsert — can re-open submitted records)
5. Status: open → submitted → approved (approved records are locked)
```

### EFRIS (URA e-Invoice)

After every sale, the `efris-submit` Supabase Edge Function:
1. Fetches full sale detail from DB.
2. Builds a T109 invoice (goods, taxes, payments, buyer, seller).
3. AES-256-ECB encrypts the content with the device secret.
4. HMAC-SHA256 signs the encrypted payload.
5. POSTs to the URA EFRIS API endpoint.
6. Saves the result (verification code + QR data) to `efris_submissions` and updates `sales.efris_status`.

Sales with `efris_status = 'pending' | 'failed'` can be retried via `get_efris_pending_sales()`.

### Offline (IndexedDB via Dexie)

`src/lib/offlineDb.ts` defines an IndexedDB schema with:
- `offlineQueue` — actions to replay when connectivity returns.
- `cachedProducts` — product + barcode data for offline search.
- `cachedStockBatches` — expiry/stock data.
- `cachedSales` — recent sales for reference.

The service worker (Workbox, auto-generated) uses **NetworkFirst** for Supabase API calls with a 10-second timeout — it falls back to cache when offline.

---

## 9. Roles & permissions

```typescript
// Check permissions anywhere with the hook:
const { isAdminOrManager, canVoidSale, canProcessReturn } = usePermissions()
```

| Permission flag | Admin | Manager | Teller |
|----------------|-------|---------|--------|
| `canManageUsers` | ✅ | ❌ | ❌ |
| `canManageProducts` | ✅ | ✅ | ❌ |
| `canManageInventory` | ✅ | ✅ | ❌ |
| `canViewAllReports` | ✅ | ✅ | ❌ |
| `canVoidSale` | ✅ | ✅ | ❌ |
| `canProcessReturn` | ✅ | ✅ | ❌ |
| `canReconcile` | ✅ | ✅ | ❌ |
| `canUsePOS` | ✅ | ✅ | ✅ |
| `canManageCustomers` | ✅ | ✅ | ✅ |
| `canManageDeliveries` | ✅ | ✅ | ✅ |

Route-level enforcement is in `src/routes/RoleRoute.tsx`.  
Feature-level enforcement uses `usePermissions()` guards inside components.

**Session security:** Users are automatically logged out after **10 minutes of inactivity** (`useInactivityLogout`). A warning dialog appears 60 seconds before logout.

**First login:** Every new user has `must_change_password = true`. The app redirects them to `/change-password` before any other route.

---

## 10. Adding a new feature

Follow this checklist in order:

### Step 1 — SQL migration
Create `supabase/migrations/phaseN_my_feature.sql`.  
Run it manually in the Supabase SQL Editor.  
Pattern:
```sql
CREATE OR REPLACE FUNCTION my_rpc(p_data JSONB) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- logic
END;
$$;
GRANT EXECUTE ON FUNCTION my_rpc TO authenticated;
```

### Step 2 — TypeScript types
Add interfaces to `src/types/database.types.ts`:
```typescript
export interface MyEntity {
  id: string
  // ...
}
```

### Step 3 — Zod schema (if there's a form)
Add `src/lib/zod-schemas/my-feature.schemas.ts`:
```typescript
export const mySchema = z.object({ ... })
export type MyFormValues = z.infer<typeof mySchema>
```

### Step 4 — Service
Add `src/services/myFeatureService.ts`:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const myFeatureService = {
  async getAll(): Promise<MyEntity[]> {
    const { data, error } = await db.from('my_table').select('*')
    if (error) throw error
    return data as MyEntity[]
  },
}
```

### Step 5 — Hook
Add `src/hooks/myFeature/useMyFeature.ts`:
```typescript
const KEY = 'my-feature'

export function useMyFeatures() {
  return useQuery({
    queryKey: [KEY],
    queryFn:  () => myFeatureService.getAll(),
    staleTime: 30_000,
  })
}

export function useCreateMyFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: myFeatureService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [KEY] }),
    onError:    (e: Error) => notify.error(e.message),
  })
}
```

### Step 6 — UI components
Build from atoms up: `atoms → molecules → organisms → page`.  
Use `DashboardTemplate` to wrap the page.

### Step 7 — Route
Add to `src/routes/index.tsx` using the `page()` lazy helper:
```typescript
const MyFeaturePage = page(
  () => import('@/components/pages/MyFeature/MyFeaturePage'),
  'MyFeaturePage',
)
// Then in the router:
{ path: '/my-feature', element: <S><MyFeaturePage /></S> }
```

### Step 8 — Type check
```bash
yarn type-check
# Must exit with 0 errors before opening a PR
```

---

## 11. Scripts reference

```bash
yarn dev          # Start Vite dev server on http://localhost:5173
yarn build        # TypeScript compile + Vite production build → dist/
yarn preview      # Preview the production build locally
yarn type-check   # tsc --noEmit (no emit, just type errors)
yarn lint         # ESLint — max-warnings 0 (CI-ready)
```

> Always run `nvm use 22.19.0` before `yarn` commands if you've switched Node versions.

---

## 12. Code conventions

### TypeScript
- Strict mode. `noUnusedLocals` and `noUnusedParameters` are enforced — unused imports cause compile errors.
- Use `type` imports wherever possible: `import type { Foo } from '...'`.
- Path alias `@/` maps to `src/`. Always use it; no relative `../../` imports.

### Comments
- Write **no comments by default**.
- Only comment when the *why* is non-obvious: a hidden constraint, a workaround for a specific bug, or a subtle invariant.
- Never comment what the code does — well-named identifiers do that.

### Naming
| Thing | Convention | Example |
|-------|-----------|---------|
| Component | PascalCase | `ReconciliationForm` |
| Hook | camelCase, `use` prefix | `useCloseReconciliation` |
| Service | camelCase object | `reconciliationService.close` |
| Query key | string constant | `const RECON_KEY = 'reconciliations'` |
| Zod schema | camelCase, `Schema` suffix | `reconciliationSchema` |
| Zod inferred type | PascalCase, `Values` suffix | `ReconciliationFormValues` |

### No implicit `any`
If Supabase generics force a type error, cast the whole client to `any` once at the top of the service file (the existing pattern). Do not scatter `as any` casts throughout.

### Formatters
Always use the shared formatters from `src/lib/formatters.ts`:
```typescript
formatUGX(amount)       // UGX 1,234,500
formatDate(isoString)   // 16 May 2026
formatDateTime(isoString) // 16 May 2026, 09:30 AM
formatDateInput(isoString) // 2026-05-16 (for <input type="date">)
```

---

## 13. Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full runbook.

Quick reference:
- Run all 21 SQL migrations in the Supabase SQL Editor (in order).
- Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in Vercel/Netlify env vars.
- Deploy the `efris-submit` Edge Function and set its 4 secrets.
- Generate PNG icons from `public/icons/icon.svg` before going live.
- Create the first admin user via SQL (see DEPLOYMENT.md §1.4).

---

## Appendix — key file quick-reference

| Question | File to read |
|----------|-------------|
| How does a sale complete? | `src/hooks/pos/useCompleteSale.ts` |
| How is VAT calculated? | `src/lib/vat.ts` |
| How is the receipt built? | `src/lib/receipt.ts` |
| How does EFRIS work end-to-end? | `supabase/functions/efris-submit/index.ts` |
| What columns does `sales` have? | `src/types/database.types.ts → Sale` |
| How does the cart work? | `src/store/cartStore.ts` |
| How are permissions checked? | `src/hooks/auth/usePermissions.ts` |
| How are reports exported to Excel? | `src/lib/reports/exportExcel.ts` |
| How are reports printed as PDF? | `src/lib/reports/exportPdf.ts` |
| What is the offline DB schema? | `src/lib/offlineDb.ts` |
| How is the service worker configured? | `vite.config.ts → VitePWA → workbox` |

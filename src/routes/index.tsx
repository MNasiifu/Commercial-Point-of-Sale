import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

// ─── Page-level code splitting ────────────────────────────────
// Each lazy import becomes its own JS chunk. The initial bundle
// only loads Login + shell; all other pages load on first visit.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const page = <T extends Record<string, React.ComponentType<any>>>(
  importFn: () => Promise<T>,
  name: keyof T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.LazyExoticComponent<React.ComponentType<any>> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lazy(() =>
    importFn().then((m) => ({ default: m[name] as React.ComponentType<any> })),
  );

const LoginPage = page(() => import("@/pages/Login/LoginPage"), "LoginPage");
const ChangePasswordPage = page(
  () => import("@/pages/ChangePassword/ChangePasswordPage"),
  "ChangePasswordPage",
);
const DashboardPage = page(
  () => import("@/pages/Dashboard/DashboardPage"),
  "DashboardPage",
);
const POSPage = page(() => import("@/pages/POS/POSPage"), "POSPage");
const CustomersPage = page(
  () => import("@/pages/Customers/CustomersPage"),
  "CustomersPage",
);
const DeliveriesPage = page(
  () => import("@/pages/Deliveries/DeliveriesPage"),
  "DeliveriesPage",
);
const DeliveryDetailPage = page(
  () => import("@/pages/Deliveries/DeliveryDetailPage"),
  "DeliveryDetailPage",
);
const MySummaryPage = page(
  () => import("@/pages/MySummary/MySummaryPage"),
  "MySummaryPage",
);
const ProductsPage = page(
  () => import("@/pages/Products/ProductsPage"),
  "ProductsPage",
);
const ProductDetailPage = page(
  () => import("@/pages/Products/ProductDetailPage"),
  "ProductDetailPage",
);
const ProductFormPage = page(
  () => import("@/pages/Products/ProductFormPage"),
  "ProductFormPage",
);
const ReturnsPage = page(
  () => import("@/pages/Returns/ReturnsPage"),
  "ReturnsPage",
);
const ReturnDetailPage = page(
  () => import("@/pages/Returns/ReturnDetailPage"),
  "ReturnDetailPage",
);
const ReportsPage = page(
  () => import("@/pages/Reports/ReportsPage"),
  "ReportsPage",
);
const SalesReportPage = page(
  () => import("@/pages/Reports/SalesReportPage"),
  "SalesReportPage",
);
const StockReportPage = page(
  () => import("@/pages/Reports/StockReportPage"),
  "StockReportPage",
);
const TransfersReportPage = page(
  () => import("@/pages/Reports/TransfersReportPage"),
  "TransfersReportPage",
);
const ReconciliationPage = page(
  () => import("@/pages/Reconciliation/ReconciliationPage"),
  "ReconciliationPage",
);
const ReconciliationDetailPage = page(
  () => import("@/pages/Reconciliation/ReconciliationDetailPage"),
  "ReconciliationDetailPage",
);
const InventoryOverviewPage = page(
  () => import("@/pages/Inventory/InventoryOverviewPage"),
  "InventoryOverviewPage",
);
const TransfersPage = page(
  () => import("@/pages/Inventory/TransfersPage"),
  "TransfersPage",
);
const TransferDetailPage = page(
  () => import("@/pages/Inventory/TransferDetailPage"),
  "TransferDetailPage",
);
const ProductStockPage = page(
  () => import("@/pages/Inventory/ProductStockPage"),
  "ProductStockPage",
);
const StockAdjustmentsPage = page(
  () => import("@/pages/Inventory/StockAdjustmentsPage"),
  "StockAdjustmentsPage",
);
const StockTakesPage = page(
  () => import("@/pages/Inventory/StockTakesPage"),
  "StockTakesPage",
);
const StockTakeDetailPage = page(
  () => import("@/pages/Inventory/StockTakeDetailPage"),
  "StockTakeDetailPage",
);
const ReceiveStockPage = page(
  () => import("@/pages/Inventory/ReceiveStockPage"),
  "ReceiveStockPage",
);
const PlaceholderPage = page(
  () => import("@/pages/Placeholder/PlaceholderPage"),
  "PlaceholderPage",
);
const UserPage = page(
  () => import("@/pages/user/UserPage"),
  "UserPage",
);
const CategoriesPage = page(
  () => import("@/pages/Catalog/CategoriesPage"),
  "CategoriesPage",
);
const CountriesPage = page(
  () => import("@/pages/Catalog/CountriesPage"),
  "CountriesPage",
);
const BrandsPage = page(
  () => import("@/pages/Catalog/BrandsPage"),
  "BrandsPage",
);
const GarmentTypesPage = page(
  () => import("@/pages/Catalog/GarmentTypesPage"),
  "GarmentTypesPage",
);
const SizesPage = page(
  () => import("@/pages/Catalog/SizesPage"),
  "SizesPage",
);
const ColorsPage = page(
  () => import("@/pages/Catalog/ColorsPage"),
  "ColorsPage",
);

// ─── Suspense fallback ────────────────────────────────────────

function PageLoader() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
    >
      <CircularProgress />
    </Box>
  );
}

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ─── Router ───────────────────────────────────────────────────

export const router = createBrowserRouter([
  // ─── Public routes ─────────────────────────────────────────
  {
    path: "/login",
    element: (
      <S>
        <LoginPage />
      </S>
    ),
  },

  // ─── Semi-protected ────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/change-password",
        element: (
          <S>
            <ChangePasswordPage />
          </S>
        ),
      },
    ],
  },

  // ─── Fully protected ───────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // All roles
      {
        element: <RoleRoute allowedRoles={["admin", "manager", "teller"]} />,
        children: [
          {
            path: "/dashboard",
            element: (
              <S>
                <DashboardPage />
              </S>
            ),
          },
          {
            path: "/pos",
            element: (
              <S>
                <POSPage />
              </S>
            ),
          },
          {
            path: "/customers",
            element: (
              <S>
                <CustomersPage />
              </S>
            ),
          },
          {
            path: "/delivery-orders",
            element: (
              <S>
                <DeliveriesPage />
              </S>
            ),
          },
          {
            path: "/delivery-orders/:id",
            element: (
              <S>
                <DeliveryDetailPage />
              </S>
            ),
          },
          {
            path: "/my-summary",
            element: (
              <S>
                <MySummaryPage />
              </S>
            ),
          },
          {
            path: "/catalog",
            element: <Navigate to="/catalog/categories" replace />,
          },
          {
            path: "/catalog/categories",
            element: (
              <S>
                <CategoriesPage />
              </S>
            ),
          },
          {
            path: "/catalog/countries",
            element: (
              <S>
                <CountriesPage />
              </S>
            ),
          },
          {
            path: "/catalog/brands",
            element: (
              <S>
                <BrandsPage />
              </S>
            ),
          },
          {
            path: "/catalog/garment-types",
            element: (
              <S>
                <GarmentTypesPage />
              </S>
            ),
          },
          {
            path: "/catalog/sizes",
            element: (
              <S>
                <SizesPage />
              </S>
            ),
          },
          {
            path: "/catalog/colors",
            element: (
              <S>
                <ColorsPage />
              </S>
            ),
          },
          // Products — list + detail are read-only and open to all roles.
          // Creating/editing products is gated to admin + manager below.
          {
            path: "/products",
            element: (
              <S>
                <ProductsPage />
              </S>
            ),
          },
          {
            path: "/products/:id",
            element: (
              <S>
                <ProductDetailPage />
              </S>
            ),
          },
          // Inventory — read-only views open to all roles. Tellers see a
          // trimmed Overview and a cost-free Product Stock table, scoped to
          // their own branch. Mutating inventory pages stay admin/manager-only.
          {
            path: "/inventory",
            element: (
              <S>
                <InventoryOverviewPage />
              </S>
            ),
          },
          {
            path: "/inventory/overview",
            element: (
              <S>
                <InventoryOverviewPage />
              </S>
            ),
          },
          {
            path: "/inventory/product-stock",
            element: (
              <S>
                <ProductStockPage />
              </S>
            ),
          },
        ],
      },

      // Admin + Manager only
      {
        element: <RoleRoute allowedRoles={["admin", "manager"]} />,
        children: [
          {
            path: "/products/new",
            element: (
              <S>
                <ProductFormPage />
              </S>
            ),
          },
          {
            path: "/products/:id/edit",
            element: (
              <S>
                <ProductFormPage />
              </S>
            ),
          },
          {
            path: "/inventory/transfers",
            element: (
              <S>
                <TransfersPage />
              </S>
            ),
          },
          {
            path: "/inventory/transfers/:id",
            element: (
              <S>
                <TransferDetailPage />
              </S>
            ),
          },
          {
            path: "/inventory/adjustments",
            element: (
              <S>
                <StockAdjustmentsPage />
              </S>
            ),
          },
          {
            path: "/inventory/stock-takes",
            element: (
              <S>
                <StockTakesPage />
              </S>
            ),
          },
          {
            path: "/inventory/stock-takes/:id",
            element: (
              <S>
                <StockTakeDetailPage />
              </S>
            ),
          },
          {
            path: "/inventory/receive",
            element: (
              <S>
                <ReceiveStockPage />
              </S>
            ),
          },
          {
            path: "/returns",
            element: (
              <S>
                <ReturnsPage />
              </S>
            ),
          },
          {
            path: "/returns/:id",
            element: (
              <S>
                <ReturnDetailPage />
              </S>
            ),
          },
          {
            path: "/reports",
            element: (
              <S>
                <ReportsPage />
              </S>
            ),
          },
          {
            path: "/reports/sales",
            element: (
              <S>
                <SalesReportPage />
              </S>
            ),
          },
          {
            path: "/reports/stock",
            element: (
              <S>
                <StockReportPage />
              </S>
            ),
          },
          {
            path: "/reports/transfers",
            element: (
              <S>
                <TransfersReportPage />
              </S>
            ),
          },
          {
            path: "/reports/reconciliation",
            element: (
              <S>
                <ReconciliationPage />
              </S>
            ),
          },
          {
            path: "/reports/reconciliation/:id",
            element: (
              <S>
                <ReconciliationDetailPage />
              </S>
            ),
          },
        ],
      },

      // Admin only
      {
        element: <RoleRoute allowedRoles={["admin"]} />,
        children: [
          {
            path: "/users",
            element: (
              <S>
                <UserPage />
              </S>
            ),
          },
          {
            path: "/settings",
            element: (
              <S>
                <PlaceholderPage
                  title="Settings"
                  phase={1}
                  description="Branch settings, VAT configuration, EFRIS setup."
                />
              </S>
            ),
          },
        ],
      },
    ],
  },

  // ─── Fallback ───────────────────────────────────────────────
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

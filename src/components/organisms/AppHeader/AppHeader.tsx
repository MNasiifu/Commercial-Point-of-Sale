import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useThemeStore } from "@/store/themeStore";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation } from "react-router-dom";
import { InstallPrompt } from "@/components/molecules/InstallPrompt/InstallPrompt";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/inventory": "Inventory",
  "/inventory/product-stock": "Product Stock",
  "/inventory/transfers": "Stock Transfers",
  "/inventory/adjustments": "Stock Adjustments",
  "/inventory/stock-takes": "Stock Takes",
  "/inventory/receive": "Receive Stock",
  "/customers": "Customers",
  "/catalog/categories": "Categories",
  "/catalog/brands": "Brands",
  "/catalog/garment-types": "Garment Types",
  "/catalog/sizes": "Sizes",
  "/catalog/colors": "Colors",
  "/catalog/countries": "Countries",
  "/delivery-orders": "Delivery Orders",
  "/returns": "Returns",
  "/reports": "Reports",
  "/reports/sales": "Sales Report",
  "/reports/stock": "Stock Valuation",
  "/reports/transfers": "Transfers Report",
  "/reports/reconciliation": "Reconciliation",
  "/my-summary": "My Sales Summary",
  "/users": "User Management",
  "/settings": "Settings",
};

const ROLE_COLORS: Record<string, "primary" | "secondary" | "default"> = {
  admin: "primary",
  manager: "secondary",
  teller: "default",
};

interface Props {
  onMenuClick: () => void;
  sidebarWidth: number;
}

export function AppHeader({ onMenuClick, sidebarWidth }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, toggleMode } = useThemeStore();
  const { role } = useAuth();
  const { pathname } = useLocation();

  const pageTitle = PAGE_TITLES[pathname] ?? "DAS POS";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        bgcolor: "background.paper",
        borderRadius: 0,
        color: "text.primary",
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.standard,
        }),
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Page title */}
        <Typography variant="h6" fontWeight={700} flex={1} noWrap>
          {pageTitle}
        </Typography>

        {/* Right side controls */}
        <Box display="flex" alignItems="center" gap={1}>
          {/* PWA install button — only visible when browser supports A2HS */}
          <InstallPrompt />

          {/* Role chip */}
          {role && (
            <Chip
              label={role.charAt(0).toUpperCase() + role.slice(1)}
              color={ROLE_COLORS[role]}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: "6px" }}
            />
          )}

          {/* Notifications placeholder */}
          <Tooltip title="Notifications" arrow>
            <IconButton size="small">
              <NotificationsNoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"} arrow>
            <IconButton size="small" onClick={toggleMode}>
              {mode === "light" ? (
                <DarkModeIcon fontSize="small" />
              ) : (
                <LightModeIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

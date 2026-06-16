import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
  Collapse,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import TuneIcon from "@mui/icons-material/Tune";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleIcon from "@mui/icons-material/People";
import GridViewIcon from '@mui/icons-material/GridView';
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SellIcon from "@mui/icons-material/Sell";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CategoryIcon from "@mui/icons-material/Category";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import PaletteIcon from "@mui/icons-material/Palette";
import StyleIcon from "@mui/icons-material/Style";
import StraightenIcon from "@mui/icons-material/Straighten";
import PublicIcon from "@mui/icons-material/Public";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { Logo } from "@/components/atoms/Logo/Logo";
import { StatusDot } from "@/components/atoms/StatusDot/StatusDot";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { tokens } from "@/theme/tokens";
import type { UserRole } from "@/types/database.types";

const EXPANDED = tokens.sidebar.expandedWidth;
const COLLAPSED = tokens.sidebar.collapsedWidth;

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
  children?: NavItem[];
}

const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    roles: ["admin", "manager", "teller"],
  },
  {
    id: "pos",
    label: "Point of Sale",
    path: "/pos",
    icon: <PointOfSaleIcon />,
    roles: ["admin", "manager", "teller"],
  },
  {
    id: "products",
    label: "Products",
    path: "/products",
    icon: <CheckroomIcon />,
    roles: ["admin", "manager", "teller"],
  },
  {
    id: "inventory",
    label: "Inventory",
    path: "/inventory",
    icon: <WarehouseIcon />,
    // Teller is allowed on the group so the two read-only children below
    // (Overview, Product Stock) can render. The mutating children stay
    // admin/manager-only and are filtered out per-item for tellers.
    roles: ["admin", "manager", "teller"],
    children: [
       {
        id: "inv-overview",
        label: "Overview",
        path: "/inventory/overview",
        icon: <GridViewIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "inv-product-stock",
        label: "Product Stock",
        path: "/inventory/product-stock",
        icon: <AssignmentIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "inv-transfers",
        label: "Stock Transfers",
        path: "/inventory/transfers",
        icon: <SwapHorizIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "inv-adj",
        label: "Adjustments",
        path: "/inventory/adjustments",
        icon: <TuneIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "inv-takes",
        label: "Stock Takes",
        path: "/inventory/stock-takes",
        icon: <FactCheckIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "inv-receive",
        label: "Receive Stock",
        path: "/inventory/receive",
        icon: <LocalShippingIcon />,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    path: "/customers",
    icon: <PeopleIcon />,
    roles: ["admin", "manager", "teller"],
  },
  {
    id: "catalog",
    label: "Catalog",
    path: "/catalog",
    icon: <MenuBookIcon />,
    roles: ["admin", "manager", "teller"],
    children: [
      {
        id: "catalog-categories",
        label: "Categories",
        path: "/catalog/categories",
        icon: <CategoryIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "catalog-brands",
        label: "Brands",
        path: "/catalog/brands",
        icon: <LocalOfferIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "catalog-garment-types",
        label: "Garment Types",
        path: "/catalog/garment-types",
        icon: <StyleIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "catalog-sizes",
        label: "Sizes",
        path: "/catalog/sizes",
        icon: <StraightenIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "catalog-colors",
        label: "Colors",
        path: "/catalog/colors",
        icon: <PaletteIcon />,
        roles: ["admin", "manager", "teller"],
      },
      {
        id: "catalog-countries",
        label: "Countries",
        path: "/catalog/countries",
        icon: <PublicIcon />,
        roles: ["admin", "manager", "teller"],
      },
    ],
  },
  // {
  //   id: "deliveries",
  //   label: "Delivery Orders",
  //   path: "/delivery-orders",
  //   icon: <DeliveryDiningIcon />,
  //   roles: ["admin", "manager", "teller"],
  // },
  {
    id: "returns",
    label: "Returns",
    path: "/returns",
    icon: <AssignmentReturnIcon />,
    roles: ["admin", "manager"],
  },
  {
    id: "reports",
    label: "Reports",
    path: "/reports",
    icon: <AssessmentIcon />,
    roles: ["admin", "manager"],
    children: [
      {
        id: "rep-sales",
        label: "Sales Report",
        path: "/reports/sales",
        icon: <SellIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "rep-stock",
        label: "Stock Report",
        path: "/reports/stock",
        icon: <InventoryIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "rep-transfers",
        label: "Transfers Report",
        path: "/reports/transfers",
        icon: <SwapHorizIcon />,
        roles: ["admin", "manager"],
      },
      {
        id: "rep-recon",
        label: "Reconciliation",
        path: "/reports/reconciliation",
        icon: <AccountBalanceIcon />,
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    id: "my-summary",
    label: "My Summary",
    path: "/my-summary",
    icon: <SummarizeIcon />,
    roles: ["teller"],
  },
  {
    id: "users",
    label: "Users",
    path: "/users",
    icon: <ManageAccountsIcon />,
    roles: ["admin"],
  },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   path: "/settings",
  //   icon: <SettingsIcon />,
  //   roles: ["admin"],
  // },
];

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([
    "inventory",
    "reports",
    "catalog",
  ]);
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = usePermissions();
  const { signOut, fullName, profile, branchDetails } = useAuth();

  const width = isMobile ? EXPANDED : collapsed ? COLLAPSED : EXPANDED;

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const navItems = NAV.filter((item) => role && item.roles.includes(role));

  const NavEntry = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    if (!role || !item.roles.includes(role)) return null;
    const hasChildren = !!item.children?.length;
    const active = isActive(item.path);
    const open = openGroups.includes(item.id);
    const showLabel = !collapsed || isMobile;

    return (
      <>
        <Tooltip
          title={collapsed && !isMobile && !hasChildren ? item.label : ""}
          placement="right"
          arrow
        >
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleGroup(item.id);
              } else {
                navigate(item.path);
                if (isMobile) onMobileClose();
              }
            }}
            selected={active && !hasChildren}
            sx={{
              mx: 1,
              mb: 0.25,
              borderRadius: 2,
              minHeight: 44,
              pl: depth === 0 ? 1.5 : 2.5,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                "&:hover": { bgcolor: "primary.dark" },
              },
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: showLabel ? 1.5 : 0,
                color: active && !hasChildren ? "inherit" : "text.secondary",
                "& svg": { fontSize: depth === 0 ? 22 : 20 },
              }}
            >
              {item.icon}
            </ListItemIcon>

            {showLabel && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: depth === 0 ? "0.875rem" : "0.8125rem",
                    fontWeight: active ? 600 : 500,
                    noWrap: true,
                  }}
                />
                {hasChildren &&
                  (open ? (
                    <ExpandLessIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18 }} />
                  ))}
              </>
            )}
          </ListItemButton>
        </Tooltip>

        {hasChildren && showLabel && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding>
              {item.children!.map((child) => (
                <NavEntry key={child.id} item={child} depth={1} />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  const sidebarContent = (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{ bgcolor: "background.paper" }}
    >
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={collapsed && !isMobile ? "center" : "space-between"}
        px={collapsed && !isMobile ? 0.5 : 2}
        py={0.3}
        minHeight={64}
      >
        <Logo
          collapsed={collapsed && !isMobile}
          size="md"
          height={40}
          showText={false}
          variant={theme.palette.mode === "dark" ? "white" : "default"}
        />
        {!isMobile && (
          <IconButton size="small" onClick={() => setCollapsed((c) => !c)}>
            {collapsed ? (
              <MenuIcon fontSize="small" />
            ) : (
              <ChevronLeftIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <Box flex={1} overflow="auto" py={1}>
        <List disablePadding>
          {navItems.map((item) => (
            <NavEntry key={item.id} item={item} />
          ))}
        </List>
      </Box>

      <Divider />

      {/* User footer */}
      <Box px={1.5} py={1.5}>
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          px={1}
          py={1}
          borderRadius={2}
          sx={{ "&:hover": { bgcolor: "action.hover" } }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              fontSize: "0.875rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {fullName.charAt(0).toUpperCase()}
          </Avatar>

          {(!collapsed || isMobile) && (
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {fullName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ textTransform: "capitalize" }}
              >
                {profile?.role}
              </Typography>

              {branchDetails && (
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mt={0.25}
                  color="primary.main"
                >
                  <StorefrontIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption" fontWeight={600} noWrap>
                    {branchDetails.name}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={0.5}>
            <StatusDot />
            {(!collapsed || isMobile) && (
              <Tooltip title="Sign out" arrow>
                <IconButton size="small" onClick={signOut} color="error">
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: EXPANDED,
            boxSizing: "border-box",
            border: "none",
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width,
          flexShrink: 0,
          transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            border: "none",
            borderRadius: 0,
            boxShadow: tokens.shadows.sidebar,
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
        open
      >
        {sidebarContent}
      </Drawer>
    </>
  );
}

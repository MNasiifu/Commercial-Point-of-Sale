import { DataGrid, type DataGridProps } from "@mui/x-data-grid";
import type { SxProps, Theme } from "@mui/material";

export type AppDataGridProps = DataGridProps;

/**
 * Base sx applied to every instance.
 * Provides the "rich" visual treatment: borders, column separators,
 * hover/selected row states, and dark-mode aware colours.
 */
const BASE_SX: SxProps<Theme> = {
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 2,
  backgroundColor: "background.paper",

  "& .MuiDataGrid-row": {
    borderBottom: "1px solid",
    borderColor: "divider",
  },

  "& .MuiDataGrid-cell": {
    alignItems: "center",
    borderBottom: "none",
    display: "flex",
    alignContent: "center",
  },

  "& .MuiDataGrid-columnHeaders": {
    borderBottom: "1px solid",
    borderColor: "divider",
  },

  "& .MuiDataGrid-columnHeader": {
    backgroundColor: "background.paper",
  },

  "& .MuiDataGrid-columnSeparator": {
    visibility: "visible",
    color: "divider",
    "& svg": {
      color: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.2)"
          : "rgba(0,0,0,0.18)",
    },
  },

  "& .MuiDataGrid-columnSeparator:hover svg": {
    color: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.5)"
        : "rgba(0,0,0,0.45)",
  },

  "& .MuiDataGrid-footerContainer": {
    borderTop: "1px solid",
    borderColor: "divider",
    backgroundColor: "background.paper",
  },

  "& .MuiDataGrid-row:hover": {
    backgroundColor: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(0,0,0,0.03)",
  },

  "& .MuiDataGrid-row.Mui-selected": {
    backgroundColor: (theme: Theme) =>
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.06)",
    "&:hover": {
      backgroundColor: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "rgba(255,255,255,0.10)"
          : "rgba(0,0,0,0.08)",
    },
  },
};

/**
 * A reusable, pre-styled DataGrid wrapper used across the application.
 *
 * Defaults:
 * - `autoHeight`
 * - `density="comfortable"`
 * - `disableRowSelectionOnClick`
 * - `pageSizeOptions={[25, 50, 100]}`
 * - `initialState` with pageSize 25
 * - Rich styling with dark-mode support
 * - Auto cursor: pointer on rows when `onRowClick` is provided
 *
 * All standard `DataGridProps` are accepted and will override defaults.
 */
export function AppDataGrid({ sx, onRowClick, ...rest }: AppDataGridProps) {
  return (
    <DataGrid
      autoHeight
      density="comfortable"
      disableRowSelectionOnClick
      pageSizeOptions={[25, 50, 100]}
      initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
      {...rest}
      onRowClick={onRowClick}
      sx={[
        BASE_SX,
        !!onRowClick && {
          "& .MuiDataGrid-row": { cursor: "pointer" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

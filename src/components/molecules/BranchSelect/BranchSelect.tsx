import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBranchesList } from "@/hooks/inventory/useInventory";

const ALL = "__all__";

/**
 * Branch picker shown only to admins. Lets an admin scope an inventory /
 * report view to one branch or "All branches" (null). Renders nothing for
 * non-admin users, who are always scoped to their own branch.
 */
export function BranchSelect({
  value,
  onChange,
  includeAll = true,
  label = "Branch",
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  includeAll?: boolean;
  label?: string;
}) {
  const { role } = useAuth();
  const { data: branches = [] } = useBranchesList();

  if (role !== "admin") return null;

  return (
    <FormControl size="small" sx={{ minWidth: 190 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value ?? (includeAll ? ALL : "")}
        onChange={(e) => onChange(e.target.value === ALL ? null : e.target.value)}
      >
        {includeAll && <MenuItem value={ALL}>All branches</MenuItem>}
        {branches.map((b) => (
          <MenuItem key={b.id} value={b.id}>
            {b.name}
            {b.is_main_store ? " (Main)" : ""}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

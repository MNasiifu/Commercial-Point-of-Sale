import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useProducts } from "@/hooks/products/useProducts";
import type { ProductWithDetails } from "@/services/productService";

export function productLabel(p: ProductWithDetails): string {
  return [p.name, p.sizes?.name, p.colors?.name].filter(Boolean).join(" · ");
}

interface Props {
  value: ProductWithDetails | null;
  onChange: (p: ProductWithDetails | null) => void;
  label?: string;
  exclude?: string[];
  size?: "small" | "medium";
  error?: boolean;
  helperText?: string;
  /**
   * Optional available-stock lookup by product id. When provided, each option
   * shows its on-hand count and zero-stock products are disabled (can't be picked).
   * Pass `undefined` (the default) to keep the picker stock-agnostic.
   */
  stockByProduct?: Map<string, number>;
}

export function ProductPicker({
  value, onChange, label = "Product", exclude = [], size = "small", error, helperText,
  stockByProduct,
}: Props) {
  const { data: products = [], isLoading } = useProducts({ showInactive: false });
  const options = products.filter((p) => !exclude.includes(p.id));

  const stockAware = stockByProduct !== undefined;
  const stockOf = (id: string) => stockByProduct?.get(id) ?? 0;

  return (
    <Autocomplete
      options={options}
      loading={isLoading}
      value={value}
      onChange={(_, v) => onChange(v)}
      getOptionLabel={(p) => productLabel(p)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionDisabled={stockAware ? (p) => stockOf(p.id) <= 0 : undefined}
      renderOption={(props, p) => {
        const qty = stockOf(p.id);
        return (
          <Box component="li" {...props} key={p.id}
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <span>{productLabel(p)}</span>
            {stockAware && (
              <Typography variant="caption"
                color={qty <= 0 ? "error.main" : "text.secondary"}
                sx={{ whiteSpace: "nowrap" }}>
                {qty <= 0 ? "out of stock" : `${qty} in stock`}
              </Typography>
            )}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField {...params} label={label} size={size} error={error} helperText={helperText} />
      )}
    />
  );
}

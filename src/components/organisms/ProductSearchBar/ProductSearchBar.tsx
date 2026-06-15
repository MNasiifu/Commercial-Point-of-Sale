import { useState, useCallback } from "react";
import { Autocomplete, TextField, Box, Typography, Chip, CircularProgress } from "@mui/material";
import CropFreeIcon from "@mui/icons-material/CropFree";

import { getSearchTextFieldInputProps } from "@/components/molecules/SearchTextField";
import { useProductSearch } from "@/hooks/pos/useProductSearch";
import { useBarcodeScanner } from "@/hooks/pos/useBarcodeScanner";
import { useCartStore } from "@/store/cartStore";
import { notify } from "@/store/notificationStore";
import type { ProductSearchResult } from "@/types/database.types";

interface Props {
  disabled?: boolean;
}

function optionLabel(o: ProductSearchResult): string {
  return [o.product_name, o.size_name, o.color_name].filter(Boolean).join(" · ");
}

export function ProductSearchBar({ disabled = false }: Props) {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [scanPulse, setScanPulse] = useState(false);
  const addProduct = useCartStore((s) => s.addProduct);

  const { data: results = [], isFetching } = useProductSearch(query);

  const handleSelect = useCallback((product: ProductSearchResult | null) => {
    if (!product) return;
    if (product.stock_available <= 0) {
      notify.warning(`${product.product_name} is out of stock`);
      return;
    }
    addProduct(product);
    setInputValue("");
    setQuery("");
  }, [addProduct]);

  const handleScan = useCallback(async (barcode: string) => {
    setScanPulse(true);
    setTimeout(() => setScanPulse(false), 600);

    const { supabase } = await import("@/lib/supabase");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc("get_product_by_barcode", {
      p_barcode: barcode,
      p_branch_id: undefined,
    });
    if (!data) {
      notify.warning(`Barcode not found: ${barcode}`);
      return;
    }
    // Map the barcode RPC's jsonb shape onto a ProductSearchResult
    const product: ProductSearchResult = {
      product_id: data.product_id,
      product_name: data.name,
      brand_name: data.brand ?? null,
      garment_type_name: data.garment_type ?? null,
      size_name: data.size ?? null,
      color_name: data.color ?? null,
      barcode,
      pack_size: data.pack_size,
      retail_price: data.retail_price,
      wholesale_price: data.wholesale_price,
      wholesale_threshold: data.wholesale_threshold,
      stock_available: data.stock,
    };
    if (product.stock_available <= 0) {
      notify.warning(`${product.product_name} is out of stock`);
      return;
    }
    addProduct(product);
  }, [addProduct]);

  useBarcodeScanner({ onScan: handleScan, enabled: !disabled });

  return (
    <Autocomplete<ProductSearchResult>
      options={results}
      loading={isFetching}
      inputValue={inputValue}
      onInputChange={(_, v, reason) => {
        setInputValue(v);
        if (reason === "input") setQuery(v);
      }}
      onChange={(_, v) => handleSelect(v)}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(a, b) => a.product_id === b.product_id}
      filterOptions={(x) => x}
      disabled={disabled}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search product or scan barcode…"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: scanPulse ? "success.light" : "background.paper",
              transition: "background-color 0.4s",
            },
          }}
          InputProps={getSearchTextFieldInputProps({
            value: inputValue,
            onClear: () => { setInputValue(""); setQuery(""); },
            inputProps: params.InputProps,
            startAdornment: scanPulse ? <CropFreeIcon fontSize="small" color="success" /> : undefined,
            endAdornment: isFetching ? <CircularProgress size={16} /> : undefined,
          })}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.product_id}>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>{option.product_name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {[option.brand_name, option.size_name, option.color_name].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <Box textAlign="right" ml={2} flexShrink={0}>
            <Typography variant="body2" fontWeight={700} fontFamily="monospace">
              UGX {option.retail_price.toLocaleString()}
            </Typography>
            <Chip
              label={option.stock_available <= 0 ? "Out of stock" : `Stock: ${option.stock_available}`}
              size="small"
              color={option.stock_available <= 0 ? "error" : option.stock_available <= 5 ? "warning" : "success"}
              variant="outlined"
              sx={{ borderRadius: "5px", fontSize: "0.65rem", height: 18 }}
            />
          </Box>
        </Box>
      )}
    />
  );
}

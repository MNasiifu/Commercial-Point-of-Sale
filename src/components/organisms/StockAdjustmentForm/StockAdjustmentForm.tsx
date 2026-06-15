import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  Stack, TextField, ToggleButton, ToggleButtonGroup, FormControl, InputLabel,
  Select, MenuItem, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { ProductPicker } from "@/components/molecules/ProductPicker/ProductPicker";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { useApplyStockAdjustment } from "@/hooks/inventory/useInventoryMutations";
import { useAuth } from "@/hooks/auth/useAuth";
import { ADJUSTMENT_TYPES, ADJUSTMENT_LABELS } from "@/lib/zod-schemas/inventory.schemas";
import type { AdjustmentType } from "@/types/database.types";
import type { ProductWithDetails } from "@/services/productService";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function StockAdjustmentForm({ open, onClose }: Props) {
  const { role, branchId: ownBranch } = useAuth();
  const applyAdj = useApplyStockAdjustment();

  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [direction, setDirection] = useState<"add" | "remove">("remove");
  const [magnitude, setMagnitude] = useState(1);
  const [type, setType] = useState<AdjustmentType>("damage");
  const [reason, setReason] = useState("");

  const effectiveBranch = role === "admin" ? branchId ?? null : ownBranch;
  const valid = !!effectiveBranch && !!product && magnitude > 0 && reason.trim().length >= 3;

  const reset = () => {
    setProduct(null); setDirection("remove"); setMagnitude(1);
    setType("damage"); setReason("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!effectiveBranch || !product) return;
    await applyAdj.mutateAsync({
      branch_id: effectiveBranch,
      product_id: product.id,
      adjustment_type: type,
      quantity: direction === "remove" ? -magnitude : magnitude,
      reason: reason.trim(),
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        New stock adjustment
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {role === "admin" && (
            <BranchSelect value={branchId} onChange={setBranchId} includeAll={false} label="Branch *" />
          )}

          <ProductPicker value={product} onChange={setProduct} label="Product *" />

          <ToggleButtonGroup
            exclusive
            color="primary"
            value={direction}
            onChange={(_, v) => v && setDirection(v)}
            size="small"
            fullWidth
          >
            <ToggleButton value="remove">Remove stock</ToggleButton>
            <ToggleButton value="add">Add stock</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Quantity *"
              type="number"
              size="small"
              fullWidth
              value={magnitude}
              inputProps={{ min: 1, step: 1 }}
              onChange={(e) => setMagnitude(Math.abs(parseInt(e.target.value, 10)) || 0)}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Reason type *</InputLabel>
              <Select value={type} label="Reason type *" onChange={(e) => setType(e.target.value as AdjustmentType)}>
                {ADJUSTMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{ADJUSTMENT_LABELS[t]}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          <TextField
            label="Reason / note *"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {role === "admin" && !effectiveBranch && (
            <Alert severity="info">Select a branch to adjust its stock.</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={applyAdj.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!valid || applyAdj.isPending}>
          {applyAdj.isPending ? "Applying…" : "Apply adjustment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

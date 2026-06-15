import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Button, Chip, Typography, Stack, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, IconButton, Tooltip, Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  useStockTake, useAddStockTakeItem, useUpdateStockTakeItemCount,
  useRemoveStockTakeItem, useCompleteStockTake,
} from "@/hooks/inventory/useStockTakes";
import { ProductPicker } from "@/components/molecules/ProductPicker/ProductPicker";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal";
import { ResponsiveStack, responsiveWidth } from "@/components/molecules/ResponsiveStack";
import { formatDate } from "@/lib/formatters";
import type { StockTakeItemWithDetails } from "@/services/stockTakeService";
import type { StockTakeStatus } from "@/types/database.types";
import type { ProductWithDetails } from "@/services/productService";

const STATUS_COLORS: Record<StockTakeStatus, "default" | "info" | "success" | "error"> = {
  draft: "default", in_progress: "info", completed: "success", cancelled: "error",
};

export function StockTakeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: stockTake, isLoading } = useStockTake(id);
  const addItem = useAddStockTakeItem();
  const updateCount = useUpdateStockTakeItemCount();
  const removeItem = useRemoveStockTakeItem();
  const complete = useCompleteStockTake();

  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StockTakeItemWithDetails | null>(null);

  if (isLoading || !stockTake) {
    return <Typography color="text.secondary">Loading…</Typography>;
  }

  const isEditable = stockTake.status === "draft" || stockTake.status === "in_progress";
  const items = stockTake.stock_take_items ?? [];
  const existingIds = items.map((i) => i.product_id);

  const handleAddItem = () => {
    if (!product || !id) return;
    addItem.mutate(
      { stock_take_id: id, product_id: product.id, branch_id: stockTake.branch_id },
      { onSuccess: () => setProduct(null) },
    );
  };

  const handleComplete = () => {
    if (!id) return;
    if (items.some((i) => i.counted_quantity === null)) return;
    complete.mutate(id, { onSuccess: () => navigate("/inventory/stock-takes") });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate("/inventory/stock-takes")}><ArrowBackIcon /></IconButton>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>Stock Take</Typography>
          <Typography variant="body2" color="text.secondary">
            Started {formatDate(stockTake.started_at)} by {stockTake.started_by_profile?.full_name}
          </Typography>
        </Box>
        <Chip label={stockTake.status.replace("_", " ")} color={STATUS_COLORS[stockTake.status]}
          sx={{ textTransform: "capitalize", fontWeight: 600 }} />
      </Stack>

      {stockTake.notes && (
        <Typography variant="body2" color="text.secondary" mb={2}>Notes: {stockTake.notes}</Typography>
      )}

      {isEditable && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" mb={1.5}>Add product to count</Typography>
          <ResponsiveStack spacing={1.5}>
            <Box sx={{ ...responsiveWidth(320), flex: 1 }}>
              <ProductPicker value={product} onChange={setProduct} exclude={existingIds} />
            </Box>
            <Button variant="contained" size="small" onClick={handleAddItem}
              disabled={!product || addItem.isPending} sx={responsiveWidth()}>
              Add
            </Button>
          </ResponsiveStack>
        </Paper>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>System Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Counted Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Variance</TableCell>
              {isEditable && <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.disabled" py={3}>
                    No items yet. Add products above to begin counting.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <StockTakeItemRow
                key={item.id}
                item={item}
                editable={isEditable}
                onUpdate={(qty, notes) => updateCount.mutate({ itemId: item.id, countedQuantity: qty, notes })}
                onRemove={() => setDeleteConfirm(item)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {isEditable && items.length > 0 && (
        <Box mt={3}>
          {items.some((i) => i.counted_quantity === null) && (
            <Alert severity="info" sx={{ mb: 2 }}>Enter counted quantities for all items before completing.</Alert>
          )}
          <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={handleComplete}
            disabled={complete.isPending || items.some((i) => i.counted_quantity === null)}>
            {complete.isPending ? "Completing…" : "Complete Stock Take"}
          </Button>
        </Box>
      )}

      <DeleteConfirmationModal
        open={!!deleteConfirm}
        title="Remove item from stock take?"
        itemName={deleteConfirm ? deleteConfirm.products?.name ?? "Item" : ""}
        description="You are about to remove"
        warningMessage="This will discard the count for this product. This action cannot be undone."
        isPending={removeItem.isPending}
        onConfirm={() => deleteConfirm && removeItem.mutate(deleteConfirm.id, { onSuccess: () => setDeleteConfirm(null) })}
        onClose={() => setDeleteConfirm(null)}
        confirmButtonText="Remove"
      />
    </Box>
  );
}

function StockTakeItemRow({ item, editable, onUpdate, onRemove }: {
  item: StockTakeItemWithDetails;
  editable: boolean;
  onUpdate: (qty: number, notes?: string) => void;
  onRemove: () => void;
}) {
  const [counted, setCounted] = useState<string>(
    item.counted_quantity !== null ? String(item.counted_quantity) : "",
  );

  const handleBlur = () => {
    const val = parseFloat(counted);
    if (!isNaN(val) && val !== item.counted_quantity) onUpdate(val);
  };

  const variance = item.variance ?? null;
  const varianceColor = variance === null ? "text.disabled" : variance === 0 ? "success.main" : "error.main";
  const sub = [item.products?.sizes?.name, item.products?.colors?.name].filter(Boolean).join(" · ");

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{item.products?.name ?? "—"}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontFamily="monospace">{item.system_quantity}</Typography>
      </TableCell>
      <TableCell align="right">
        {editable ? (
          <TextField value={counted} onChange={(e) => setCounted(e.target.value)} onBlur={handleBlur}
            type="number" size="small" sx={{ width: 90 }}
            inputProps={{ style: { textAlign: "right", fontFamily: "monospace" } }} />
        ) : (
          <Typography variant="body2" fontFamily="monospace">{item.counted_quantity ?? "—"}</Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontWeight={700} fontFamily="monospace" color={varianceColor}>
          {variance !== null ? (variance > 0 ? `+${variance}` : variance) : "—"}
        </Typography>
      </TableCell>
      {editable && (
        <TableCell align="center">
          <Tooltip title="Remove" arrow>
            <IconButton size="small" color="error" onClick={onRemove}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
}

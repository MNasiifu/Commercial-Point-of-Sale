import { useState } from "react";
import {
  Alert, Box, Button, Typography, Stack, Paper, TextField, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import { ProductPicker } from "@/components/molecules/ProductPicker/ProductPicker";
import { useReceiveStock } from "@/hooks/inventory/useInventoryMutations";
import { useBranchesList } from "@/hooks/inventory/useInventory";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatUGX } from "@/lib/formatters";
import type { ProductWithDetails } from "@/services/productService";

interface ReceivingLine {
  _id: string;
  product: ProductWithDetails | null;
  quantity: number;
  cost_price_per_unit: number;
}

let counter = 0;
const newLine = (): ReceivingLine => ({
  _id: `line-${counter++}`,
  product: null,
  quantity: 1,
  cost_price_per_unit: 0,
});

// Today's date as yyyy-mm-dd in the user's local timezone (so an
// early-morning Kampala receiving isn't stamped to the previous UTC day).
const todayISO = (): string => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

interface Props {
  onDone?: () => void;
}

export function StockReceivingForm({ onDone }: Props) {
  const { role, branchId: userBranchId } = useAuth();
  const { data: branches = [] } = useBranchesList();
  const receive = useReceiveStock();

  const mainStore = branches.find((b) => b.is_main_store) ?? null;
  const canReceive = role === "admin" || (mainStore?.id === userBranchId);

  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [receivedDate, setReceivedDate] = useState(todayISO());
  const [lines, setLines] = useState<ReceivingLine[]>([newLine()]);

  const total = lines.reduce((s, l) => s + l.quantity * l.cost_price_per_unit, 0);
  const usedIds = lines.map((l) => l.product?.id).filter(Boolean) as string[];

  const setLine = (id: string, patch: Partial<ReceivingLine>) =>
    setLines((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));

  const valid =
    !!mainStore &&
    !!receivedDate &&
    lines.length > 0 &&
    lines.every((l) => l.product && l.quantity > 0) &&
    lines.some((l) => l.product);

  const handleSubmit = async () => {
    if (!mainStore) return;
    const items = lines
      .filter((l) => l.product && l.quantity > 0)
      .map((l) => ({
        product_id: l.product!.id,
        quantity: l.quantity,
        cost_price_per_unit: l.cost_price_per_unit,
      }));
    await receive.mutateAsync({
      branch_id: mainStore.id,
      reference: reference || null,
      notes: notes || null,
      received_date: receivedDate || null,
      items,
    });
    onDone?.();
  };

  if (!canReceive) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Stock is received into the <strong>main store</strong> only. Ask an admin or the main-store
        manager to receive new stock, then transfer it to your branch.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={2}>
        <WarehouseIcon color="primary" />
        <Box>
          <Typography variant="h6" fontWeight={700}>Receive Stock</Typography>
          <Typography variant="body2" color="text.secondary">
            New stock enters the main store{mainStore ? ` — ${mainStore.name}` : ""}, then is transferred to branches.
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField label="Date received" type="date" size="small" fullWidth
            value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="When the stock arrived"
            sx={{ maxWidth: { sm: 200 } }} />
          <TextField label="Reference (optional)" size="small" fullWidth
            placeholder="Supplier invoice / delivery note"
            value={reference} onChange={(e) => setReference(e.target.value)} />
          <TextField label="Notes (optional)" size="small" fullWidth
            value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 260 }}>Product</TableCell>
              <TableCell align="right" sx={{ width: 110 }}>Quantity</TableCell>
              <TableCell align="right" sx={{ width: 150 }}>Cost / unit (UGX)</TableCell>
              <TableCell align="right" sx={{ width: 140 }}>Line total</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l._id}>
                <TableCell>
                  <ProductPicker
                    value={l.product}
                    onChange={(p) => setLine(l._id, { product: p })}
                    exclude={usedIds.filter((id) => id !== l.product?.id)}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField type="number" size="small" value={l.quantity}
                    inputProps={{ min: 1, step: 1, style: { textAlign: "right" } }}
                    onChange={(e) => setLine(l._id, { quantity: parseInt(e.target.value, 10) || 0 })} />
                </TableCell>
                <TableCell align="right">
                  <TextField type="number" size="small" value={l.cost_price_per_unit}
                    inputProps={{ min: 0, step: 100, style: { textAlign: "right" } }}
                    onChange={(e) => setLine(l._id, { cost_price_per_unit: parseFloat(e.target.value) || 0 })} />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontFamily="monospace">
                    {formatUGX(l.quantity * l.cost_price_per_unit)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((x) => x._id !== l._id))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={2}>
        <Button startIcon={<AddIcon />} variant="outlined" size="small"
          onClick={() => setLines((prev) => [...prev, newLine()])}>
          Add line
        </Button>
        <Box display="flex" alignItems="center" gap={3}>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Total cost</Typography>
            <Typography variant="h6" fontWeight={700} fontFamily="monospace">{formatUGX(total)}</Typography>
          </Box>
          <Button variant="contained" disabled={!valid || receive.isPending} onClick={handleSubmit}>
            {receive.isPending ? "Receiving…" : "Receive stock"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

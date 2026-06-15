import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Stack,
  TextField, FormControl, InputLabel, Select, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, Box, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { ProductPicker } from "@/components/molecules/ProductPicker/ProductPicker";
import { useBranchesList, useProductStock } from "@/hooks/inventory/useInventory";
import { useCreateTransfer } from "@/hooks/inventory/useTransfers";
import { useAuth } from "@/hooks/auth/useAuth";
import type { ProductWithDetails } from "@/services/productService";

interface Line {
  _id: string;
  product: ProductWithDetails | null;
  quantity: number;
}

let counter = 0;
const newLine = (): Line => ({ _id: `t-${counter++}`, product: null, quantity: 1 });

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TransferForm({ open, onClose }: Props) {
  const { role, branchId: ownBranch } = useAuth();
  const { data: branches = [] } = useBranchesList();
  const create = useCreateTransfer();

  const mainStore = branches.find((b) => b.is_main_store) ?? null;
  const defaultFrom = role === "admin" ? mainStore?.id ?? "" : ownBranch ?? "";

  const [fromBranchId, setFromBranchId] = useState<string>(defaultFrom);
  const [toBranchId, setToBranchId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);

  // Branches load after mount, so the initial useState default is "" for admins.
  // Once they arrive, default the source to the main store — but only while it's
  // still unset, so a manual pick by the admin is never overwritten.
  useEffect(() => {
    if (role === "admin" && !fromBranchId && mainStore) {
      setFromBranchId(mainStore.id);
    }
  }, [role, fromBranchId, mainStore]);

  // Keep fromBranch in sync once branches load (non-admin is locked to own branch)
  const effectiveFrom = role === "admin" ? fromBranchId : ownBranch ?? "";

  const destinations = useMemo(
    () => branches.filter((b) => b.id !== effectiveFrom),
    [branches, effectiveFrom],
  );

  // On-hand stock at the SOURCE branch — the ceiling for every transferred line.
  // Only fetch once a source branch is known (an empty id would query all branches).
  const { data: stockRows = [] } = useProductStock(
    { showOutOfStock: true },
    effectiveFrom || null,
    { enabled: !!effectiveFrom },
  );
  const stockByProduct = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of stockRows) m.set(r.product_id, r.quantity);
    return m;
  }, [stockRows]);
  const availableFor = (p: ProductWithDetails | null) =>
    p ? stockByProduct.get(p.id) ?? 0 : 0;

  const usedIds = lines.map((l) => l.product?.id).filter(Boolean) as string[];
  const setLine = (id: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l._id === id ? { ...l, ...patch } : l)));

  // A line is over-stock when its quantity exceeds what the source branch holds.
  const isOverStock = (l: Line) => !!l.product && l.quantity > availableFor(l.product);

  const valid =
    !!effectiveFrom && !!toBranchId && effectiveFrom !== toBranchId &&
    lines.some((l) => l.product && l.quantity > 0) &&
    lines.every((l) => !l.product || l.quantity > 0) &&
    lines.every((l) => !isOverStock(l));

  const reset = () => { setToBranchId(""); setNotes(""); setLines([newLine()]); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    const items = lines
      .filter((l) => l.product && l.quantity > 0)
      .map((l) => ({ product_id: l.product!.id, quantity: l.quantity }));
    await create.mutateAsync({
      from_branch_id: effectiveFrom,
      to_branch_id: toBranchId,
      notes: notes || null,
      items,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        New stock transfer
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" fullWidth disabled={role !== "admin"}>
              <InputLabel>From *</InputLabel>
              <Select value={effectiveFrom} label="From *" onChange={(e) => setFromBranchId(e.target.value)}>
                {branches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}{b.is_main_store ? " (Main)" : ""}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>To *</InputLabel>
              <Select value={toBranchId} label="To *" onChange={(e) => setToBranchId(e.target.value)}>
                {destinations.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}{b.is_main_store ? " (Main)" : ""}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Alert severity="info" sx={{ py: 0.25 }}>
            Sending deducts stock from the source immediately. The destination branch confirms receipt to add it to their stock.
          </Alert>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 220 }}>Product</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>Quantity</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((l) => {
                const available = availableFor(l.product);
                const over = isOverStock(l);
                return (
                <TableRow key={l._id} sx={{ "& > td": { verticalAlign: "top" } }}>
                  <TableCell>
                    <ProductPicker value={l.product} onChange={(p) => setLine(l._id, { product: p })}
                      exclude={usedIds.filter((id) => id !== l.product?.id)}
                      stockByProduct={stockByProduct} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField type="number" size="small" fullWidth value={l.quantity}
                      error={over}
                      slotProps={{ formHelperText: { sx: { whiteSpace: "nowrap" } } }}
                      helperText={
                        l.product
                          ? over
                            ? `Only ${available} available`
                            : `Available: ${available}`
                          : " "
                      }
                      inputProps={{
                        min: 1, step: 1, style: { textAlign: "right" },
                        max: l.product ? available : undefined,
                      }}
                      onChange={(e) => {
                        const raw = parseInt(e.target.value, 10) || 0;
                        // Hard-cap the entry at what the source branch can supply.
                        const capped = l.product ? Math.min(raw, available) : raw;
                        setLine(l._id, { quantity: capped });
                      }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" disabled={lines.length === 1}
                      onClick={() => setLines((prev) => prev.filter((x) => x._id !== l._id))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box>
            <Button startIcon={<AddIcon />} variant="outlined" size="small"
              onClick={() => setLines((prev) => [...prev, newLine()])}>
              Add line
            </Button>
          </Box>

          <TextField label="Notes (optional)" size="small" fullWidth multiline minRows={2}
            value={notes} onChange={(e) => setNotes(e.target.value)} />

          <Typography variant="caption" color="text.secondary">
            Tip: a branch returning stock to the main store is just a transfer with the branch as the source.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={create.isPending}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!valid || create.isPending}>
          {create.isPending ? "Sending…" : "Send transfer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

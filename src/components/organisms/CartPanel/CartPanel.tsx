import {
  Box, Chip, Divider, IconButton, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Typography, TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import { useCartStore } from "@/store/cartStore";
import { formatUGX } from "@/lib/formatters";

interface Props {
  disabled?: boolean;
}

export function CartPanel({ disabled = false }: Props) {
  const lines = useCartStore((s) => s.lines);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const grandTotal = useCartStore((s) => s.grandTotal());
  const itemCount = useCartStore((s) => s.itemCount());

  if (lines.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
        height="100%" gap={2} color="text.disabled">
        <ShoppingCartIcon sx={{ fontSize: 56, opacity: 0.3 }} />
        <Typography variant="body2" color="text.disabled">
          Cart is empty — scan a barcode or search above
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box flex={1} overflow="auto">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="center" width={120}>Packs</TableCell>
              <TableCell align="right" width={120}>Total</TableCell>
              <TableCell width={36} />
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((l) => {
              const sub = [l.sizeName, l.colorName].filter(Boolean).join(" · ");
              const toWholesale = l.tier === "retail" ? l.wholesaleThreshold - l.quantity : 0;
              return (
                <TableRow key={l.productId} hover>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <Typography variant="body2" fontWeight={600} lineHeight={1.3}>{l.productName}</Typography>
                      {l.tier === "wholesale" && (
                        <Chip label="Wholesale" size="small" color="success" variant="outlined"
                          sx={{ borderRadius: "5px", fontSize: "0.6rem", height: 18 }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {sub ? `${sub} · ` : ""}
                      {formatUGX(l.unitPrice)} each
                      {l.packSize > 1 ? ` · ${l.packSize}-pc pack` : ""}
                    </Typography>
                    {toWholesale > 0 && l.wholesalePrice > 0 && (
                      <Typography variant="caption" color="success.main" display="block">
                        Add {toWholesale} more for wholesale price
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                      <IconButton size="small" onClick={() => updateQty(l.productId, l.quantity - 1)} disabled={disabled}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <TextField
                        value={l.quantity}
                        type="number"
                        size="small"
                        inputProps={{ min: 1, style: { textAlign: "center", padding: "2px 4px", width: 40 } }}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v > 0) updateQty(l.productId, v);
                        }}
                        disabled={disabled}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                      />
                      <IconButton size="small" onClick={() => updateQty(l.productId, l.quantity + 1)} disabled={disabled}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  </TableCell>

                  <TableCell align="right" sx={{ py: 0.75 }}>
                    <Typography variant="body2" fontWeight={600} fontFamily="monospace">{formatUGX(l.lineTotal)}</Typography>
                  </TableCell>

                  <TableCell sx={{ py: 0.5 }}>
                    <Tooltip title="Remove" arrow>
                      <IconButton size="small" color="error" onClick={() => removeLine(l.productId)} disabled={disabled}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>

      <Box>
        <Divider />
        <Box px={2} pt={1.5} pb={1}>
          <Stack spacing={0.5}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{itemCount} pack(s)</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={700} fontFamily="monospace" color="primary.main">
                {formatUGX(grandTotal)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

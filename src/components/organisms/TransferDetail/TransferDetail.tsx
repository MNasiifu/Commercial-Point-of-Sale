import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import { useTransfer, useConfirmTransfer, useCancelTransfer } from "@/hooks/inventory/useTransfers";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatDateTime } from "@/lib/formatters";
import { TRANSFER_STATUS_COLOR } from "@/components/organisms/TransferTable/TransferTable";

export function TransferDetail({ transferId }: { transferId: string }) {
  const navigate = useNavigate();
  const { role, branchId: ownBranch } = useAuth();
  const { data: transfer, isLoading, isError } = useTransfer(transferId);
  const confirm = useConfirmTransfer();
  const cancel = useCancelTransfer();

  // Per-item received quantity overrides (only used while confirming)
  const [received, setReceived] = useState<Record<string, number>>({});

  if (isLoading) {
    return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;
  }
  if (isError || !transfer) {
    return (
      <Box>
        <IconButton size="small" onClick={() => navigate("/inventory/transfers")} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Alert severity="error" sx={{ borderRadius: 2 }}>Transfer not found.</Alert>
      </Box>
    );
  }

  const isSent = transfer.status === "sent";
  const canConfirm = isSent && (role === "admin" || transfer.to_branch_id === ownBranch);
  const canCancel = isSent && (role === "admin" || transfer.from_branch_id === ownBranch);

  const handleConfirm = async () => {
    const items = transfer.items.map((it) => ({
      item_id: it.id,
      quantity_received: received[it.id] ?? it.quantity_sent,
    }));
    await confirm.mutateAsync({ transfer_id: transfer.id, items });
    navigate("/inventory/transfers");
  };

  const handleCancel = async () => {
    await cancel.mutateAsync(transfer.id);
    navigate("/inventory/transfers");
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3} flexWrap="wrap">
        <Tooltip title="Back to transfers" arrow>
          <IconButton size="small" onClick={() => navigate("/inventory/transfers")}><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700} fontFamily="monospace">{transfer.transfer_number}</Typography>
            <Chip label={transfer.status} size="small" color={TRANSFER_STATUS_COLOR[transfer.status]}
              variant={transfer.status === "received" ? "filled" : "outlined"}
              sx={{ borderRadius: "6px", textTransform: "capitalize" }} />
          </Box>
          <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
            <Typography variant="body2" color="text.secondary">{transfer.from_branch?.name}</Typography>
            <SwapHorizIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>{transfer.to_branch?.name}</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          {canCancel && (
            <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />}
              disabled={cancel.isPending} onClick={handleCancel}>
              Cancel transfer
            </Button>
          )}
          {canConfirm && (
            <Button variant="contained" size="small" startIcon={<CheckCircleIcon />}
              disabled={confirm.isPending} onClick={handleConfirm}>
              {confirm.isPending ? "Confirming…" : "Confirm receipt"}
            </Button>
          )}
        </Stack>
      </Box>

      {canConfirm && (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
          Check the quantities you actually received. Adjust any that arrived short or damaged, then confirm —
          received quantities are added to {transfer.to_branch?.name}'s stock.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Received</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transfer.items.map((it) => {
                const sub = [it.size_name, it.color_name].filter(Boolean).join(" · ");
                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{it.product_name}</Typography>
                      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">{it.quantity_sent}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {canConfirm ? (
                        <TextField type="number" size="small" sx={{ width: 100 }}
                          value={received[it.id] ?? it.quantity_sent}
                          inputProps={{ min: 0, max: it.quantity_sent, step: 1, style: { textAlign: "right" } }}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(it.quantity_sent, parseInt(e.target.value, 10) || 0));
                            setReceived((prev) => ({ ...prev, [it.id]: v }));
                          }} />
                      ) : (
                        <Typography variant="body2" fontFamily="monospace"
                          color={it.quantity_received !== null && it.quantity_received < it.quantity_sent ? "warning.main" : "text.primary"}>
                          {it.quantity_received ?? "—"}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {transfer.notes && (
          <>
            <Divider />
            <Box px={2.5} py={1.5}>
              <Typography variant="caption" color="text.secondary">Notes</Typography>
              <Typography variant="body2">{transfer.notes}</Typography>
            </Box>
          </>
        )}
        <Divider />
        <Box px={2.5} py={1.5} display="flex" gap={4} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">Sent</Typography>
            <Typography variant="body2">{transfer.sent_at ? formatDateTime(transfer.sent_at) : "—"}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Received</Typography>
            <Typography variant="body2">{transfer.received_at ? formatDateTime(transfer.received_at) : "—"}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

import { useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import CellTowerIcon from "@mui/icons-material/CellTower";

import { formatUGX } from "@/lib/formatters";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal";
import { notify } from "@/store/notificationStore";
import type { PaymentEntry } from "@/hooks/pos/useCompleteSale";
import type { PaymentMethod } from "@/types/database.types";

interface Props {
  grandTotal: number;
  onConfirm: (payments: PaymentEntry[], amountTendered: number) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: React.ReactNode; color: string }
> = {
  cash: { label: "Cash", icon: <LocalAtmIcon />, color: "#2E7D32" },
  mtn_momo: { label: "MTN MoMo", icon: <PhoneAndroidIcon />, color: "#F57F17" },
  airtel_money: {
    label: "Airtel Money",
    icon: <CellTowerIcon />,
    color: "#C62828",
  },
};

interface PaymentLine {
  id: string;
  method: PaymentMethod;
  amount: string;
  reference: string;
}

function newPaymentLine(method: PaymentMethod, amount = ""): PaymentLine {
  return {
    id: Math.random().toString(36).slice(2),
    method,
    amount,
    reference: "",
  };
}

export function PaymentPanel({
  grandTotal,
  onConfirm,
  isSubmitting,
  disabled = false,
}: Props) {
  const [primaryMethod, setPrimaryMethod] = useState<PaymentMethod>("cash");
  const [primaryAmount, setPrimaryAmount] = useState<string>(
    String(grandTotal),
  );
  const [primaryReference, setPrimaryReference] = useState<string>("");
  const [splitLines, setSplitLines] = useState<PaymentLine[]>([]);
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Calculate primary payment amount
  const primaryAmountValue = parseFloat(primaryAmount) || 0;

  // Calculate change only for cash
  const change =
    primaryMethod === "cash" ? Math.max(0, primaryAmountValue - grandTotal) : 0;

  // Total from split payments
  const splitPaymentTotal = splitLines.reduce(
    (s, l) => s + (parseFloat(l.amount) || 0),
    0,
  );

  // Validation
  const isPrimaryValid =
    primaryAmountValue > 0 &&
    (primaryMethod === "cash" ||
      (primaryReference.trim().length > 0 && primaryAmountValue > 0));

  const areSplitsValid = splitLines.every(
    (l) =>
      parseFloat(l.amount) > 0 &&
      (l.method === "cash" || l.reference.trim().length > 0),
  );

  const isValid = isPrimaryValid && areSplitsValid;

  const updateSplitLine = (id: string, patch: Partial<PaymentLine>) =>
    setSplitLines((prev) => {
      const updatedLines = prev.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      );

      // If method is being changed to/from cash, update cashReceived
      if (patch.method) {
        const lineToUpdate = prev.find((l) => l.id === id);
        const oldAmount = parseFloat(lineToUpdate?.amount || "0") || 0;
        const wasCash = lineToUpdate?.method === "cash";
        const isCashNow = patch.method === "cash";

        if (wasCash && !isCashNow) {
          // Removing cash: subtract old amount
          setCashReceived((prev) => Math.max(0, prev - oldAmount));
        } else if (!wasCash && isCashNow) {
          // Adding cash: add current amount
          setCashReceived((prev) => prev + oldAmount);
        }
      }

      return updatedLines;
    });

  const removeSplitLine = (id: string) => {
    setSplitLines((prev) => {
      const lineToRemove = prev.find((l) => l.id === id);
      if (lineToRemove && lineToRemove.method === "cash") {
        // Update cashReceived by removing the cash amount from the deleted line
        const removedAmount = parseFloat(lineToRemove.amount) || 0;
        setCashReceived((prev) => Math.max(0, prev - removedAmount));
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  const addSplitLine = () =>
    setSplitLines((prev) => [...prev, newPaymentLine("mtn_momo")]);

  const handleConfirm = () => {
    if (!isValid) return;

    const cashPaid =
      primaryMethod === "cash"
        ? splitLines.length === 0
          ? grandTotal
          : primaryAmountValue
        : 0;

    const primaryEntry: PaymentEntry[] =
      cashPaid > 0
        ? [
            {
              method: "cash",
              amount: cashPaid,
              reference_number: null,
            },
          ]
        : [
            {
              method: primaryMethod,
              amount: primaryAmountValue,
              reference_number: primaryReference.trim() || null,
            },
          ];

    const payments: PaymentEntry[] = [
      ...primaryEntry,
      ...splitLines.map((l) => ({
        method: l.method,
        amount: parseFloat(l.amount) || 0,
        reference_number:
          l.method === "cash" ? null : l.reference.trim() || null,
      })),
    ];

    // Validate total payments >= grandTotal
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPayments < grandTotal) {
      const shortfall = grandTotal - totalPayments;
      notify.error(`Insufficient payment. Short by ${formatUGX(shortfall)}`);
      return;
    }

    // Calculate total cash received (primary cash + split cash payments)
    const splitCashTotal = splitLines
      .filter((l) => l.method === "cash")
      .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    const amountTendered =
      (primaryMethod === "cash" ? cashReceived : 0) + splitCashTotal;

    onConfirm(payments, amountTendered);
  };

  return (
    <Stack spacing={2} height="100%" justifyContent="space-between">
      <Box>
        {/* Grand Total Display */}
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            AMOUNT DUE
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            color="primary.main"
            sx={{ fontFamily: "monospace" }}
          >
            {formatUGX(grandTotal)}
          </Typography>
        </Box>

        {/* Primary Payment Method Tabs */}
        <Typography variant="subtitle2" fontWeight={600} mb={1}>
          Primary Payment Method
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={primaryMethod}
          onChange={(_, v) => {
            if (v) {
              setPrimaryMethod(v);
              // Update cashReceived when switching payment methods
              if (v === "cash") {
                // Switch to cash: set cashReceived to current primaryAmount
                setCashReceived(parseFloat(primaryAmount) || 0);
              } else {
                // Switch away from cash: only include split cash payments
                const splitCashTotal = splitLines
                  .filter((l) => l.method === "cash")
                  .reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
                setCashReceived(splitCashTotal);
              }
            }
          }}
          fullWidth
          disabled={disabled || isSubmitting}
          sx={{ mb: 2 }}
        >
          {(
            Object.entries(METHOD_CONFIG) as [
              PaymentMethod,
              (typeof METHOD_CONFIG)[PaymentMethod],
            ][]
          ).map(([key, cfg]) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                flex: 1,
                fontSize: "0.85rem",
                gap: 0.5,
                py: 1.5,
                "&.Mui-selected": {
                  bgcolor: cfg.color + "18",
                  color: cfg.color,
                  borderColor: cfg.color + "80",
                  fontWeight: 700,
                },
              }}
            >
              {cfg.icon}
              {cfg.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Primary Payment Input - CASH */}
        {primaryMethod === "cash" && (
          <>
            <TextField
              label="Cash Received (UGX)"
              type="number"
              fullWidth
              size="medium"
              value={primaryAmount}
              onChange={(e) => {
                setPrimaryAmount(e.target.value);
                // Update cashReceived when primary method is cash
                if (primaryMethod === "cash") {
                  setCashReceived(parseFloat(e.target.value) || 0);
                }
              }}
              disabled={disabled || isSubmitting}
              inputProps={{ min: 0, step: 500 }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  fontSize: "1.1rem",
                  fontFamily: "monospace",
                  fontWeight: 700,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalAtmIcon sx={{ color: "#2E7D32", mr: 0.5 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Change Display Section */}
            <Box
              sx={{
                bgcolor: "rgba(46, 125, 50, 0.08)",
                border: "2px solid rgba(46, 125, 50, 0.4)",
                borderRadius: 1,
                p: 1.5,
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                display="block"
                mb={0.5}
              >
                CHANGE DUE
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#2E7D32"
                sx={{ fontFamily: "monospace", fontSize: "1.5rem" }}
              >
                {formatUGX(change)}
              </Typography>
            </Box>
          </>
        )}

        {/* Primary Payment Input - MTN/AIRTEL */}
        {(primaryMethod === "mtn_momo" || primaryMethod === "airtel_money") && (
          <>
            <Stack direction="row" spacing={1} mb={2}>
              <TextField
                label="Amount (UGX)"
                type="number"
                size="medium"
                value={primaryAmount}
                onChange={(e) => setPrimaryAmount(e.target.value)}
                disabled={disabled || isSubmitting}
                inputProps={{ min: 0, step: 500 }}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="caption" color="text.secondary">
                        UGX
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Phone / Reference"
                size="medium"
                value={primaryReference}
                onChange={(e) => setPrimaryReference(e.target.value)}
                disabled={disabled || isSubmitting}
                placeholder="0771234567"
                sx={{ flex: 1 }}
              />
            </Stack>
          </>
        )}

        {/* Split Payments Section */}
        {splitLines.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Additional payment method{splitLines.length > 1 ? "s" : ""}
            </Typography>

            <Stack spacing={1.5}>
              {splitLines.map((line) => (
                <Box key={line.id}>
                  {/* Method selector */}
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={line.method}
                    onChange={(_, v) => {
                      if (v) {
                        updateSplitLine(line.id, { method: v });
                      }
                    }}
                    fullWidth
                    disabled={disabled || isSubmitting}
                    sx={{ mb: 1 }}
                  >
                    {(
                      Object.entries(METHOD_CONFIG) as [
                        PaymentMethod,
                        (typeof METHOD_CONFIG)[PaymentMethod],
                      ][]
                    ).map(([key, cfg]) => (
                      <ToggleButton
                        key={key}
                        value={key}
                        sx={{
                          flex: 1,
                          fontSize: "0.7rem",
                          gap: 0.5,
                          "&.Mui-selected": {
                            bgcolor: cfg.color + "18",
                            color: cfg.color,
                            borderColor: cfg.color + "80",
                          },
                        }}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Amount (UGX)"
                      type="number"
                      size="small"
                      value={line.amount}
                      onChange={(e) => {
                        updateSplitLine(line.id, { amount: e.target.value });
                        // Update cashReceived if this is a cash split payment
                        if (line.method === "cash") {
                          const updatedAmount = parseFloat(e.target.value) || 0;
                          const otherCashTotal = splitLines
                            .filter(
                              (l) => l.id !== line.id && l.method === "cash",
                            )
                            .reduce(
                              (sum, l) => sum + (parseFloat(l.amount) || 0),
                              0,
                            );
                          const primaryCash =
                            primaryMethod === "cash" ? primaryAmountValue : 0;
                          setCashReceived(
                            primaryCash + otherCashTotal + updatedAmount,
                          );
                        }
                      }}
                      disabled={disabled || isSubmitting}
                      inputProps={{ min: 0, step: 500 }}
                      sx={{ flex: 1 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              UGX
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {line.method !== "cash" && (
                      <TextField
                        label="Phone / Ref"
                        size="small"
                        value={line.reference}
                        onChange={(e) =>
                          updateSplitLine(line.id, {
                            reference: e.target.value,
                          })
                        }
                        disabled={disabled || isSubmitting}
                        placeholder="0771234567"
                        sx={{ flex: 1 }}
                      />
                    )}

                    <Tooltip title="Remove" arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirm(line.id)}
                        disabled={isSubmitting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {splitLines.length < 2 && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addSplitLine}
            disabled={disabled || isSubmitting}
            sx={{ mt: splitLines.length > 0 ? 1 : 2 }}
          >
            Add payment method (split)
          </Button>
        )}
      </Box>

      {/* Summary & Confirm */}
      <Box>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={0.75}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Amount due
            </Typography>
            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
              {formatUGX(grandTotal)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {METHOD_CONFIG[primaryMethod].label}
            </Typography>
            <Typography
              variant="body2"
              fontFamily="monospace"
              color={primaryAmountValue > 0 ? "success.main" : "text.primary"}
              fontWeight={600}
            >
              {formatUGX(primaryAmountValue)}
            </Typography>
          </Box>
          {splitPaymentTotal > 0 && (
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Split payments
              </Typography>
              <Typography
                variant="body2"
                fontFamily="monospace"
                fontWeight={600}
              >
                {formatUGX(splitPaymentTotal)}
              </Typography>
            </Box>
          )}
          {change > 0 && (
            <Box
              display="flex"
              justifyContent="space-between"
              bgcolor="rgba(46, 125, 50, 0.1)"
              px={1}
              py={0.75}
              borderRadius={1}
              border="1px solid rgba(46, 125, 50, 0.3)"
            >
              <Typography variant="subtitle2" color="#2E7D32" fontWeight={600}>
                Change
              </Typography>
              <Typography
                variant="subtitle2"
                fontFamily="monospace"
                color="#2E7D32"
                fontWeight={700}
              >
                {formatUGX(change)}
              </Typography>
            </Box>
          )}
        </Stack>

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!isValid || isSubmitting || disabled}
          onClick={handleConfirm}
          sx={{ mt: 2, py: 1.5, fontSize: "1rem", fontWeight: 700 }}
        >
          {isSubmitting
            ? "Processing…"
            : `Confirm Sale · ${formatUGX(grandTotal)}`}
        </Button>

        {/* Delete confirmation modal */}
        <DeleteConfirmationModal
          open={deleteConfirm !== null}
          title="Remove payment line?"
          itemName={
            deleteConfirm
              ? splitLines.find((l) => l.id === deleteConfirm)?.method === "cash"
                ? "Cash payment"
                : "Mobile money payment"
              : ""
          }
          description="You are about to remove"
          warningMessage="This payment method will be removed from the split payment."
          isPending={false}
          onConfirm={() => {
            if (deleteConfirm) {
              removeSplitLine(deleteConfirm);
              setDeleteConfirm(null);
            }
          }}
          onClose={() => setDeleteConfirm(null)}
          confirmButtonText="Remove"
        />
      </Box>
    </Stack>
  );
}

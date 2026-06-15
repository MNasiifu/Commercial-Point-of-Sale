import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { formatUGX } from "@/lib/formatters";
import { receiptToHtml } from "@/lib/receipt";
import { printReceiptHtml } from "@/lib/thermal-print";
import { notify } from "@/store/notificationStore";
import type { ReceiptData } from "@/lib/receipt";
import { Branch } from "@/types/database.types";
import logo from "@/assets/images/logo.png";

interface Props {
  open: boolean;
  branchDetails: Branch | null;
  receipt: ReceiptData | null;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptDialog({
  open,
  branchDetails,
  receipt,
  onClose,
  onNewSale,
}: Props) {
  if (!receipt) return null;

  const handlePrint = async () => {
    try {
      await printReceiptHtml(receiptToHtml(receipt));
    } catch (e) {
      notify.error("Print failed — please try again");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircleIcon color="success" />
          <Typography variant="h6" fontWeight={700}>
            Sale Complete
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={0.5}
        >
          {receipt.saleNumber} · {receipt.dateTime}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Inline receipt preview */}
        <Box
          sx={{
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            bgcolor: "#fff",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            p: 1.5,
            mt: 1,
          }}
        >
          {/* Logo */}
          <Box display="flex" justifyContent="center" mb={1}>
            <img
              src={logo}
              alt="Company Logo"
              style={{
                height: "70px",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </Box>

          <Typography
            align="center"
            fontWeight={700}
            fontSize="13px"
            fontFamily="inherit"
            mb={0.5}
          >
            {branchDetails?.name ?? "DAS"}
          </Typography>
          <Typography
            align="center"
            fontSize="10px"
            fontFamily="inherit"
            color="text.secondary"
          >
            {branchDetails?.address?.split("\n").map((l, i) => (
              <span key={i}>
                {l}
                <br />
              </span>
            ))}
            {branchDetails?.email}
            <br />
            Tel: {branchDetails?.phone}
            {/* TODO: Display TIN Number after EFRIS integration */}
            {/* TIN: {receipt.tin} */}
          </Typography>

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />

          {receipt.customerName && (
            <Box display="flex" justifyContent="space-between">
              <Typography fontSize="inherit" fontFamily="inherit">
                Customer
              </Typography>
              <Typography fontSize="inherit" fontFamily="inherit">
                {receipt.customerName}
              </Typography>
            </Box>
          )}
          <Box display="flex" justifyContent="space-between">
            <Typography fontSize="inherit" fontFamily="inherit">
              Teller
            </Typography>
            <Typography fontSize="inherit" fontFamily="inherit">
              {receipt.tellerName}
            </Typography>
          </Box>

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />

          {receipt.lines.map((l, i) => (
            <Box
              key={i}
              display="flex"
              justifyContent="space-between"
              mb={0.25}
            >
              <Box>
                <Typography
                  fontSize="inherit"
                  fontFamily="inherit"
                  fontWeight={600}
                  lineHeight={1.3}
                >
                  {l.name}
                  {l.tier === "wholesale" ? " (WS)" : ""}
                </Typography>
                <Typography
                  fontSize="10px"
                  fontFamily="inherit"
                  color="text.secondary"
                >
                  {l.sub ? `${l.sub} · ` : ""}{l.qty} × {formatUGX(l.unitPrice)}
                </Typography>
              </Box>
              <Typography
                fontSize="inherit"
                fontFamily="inherit"
                fontWeight={600}
                ml={1}
                whiteSpace="nowrap"
              >
                {formatUGX(l.lineTotal)}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />

          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Typography fontSize="13px" fontFamily="inherit" fontWeight={700}>
              TOTAL
            </Typography>
            <Typography
              fontSize="13px"
              fontFamily="inherit"
              fontWeight={700}
              color="primary.main"
            >
              {formatUGX(receipt.grandTotal)}
            </Typography>
          </Box>
          {receipt.hasWholesale && (
            <Typography align="center" fontSize="9px" fontFamily="inherit" color="success.main" mt={0.25}>
              ★ Wholesale pricing applied (6+ packs)
            </Typography>
          )}

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />

          {receipt.payments.map((p, i) => (
            <Box key={i} display="flex" justifyContent="space-between">
              <Typography fontSize="inherit" fontFamily="inherit">
                {p.label}
              </Typography>
              <Typography fontSize="inherit" fontFamily="inherit">
                {formatUGX(p.amount)}
              </Typography>
            </Box>
          ))}

          {/* Highlighted Cash Received & Change Section */}
          <Box
            sx={{
              bgcolor: "rgba(46, 125, 50, 0.08)",
              border: "1px solid rgba(46, 125, 50, 0.3)",
              borderRadius: 0.5,
              p: 1,
              my: 1,
              fontFamily: "'Courier New', monospace",
            }}
          >
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography
                fontSize="inherit"
                fontFamily="inherit"
                fontWeight={600}
              >
                Amount Received
              </Typography>
              <Typography
                fontSize="inherit"
                fontFamily="inherit"
                fontWeight={700}
                color="#2E7D32"
              >
                {formatUGX(receipt.amountTendered)}
              </Typography>
            </Box>
            {receipt.change > 0 && (
              <Box display="flex" justifyContent="space-between">
                <Typography
                  fontSize="inherit"
                  fontFamily="inherit"
                  fontWeight={600}
                >
                  Change
                </Typography>
                <Typography
                  fontSize="inherit"
                  fontFamily="inherit"
                  fontWeight={700}
                  color="#2E7D32"
                >
                  {formatUGX(receipt.change)}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 1, borderStyle: "dashed" }} />
          <Typography
            align="center"
            fontSize="10px"
            fontFamily="inherit"
            color="text.secondary"
          >
            Thank you for shopping at {branchDetails?.name ?? "DAS"}!
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ flex: 1 }}
        >
          Print
        </Button>
        <Button variant="contained" onClick={onNewSale} sx={{ flex: 1 }}>
          New sale
        </Button>
      </DialogActions>
    </Dialog>
  );
}

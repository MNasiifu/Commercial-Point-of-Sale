import type { CartLine } from "@/store/cartStore";
import type { CompleteSaleResult, PaymentMethod } from "@/types/database.types";
import type { PaymentEntry } from "@/hooks/pos/useCompleteSale";
import { formatUGX } from "./formatters";

export interface ReceiptData {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  branchName: string;

  saleNumber: string;
  dateTime: string;
  tellerName: string;
  customerName: string | null;

  hasWholesale: boolean;

  lines: Array<{
    name: string;
    sub: string;
    qty: number;
    unitPrice: number;
    tier: "retail" | "wholesale";
    lineTotal: number;
  }>;

  grandTotal: number;

  payments: Array<{ method: PaymentMethod; amount: number; label: string }>;
  amountTendered: number;
  change: number;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
};

export function buildReceipt({
  result,
  lines,
  payments,
  customerName,
  tellerName,
  grandTotal,
  amountTendered,
  branch,
}: {
  result: CompleteSaleResult;
  lines: CartLine[];
  payments: PaymentEntry[];
  customerName: string | null;
  tellerName: string;
  grandTotal: number;
  amountTendered: number;
  branch?: { name?: string | null; address?: string | null; phone?: string | null } | null;
}): ReceiptData {
  return {
    shopName: branch?.name ?? "Kids & Baby Store",
    shopAddress: branch?.address ?? "Kampala, Uganda",
    shopPhone: branch?.phone ?? "",
    branchName: branch?.name ?? "",

    saleNumber: result.sale_number,
    dateTime: new Date().toLocaleString("en-UG", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }),
    tellerName,
    customerName,

    hasWholesale: result.has_wholesale,

    lines: lines.map((l) => ({
      name: l.productName,
      sub: [l.sizeName, l.colorName].filter(Boolean).join(" · "),
      qty: l.quantity,
      unitPrice: l.unitPrice,
      tier: l.tier,
      lineTotal: l.lineTotal,
    })),

    grandTotal: result.total_amount ?? grandTotal,

    payments: payments.map((p) => ({ method: p.method, amount: p.amount, label: PAYMENT_LABELS[p.method] })),
    amountTendered,
    change: Math.max(0, amountTendered - grandTotal),
  };
}

// 80mm HTML receipt for browser print / QZ Tray
export function receiptToHtml(r: ReceiptData): string {
  const divider = '<hr style="border:none;border-top:1px dashed #000;margin:4px 0">';

  const lineRows = r.lines
    .map(
      (l) =>
        `<tr>
          <td style="padding:1px 0">${l.name}${l.tier === "wholesale" ? " <b>(WS)</b>" : ""}<br>
            <small>${l.sub ? l.sub + " · " : ""}${l.qty} × ${formatUGX(l.unitPrice)}</small></td>
          <td style="text-align:right;white-space:nowrap;padding:1px 0">${formatUGX(l.lineTotal)}</td>
        </tr>`,
    )
    .join("");

  const paymentRows = r.payments
    .map((p) => `<tr><td>${p.label}</td><td style="text-align:right">${formatUGX(p.amount)}</td></tr>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 6px; color: #000; }
  h2 { font-size: 14px; text-align: center; letter-spacing: 1px; }
  .center { text-align: center; }
  table { width: 100%; border-collapse: collapse; }
  .grand-row td { font-size: 13px; font-weight: bold; }
  .cash-section { border: 1px solid #2E7D32; padding: 6px; margin: 4px 0; background:#f0f7f0; border-radius: 2px; }
  .cash-row { display: flex; justify-content: space-between; font-weight: bold; margin: 2px 0; color: #2E7D32; }
  @media print { @page { margin: 0; size: 80mm auto; } body { padding: 2px; } }
</style>
</head>
<body>
  <h2>${r.shopName}</h2>
  <div class="center" style="font-size:10px;margin:2px 0">${r.shopAddress.replace("\n", "<br>")}</div>
  ${r.shopPhone ? `<div class="center" style="font-size:10px">Tel: ${r.shopPhone}</div>` : ""}
  ${divider}
  <table>
    <tr><td>Receipt #</td><td style="text-align:right">${r.saleNumber}</td></tr>
    <tr><td>Date</td><td style="text-align:right">${r.dateTime}</td></tr>
    <tr><td>Teller</td><td style="text-align:right">${r.tellerName}</td></tr>
    ${r.customerName ? `<tr><td>Customer</td><td style="text-align:right">${r.customerName}</td></tr>` : ""}
  </table>
  ${divider}
  <table>
    <thead><tr><th style="text-align:left">Item</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  ${divider}
  <table>
    <tr class="grand-row"><td>TOTAL</td><td style="text-align:right">${formatUGX(r.grandTotal)}</td></tr>
  </table>
  ${r.hasWholesale ? `<div class="center" style="font-size:9px;margin-top:2px">★ Wholesale pricing applied (6+ packs)</div>` : ""}
  ${divider}
  <table>${paymentRows}</table>
  ${divider}
  <div class="cash-section">
    <div class="cash-row"><span>RECEIVED</span><span>${formatUGX(r.amountTendered)}</span></div>
    ${r.change > 0 ? `<div class="cash-row"><span>CHANGE</span><span>${formatUGX(r.change)}</span></div>` : ""}
  </div>
  ${divider}
  <div class="center" style="margin-top:6px;font-size:10px">
    Thank you for shopping with us!<br>
    Goods once sold can be exchanged within 7 days<br>
    with a valid receipt.
  </div>
</body>
</html>`;
}

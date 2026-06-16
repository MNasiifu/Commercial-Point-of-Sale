// Generates an A4 HTML report and opens it in a new tab for browser PDF printing.
// Same technique as the thermal receipt — no extra dependencies.

const A4_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #111;
    padding: 24px 32px;
  }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px; color: #1565c0; }
  .meta { font-size: 10px; color: #555; margin-bottom: 16px; }
  .shop-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .shop-name { font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #1565c0; }
  .shop-info { font-size: 10px; color: #555; text-align: right; line-height: 1.6; }
  .divider { border: none; border-top: 1px solid #ccc; margin: 12px 0; }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }
  .summary-box {
    background: #f5f5f5;
    border-radius: 4px;
    padding: 10px 14px;
  }
  .summary-box .label { font-size: 9px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-box .value { font-size: 15px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead tr { background: #e3f2fd; }
  th {
    text-align: left;
    padding: 6px 8px;
    font-size: 10px;
    font-weight: 700;
    color: #1565c0;
    border-bottom: 1.5px solid #1976d2;
  }
  td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; font-family: monospace; }
  /* Expanded per-row detail (e.g. transaction line items) */
  td.detail-cell { padding: 0 8px 10px 24px; background: #f7fbff; border-bottom: 1px solid #e3f2fd; }
  table.detail { width: auto; min-width: 60%; margin: 6px 0 2px; }
  table.detail thead tr { background: #eef5fb; }
  table.detail th { padding: 3px 8px; font-size: 9px; color: #37474f; border-bottom: 1px solid #cfd8dc; }
  table.detail td { padding: 3px 8px; font-size: 9px; border-bottom: 1px solid #f0f0f0; background: transparent; }
  .detail-empty { font-size: 9px; color: #888; padding: 4px 0; }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
  }
  .badge-red  { background: #fde8e8; color: #c62828; }
  .badge-orange { background: #fff3e0; color: #e65100; }
  .badge-yellow { background: #fffde7; color: #f57f17; }
  .badge-green  { background: #e8f5e9; color: #2e7d32; }
  .footer { margin-top: 28px; font-size: 9px; color: #888; text-align: center; }
  @media print {
    @page { size: A4; margin: 15mm 20mm; }
    body { padding: 0; }
    .no-print { display: none !important; }
  }
`;

const SHOP_HEADER = `
  <div class="shop-header">
    <div>
      <div class="shop-name">DAS</div>
      <div class="meta">Freedom City Mall, Namasuba, Entebbe Road, Kampala, Uganda</div>
      <div class="meta">Tel: +256 700 000 000 &nbsp;|&nbsp; TIN: 10756690689</div>
    </div>
  </div>
  <hr class="divider">
`;

export interface PdfColumn {
  header: string;
  key: string;
  align?: "left" | "right" | "center";
  render?: (value: unknown, row: Record<string, unknown>) => string;
}

/**
 * Optional per-row detail rendered as an indented sub-table directly
 * beneath each main row (mirrors the on-screen inline row expansion).
 * `getRows` returns the detail records for a given main row.
 */
export interface PdfExpandable {
  columns: PdfColumn[];
  getRows: (row: Record<string, unknown>) => Record<string, unknown>[];
  emptyText?: string;
}

function renderCells(columns: PdfColumn[], row: Record<string, unknown>): string {
  return columns
    .map((c) => {
      const raw = row[c.key];
      const value = c.render ? c.render(raw, row) : (raw ?? "—");
      const align = c.align === "right" ? ' class="num"' : "";
      return `<td${align}>${value}</td>`;
    })
    .join("");
}

export function printReport(opts: {
  title: string;
  meta?: Record<string, string>;
  summary?: Array<{ label: string; value: string }>;
  columns: PdfColumn[];
  rows: Record<string, unknown>[];
  expandable?: PdfExpandable;
}): void {
  const metaHtml = opts.meta
    ? Object.entries(opts.meta)
        .map(([k, v]) => `<span><b>${k}:</b> ${v}</span>`)
        .join("&nbsp;&nbsp;·&nbsp;&nbsp;")
    : "";

  const summaryHtml = opts.summary
    ? `<div class="summary-grid">
        ${opts.summary
          .map(
            (s) =>
              `<div class="summary-box"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`,
          )
          .join("")}
      </div>`
    : "";

  const ths = opts.columns
    .map((c) => `<th style="text-align:${c.align ?? "left"}">${c.header}</th>`)
    .join("");

  const exp = opts.expandable;
  const trs = opts.rows
    .map((row) => {
      const mainRow = `<tr>${renderCells(opts.columns, row)}</tr>`;
      if (!exp) return mainRow;

      const detailRows = exp.getRows(row);
      let detailTable: string;
      if (detailRows.length === 0) {
        detailTable = `<div class="detail-empty">${exp.emptyText ?? "No items."}</div>`;
      } else {
        const dThs = exp.columns
          .map((c) => `<th style="text-align:${c.align ?? "left"}">${c.header}</th>`)
          .join("");
        const dTrs = detailRows
          .map((d) => `<tr>${renderCells(exp.columns, d)}</tr>`)
          .join("");
        detailTable = `<table class="detail"><thead><tr>${dThs}</tr></thead><tbody>${dTrs}</tbody></table>`;
      }
      const detailRow = `<tr><td class="detail-cell" colspan="${opts.columns.length}">${detailTable}</td></tr>`;
      return mainRow + detailRow;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${opts.title} — DAS</title>
<style>${A4_STYLES}</style>
</head>
<body>
${SHOP_HEADER}
<h1>${opts.title}</h1>
${metaHtml ? `<div class="meta" style="margin-bottom:12px">${metaHtml}</div>` : ""}
<hr class="divider">
${summaryHtml}
<table>
  <thead><tr>${ths}</tr></thead>
  <tbody>${trs}</tbody>
</table>
<div class="footer">
  Generated ${new Date().toLocaleString("en-UG")} &nbsp;·&nbsp; DAS POS &nbsp;·&nbsp; Confidential
</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups to print reports.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}

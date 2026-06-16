import ExcelJS from "exceljs";

export interface ExcelCol {
  header: string;
  key: string;
  width?: number;
  numFmt?: string;
  bold?: boolean;
}

/** An additional worksheet appended after the primary sheet. */
export interface ExcelSheet {
  sheetName: string;
  columns: ExcelCol[];
  rows: Record<string, unknown>[];
  headerMeta?: Record<string, string>;
}

/** Build a single worksheet (metadata rows, styled header, data, auto-filter). */
function buildSheet(wb: ExcelJS.Workbook, sheet: ExcelSheet): void {
  const { sheetName, columns, rows, headerMeta } = sheet;
  const ws = wb.addWorksheet(sheetName);

  // Optional report metadata rows at the top
  if (headerMeta) {
    Object.entries(headerMeta).forEach(([k, v]) => {
      const row = ws.addRow([k, v]);
      row.getCell(1).font = { bold: true };
      row.getCell(2).font = { color: { argb: "FF333333" } };
    });
    ws.addRow([]); // blank separator
  }

  // Column definitions
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // Style header row
  const headerRowNum = headerMeta ? Object.keys(headerMeta).length + 2 : 1;
  const headerRow = ws.getRow(headerRowNum);
  headerRow.font = { bold: true, color: { argb: "FF1565C0" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE3F2FD" },
  };
  headerRow.border = {
    bottom: { style: "thin", color: { argb: "FF1976D2" } },
  };

  // Data rows
  ws.addRows(rows);

  // Auto-filter on header row
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: columns.length },
  };
}

export async function downloadExcel(
  sheetName: string,
  columns: ExcelCol[],
  rows: Record<string, unknown>[],
  filename: string,
  headerMeta?: Record<string, string>,
  extraSheets?: ExcelSheet[],
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DAS POS";
  wb.created = new Date();

  buildSheet(wb, { sheetName, columns, rows, headerMeta });
  extraSheets?.forEach((s) => buildSheet(wb, s));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(url);
}

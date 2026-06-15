import bwipjs from "bwip-js";

// Generate a unique barcode value with DAS prefix
export function generateBarcodeValue(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `IM${timestamp}${random}`; // 12 chars — valid Code128
}

export interface BarcodeRenderOptions {
  scale?: number;
  height?: number;
  includetext?: boolean;
}

// Render barcode to PNG data URL (for img src or download)
export function renderBarcodePng(
  value: string,
  opts: BarcodeRenderOptions = {},
): string {
  const canvas = document.createElement("canvas");
  bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text: value,
    scale: opts.scale ?? 3,
    height: opts.height ?? 10,
    includetext: opts.includetext ?? true,
    textxalign: "center",
    paddingwidth: 4,
    paddingheight: 4,
  });
  return canvas.toDataURL("image/png");
}

// Render barcode to SVG string (for inline display)
export function renderBarcodeSvg(
  value: string,
  opts: BarcodeRenderOptions = {},
): string {
  // bwip-js v4 exports toSVG; @types/bwip-js is the v3 stub so we cast
  return (bwipjs as unknown as { toSVG: (opts: unknown) => string }).toSVG({
    bcid: "code128",
    text: value,
    scale: opts.scale ?? 2,
    height: opts.height ?? 10,
    includetext: opts.includetext ?? true,
    textxalign: "center",
    paddingwidth: 4,
    paddingheight: 4,
  });
}

// Trigger browser download of a barcode PNG
export function downloadBarcode(value: string, filename?: string): void {
  const dataUrl = renderBarcodePng(value, { scale: 4, height: 12 });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${filename ?? value}-barcode.png`;
  link.click();
}

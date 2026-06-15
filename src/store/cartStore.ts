import { create } from "zustand";
import type { ProductSearchResult, PriceTier } from "@/types/database.types";

export interface CartLine {
  productId: string;
  productName: string;
  brandName: string | null;
  sizeName: string | null;
  colorName: string | null;
  barcode: string | null;
  packSize: number;
  stockAvailable: number;

  retailPrice: number;
  wholesalePrice: number;
  wholesaleThreshold: number;

  quantity: number;

  // Derived — recomputed by buildLine() whenever quantity changes
  tier: PriceTier;
  unitPrice: number;
  lineTotal: number;
}

interface CartState {
  lines: CartLine[];
  customerId: string | null;
  customerName: string | null;

  addProduct: (product: ProductSearchResult, qty?: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeLine: (productId: string) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  clearCart: () => void;

  grandTotal: () => number;
  itemCount: () => number;
  hasWholesale: () => boolean;
}

/** Resolve the price tier and totals for a line based on its quantity. */
function buildLine(l: CartLine): CartLine {
  const isWholesale = l.quantity >= l.wholesaleThreshold;
  const unitPrice = isWholesale ? l.wholesalePrice : l.retailPrice;
  return {
    ...l,
    tier: isWholesale ? "wholesale" : "retail",
    unitPrice,
    lineTotal: Math.round(unitPrice * l.quantity),
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  customerId: null,
  customerName: null,

  addProduct: (product, qty = 1) => {
    set((s) => {
      const existing = s.lines.find((l) => l.productId === product.product_id);
      if (existing) {
        return {
          lines: s.lines.map((l) =>
            l.productId === product.product_id
              ? buildLine({ ...l, quantity: l.quantity + qty })
              : l,
          ),
        };
      }
      const line = buildLine({
        productId: product.product_id,
        productName: product.product_name,
        brandName: product.brand_name,
        sizeName: product.size_name,
        colorName: product.color_name,
        barcode: product.barcode,
        packSize: product.pack_size,
        stockAvailable: product.stock_available,
        retailPrice: product.retail_price,
        wholesalePrice: product.wholesale_price,
        wholesaleThreshold: product.wholesale_threshold,
        quantity: qty,
        tier: "retail",
        unitPrice: product.retail_price,
        lineTotal: 0,
      });
      return { lines: [...s.lines, line] };
    });
  },

  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeLine(productId);
      return;
    }
    set((s) => ({
      lines: s.lines.map((l) => (l.productId === productId ? buildLine({ ...l, quantity: qty }) : l)),
    }));
  },

  removeLine: (productId) =>
    set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  clearCart: () => set({ lines: [], customerId: null, customerName: null }),

  grandTotal: () => get().lines.reduce((sum, l) => sum + l.lineTotal, 0),
  itemCount: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
  hasWholesale: () => get().lines.some((l) => l.tier === "wholesale"),
}));

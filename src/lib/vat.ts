const DEFAULT_VAT_RATE = 18 // %

// Given a VAT-inclusive selling price, extract the VAT portion
export function extractVatFromInclusive(inclusivePrice: number, vatRate = DEFAULT_VAT_RATE): {
  priceBeforeVat: number
  vatAmount: number
  inclusivePrice: number
} {
  const divisor = 1 + vatRate / 100
  const priceBeforeVat = round2(inclusivePrice / divisor)
  const vatAmount = round2(inclusivePrice - priceBeforeVat)
  return { priceBeforeVat, vatAmount, inclusivePrice: round2(inclusivePrice) }
}

// Given a price before VAT, compute the inclusive price
export function addVatToPrice(priceBeforeVat: number, vatRate = DEFAULT_VAT_RATE): {
  priceBeforeVat: number
  vatAmount: number
  inclusivePrice: number
} {
  const vatAmount = round2(priceBeforeVat * (vatRate / 100))
  const inclusivePrice = round2(priceBeforeVat + vatAmount)
  return { priceBeforeVat: round2(priceBeforeVat), vatAmount, inclusivePrice }
}

// Compute cart line totals
export function computeLineTotal(
  unitPriceInclusive: number,
  quantity: number,
  isVatExempt: boolean,
  vatRate = DEFAULT_VAT_RATE
): {
  unitPriceBeforeVat: number
  vatPerUnit: number
  lineTotal: number
  lineTotalBeforeVat: number
  lineVat: number
} {
  if (isVatExempt) {
    const lineTotal = round2(unitPriceInclusive * quantity)
    return {
      unitPriceBeforeVat: round2(unitPriceInclusive),
      vatPerUnit: 0,
      lineTotal,
      lineTotalBeforeVat: lineTotal,
      lineVat: 0,
    }
  }
  const { priceBeforeVat, vatAmount } = extractVatFromInclusive(unitPriceInclusive, vatRate)
  return {
    unitPriceBeforeVat: priceBeforeVat,
    vatPerUnit: vatAmount,
    lineTotal: round2(unitPriceInclusive * quantity),
    lineTotalBeforeVat: round2(priceBeforeVat * quantity),
    lineVat: round2(vatAmount * quantity),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export { DEFAULT_VAT_RATE }

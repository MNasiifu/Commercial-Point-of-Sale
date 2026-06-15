import Dexie, { type EntityTable } from 'dexie'
import type { Sale, SaleItem, Payment, Product, ProductUnit, ProductBarcode, StockBatch } from '@/types/database.types'

// ─── Offline queue item ───────────────────────────────────────
interface OfflineQueueItem {
  id?: number
  action: 'complete_sale' | 'void_sale' | 'process_return' | 'adjust_stock'
  payload: unknown
  createdAt: string
  retryCount: number
  lastError: string | null
}

// ─── Cached data ──────────────────────────────────────────────
interface CachedProduct extends Product {
  units: ProductUnit[]
  barcodes: ProductBarcode[]
}

interface CachedStockBatch extends StockBatch {
  productName: string
}

interface CachedSale extends Sale {
  items: SaleItem[]
  payments: Payment[]
}

// ─── Dexie DB ─────────────────────────────────────────────────
class InfraMedikOfflineDb extends Dexie {
  offlineQueue!: EntityTable<OfflineQueueItem, 'id'>
  cachedProducts!: EntityTable<CachedProduct, 'id'>
  cachedStockBatches!: EntityTable<CachedStockBatch, 'id'>
  cachedSales!: EntityTable<CachedSale, 'id'>

  constructor() {
    super('InfraMedikPOS')
    this.version(1).stores({
      offlineQueue:    '++id, action, createdAt',
      cachedProducts:  'id, name, *barcodes',
      cachedStockBatches: 'id, product_id, branch_id, expiry_date',
      cachedSales:     'id, teller_id, created_at',
    })
  }
}

export const offlineDb = new InfraMedikOfflineDb()

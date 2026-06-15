import { supabase } from '@/lib/supabase'
import type { DeliveryOrder, DeliveryOrderItem, DeliveryStatus, Customer } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const DELIVERY_SELECT = `
  *,
  customers(id, full_name, phone, email),
  delivery_order_items(
    *,
    products(id, name, sizes(name), colors(name))
  )
` as const

export interface DeliveryWithDetails extends DeliveryOrder {
  customers:            Pick<Customer, 'id' | 'full_name' | 'phone' | 'email'> | null
  delivery_order_items: Array<
    DeliveryOrderItem & {
      products: {
        id: string
        name: string
        sizes: { name: string } | null
        colors: { name: string } | null
      } | null
    }
  >
}

export interface DeliveryFilters {
  status?:    DeliveryStatus | ''
  search?:    string
  dateFrom?:  string
  dateTo?:    string
}

export interface CreateDeliveryPayload {
  customer_id:      string | null
  customer_name:    string
  customer_phone:   string | null
  order_source:     DeliveryOrder['order_source']
  delivery_address: string | null
  delivery_notes:   string | null
  branch_id:        string
  teller_id:        string
  items: Array<{
    product_id: string
    quantity:   number
    unit_price: number
    line_total: number
  }>
}

export const deliveryService = {

  async getAll(filters: DeliveryFilters = {}): Promise<DeliveryWithDetails[]> {
    let query = db
      .from('delivery_orders')
      .select(DELIVERY_SELECT)
      .order('created_at', { ascending: false })

    if (filters.status)   query = query.eq('status', filters.status)
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo)   query = query.lte('created_at', filters.dateTo + 'T23:59:59')

    const { data, error } = await query
    if (error) throw error

    let results = data as unknown as DeliveryWithDetails[]
    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (d) =>
          d.order_number.toLowerCase().includes(q) ||
          d.customer_name?.toLowerCase().includes(q) ||
          d.customer_phone?.toLowerCase().includes(q)
      )
    }
    return results
  },

  async getById(id: string): Promise<DeliveryWithDetails> {
    const { data, error } = await db
      .from('delivery_orders')
      .select(DELIVERY_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as DeliveryWithDetails
  },

  async create(payload: CreateDeliveryPayload): Promise<DeliveryOrder> {
    const totalAmount = payload.items.reduce((s, i) => s + i.line_total, 0)

    const { data: order, error: orderErr } = await db
      .from('delivery_orders')
      .insert({
        branch_id:        payload.branch_id,
        teller_id:        payload.teller_id,
        customer_id:      payload.customer_id,
        customer_name:    payload.customer_name,
        customer_phone:   payload.customer_phone,
        order_source:     payload.order_source,
        status:           'pending',
        delivery_address: payload.delivery_address,
        delivery_notes:   payload.delivery_notes,
        total_amount:     totalAmount,
      })
      .select()
      .single()
    if (orderErr) throw orderErr

    const items = payload.items.map((i) => ({
      delivery_order_id: (order as DeliveryOrder).id,
      product_id:        i.product_id,
      quantity:          i.quantity,
      unit_price:        i.unit_price,
      line_total:        i.line_total,
    }))

    const { error: itemsErr } = await db
      .from('delivery_order_items')
      .insert(items)
    if (itemsErr) throw itemsErr

    return order as DeliveryOrder
  },

  async updateStatus(id: string, status: DeliveryStatus): Promise<void> {
    const { error } = await db
      .from('delivery_orders')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  },

  async cancel(id: string): Promise<void> {
    return deliveryService.updateStatus(id, 'cancelled')
  },
}

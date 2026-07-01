/**
 * Real-world marketplace settlement model:
 *
 * Customer pays:  products + delivery + service − coupon  (= totalAmount)
 * Vendor gets:    product sale − platform commission       (= vendorEarning)
 * Platform gets:  commission + service charge + delivery   (= platformRevenue)
 *
 * On return (product value only — delivery & service kept by platform):
 *   Customer refund = productsTotal
 *   Vendor clawback = full vendorEarning
 *   Commission clawback = full platformCommission
 *   Platform keeps service + delivery fees
 */

export interface OrderLike {
  _id?: string
  orderStatus: string
  isPaid?: boolean
  paymentMethod?: 'cod' | 'stripe'
  productsTotal?: number
  deliveryCharge?: number
  serviceCharge?: number
  couponDiscount?: number
  totalAmount?: number
  platformCommission?: number
  vendorEarning?: number
  commissionPercent?: number
  returnedAmount?: number
  refundedCommission?: number
  refundedVendorAmount?: number
  createdAt?: string | Date
  deliveryDate?: string | Date
  productVendor?: { _id?: string } | string
  buyer?: { _id?: string } | string
  products?: {
    quantity: number
    price: number
    product?: { replacementDays?: number; title?: string }
  }[]
}

export function isOrderPaid(order: OrderLike): boolean {
  if (order.paymentMethod === 'stripe') {
    return !!order.isPaid
  }
  if (order.paymentMethod === 'cod') {
    return (
      !!order.isPaid &&
      (order.orderStatus === 'delivered' || order.orderStatus === 'returned')
    )
  }
  return !!order.isPaid
}

export function getMaxReplacementDays(order: OrderLike): number {
  if (!order.products?.length) return 0
  return Math.max(
    0,
    ...order.products.map((item) => item.product?.replacementDays ?? 0)
  )
}

export function isReturnWindowOpen(order: OrderLike): boolean {
  const replacementDays = getMaxReplacementDays(order)
  if (!order.deliveryDate || replacementDays <= 0) return false
  const deliveredAt = new Date(order.deliveryDate).getTime()
  const expiry = deliveredAt + replacementDays * 24 * 60 * 60 * 1000
  return Date.now() <= expiry
}

export function getBaseAmounts(order: OrderLike) {
  const productsTotal = order.productsTotal ?? 0
  const deliveryCharge = order.deliveryCharge ?? 0
  const serviceCharge = order.serviceCharge ?? 0
  const couponDiscount = order.couponDiscount ?? 0
  const commissionPercent = order.commissionPercent ?? 0

  const platformCommission =
    order.platformCommission ??
    Math.round((productsTotal * commissionPercent) / 100)
  const vendorEarning = order.vendorEarning ?? productsTotal - platformCommission
  const totalAmount =
    order.totalAmount ??
    productsTotal + deliveryCharge + serviceCharge - couponDiscount
  const platformFees = serviceCharge + deliveryCharge
  const platformRevenue = platformCommission + platformFees

  return {
    productsTotal,
    deliveryCharge,
    serviceCharge,
    couponDiscount,
    totalAmount,
    commissionPercent,
    platformCommission,
    vendorEarning,
    platformFees,
    platformRevenue,
  }
}

export interface OrderSettlement {
  productsTotal: number
  deliveryCharge: number
  serviceCharge: number
  couponDiscount: number
  totalAmount: number
  commissionPercent: number
  platformCommission: number
  vendorEarning: number
  platformFees: number
  platformRevenue: number
  recognized: boolean
  customerRefund: number
  vendorPayout: number
  platformEarnings: number
  platformCommissionNet: number
  platformFeesKept: number
  refundedCommission: number
  refundedVendor: number
  gmv: number
  pipelineValue: number
}

export function getOrderSettlement(order: OrderLike): OrderSettlement {
  const base = getBaseAmounts(order)
  const paid = isOrderPaid(order)
  const status = order.orderStatus

  const emptySettlement = (): OrderSettlement => ({
    ...base,
    recognized: false,
    customerRefund: 0,
    vendorPayout: 0,
    platformEarnings: 0,
    platformCommissionNet: 0,
    platformFeesKept: 0,
    refundedCommission: 0,
    refundedVendor: 0,
    gmv: 0,
    pipelineValue: 0,
  })

  if (status === 'cancelled') {
    return emptySettlement()
  }

  if (status === 'returned') {
    const customerRefund = order.returnedAmount ?? base.productsTotal
    const refundedCommission = order.refundedCommission ?? base.platformCommission
    const refundedVendor = order.refundedVendorAmount ?? base.vendorEarning
    const platformFeesKept = base.platformFees

    return {
      ...base,
      recognized: paid,
      customerRefund,
      vendorPayout: 0,
      platformEarnings: paid ? platformFeesKept : 0,
      platformCommissionNet: 0,
      platformFeesKept,
      refundedCommission,
      refundedVendor,
      gmv: base.productsTotal,
      pipelineValue: 0,
    }
  }

  if (status === 'delivered' && paid) {
    return {
      ...base,
      recognized: true,
      customerRefund: 0,
      vendorPayout: base.vendorEarning,
      platformEarnings: base.platformRevenue,
      platformCommissionNet: base.platformCommission,
      platformFeesKept: base.platformFees,
      refundedCommission: 0,
      refundedVendor: 0,
      gmv: base.productsTotal,
      pipelineValue: 0,
    }
  }

  return {
    ...base,
    recognized: false,
    customerRefund: 0,
    vendorPayout: 0,
    platformEarnings: 0,
    platformCommissionNet: 0,
    platformFeesKept: 0,
    refundedCommission: 0,
    refundedVendor: 0,
    gmv: base.productsTotal,
    pipelineValue: base.totalAmount,
  }
}

export interface FinanceAggregate {
  orderCount: number
  gmv: number
  platformEarnings: number
  platformCommission: number
  platformFees: number
  vendorPayouts: number
  customerRefunds: number
  refundedCommission: number
  refundedVendor: number
  deliveredCount: number
  returnedCount: number
  cancelledCount: number
  pendingCount: number
  pipelineValue: number
  couponDiscountTotal: number
}

export function aggregateOrderFinances(orders: OrderLike[]): FinanceAggregate {
  const result: FinanceAggregate = {
    orderCount: orders.length,
    gmv: 0,
    platformEarnings: 0,
    platformCommission: 0,
    platformFees: 0,
    vendorPayouts: 0,
    customerRefunds: 0,
    refundedCommission: 0,
    refundedVendor: 0,
    deliveredCount: 0,
    returnedCount: 0,
    cancelledCount: 0,
    pendingCount: 0,
    pipelineValue: 0,
    couponDiscountTotal: 0,
  }

  for (const order of orders) {
    const s = getOrderSettlement(order)
    result.gmv += s.gmv
    result.couponDiscountTotal += s.couponDiscount

    if (order.orderStatus === 'delivered' && s.recognized) {
      result.deliveredCount++
      result.platformEarnings += s.platformEarnings
      result.platformCommission += s.platformCommissionNet
      result.platformFees += s.platformFeesKept
      result.vendorPayouts += s.vendorPayout
    }

    if (order.orderStatus === 'returned') {
      result.returnedCount++
      if (s.recognized) {
        result.customerRefunds += s.customerRefund
        result.refundedCommission += s.refundedCommission
        result.refundedVendor += s.refundedVendor
        result.platformEarnings += s.platformEarnings
        result.platformFees += s.platformFeesKept
      }
    }

    if (order.orderStatus === 'cancelled') {
      result.cancelledCount++
    }

    if (!['delivered', 'returned', 'cancelled'].includes(order.orderStatus)) {
      result.pendingCount++
      result.pipelineValue += s.pipelineValue
    }
  }

  return result
}

export function revenueByMonth(
  orders: OrderLike[],
  pick: 'platform' | 'vendor' | 'gmv'
): { month: string; amount: number }[] {
  const map = new Map<string, number>()

  for (const order of orders) {
    if (!order.createdAt) continue
    const d = new Date(order.createdAt)
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    const s = getOrderSettlement(order)
    if (!s.recognized && order.orderStatus !== 'returned') continue

    let amount = 0
    if (pick === 'platform') amount = s.platformEarnings
    else if (pick === 'vendor') amount = s.vendorPayout
    else amount = s.gmv

    if (order.orderStatus === 'returned' && pick === 'vendor') amount = 0

    map.set(key, (map.get(key) ?? 0) + amount)
  }

  return Array.from(map.entries()).map(([month, amount]) => ({ month, amount }))
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function vendorIdFromOrder(order: OrderLike): string {
  if (!order.productVendor) return ''
  return typeof order.productVendor === 'object'
    ? String(order.productVendor._id ?? '')
    : String(order.productVendor)
}

export function filterOrdersByVendor(orders: OrderLike[], vendorId: string): OrderLike[] {
  return orders.filter((o) => vendorIdFromOrder(o) === vendorId)
}

'use client'

import {
  aggregateOrderFinances,
  formatINR,
  getOrderSettlement,
  OrderLike,
  revenueByMonth,
  vendorIdFromOrder,
} from '@/lib/orderFinances'
import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STATUS_COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f97316']

export function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string
  value: string | number
  hint?: string
  accent?: string
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{title}</p>
      <p className={`mt-1 text-lg font-bold sm:text-xl ${accent ?? 'text-white'}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </div>
  )
}

export function AdminFinanceDashboard({ orders }: { orders: OrderLike[] }) {
  const fin = aggregateOrderFinances(orders)
  const revenueTrend = revenueByMonth(orders, 'platform')
  const gmvTrend = revenueByMonth(orders, 'gmv')

  const statusPie = [
    { name: 'Delivered', value: fin.deliveredCount },
    { name: 'Pending', value: fin.pendingCount },
    { name: 'Cancelled', value: fin.cancelledCount },
    { name: 'Returned', value: fin.returnedCount },
  ].filter((s) => s.value > 0)

  const feeBreakdown = [
    { name: 'Commission', value: Math.max(0, fin.platformCommission - fin.refundedCommission) },
    { name: 'Delivery fees', value: orders.reduce((s, o) => {
      const st = getOrderSettlement(o)
      if (!st.recognized && o.orderStatus !== 'returned') return s
      if (o.orderStatus === 'returned' || o.orderStatus === 'delivered') return s + (st.deliveryCharge || 0)
      return s
    }, 0) },
    { name: 'Service fees', value: orders.reduce((s, o) => {
      const st = getOrderSettlement(o)
      if (!st.recognized && o.orderStatus !== 'returned') return s
      if (o.orderStatus === 'returned' || o.orderStatus === 'delivered') return s + (st.serviceCharge || 0)
      return s
    }, 0) },
  ].filter((x) => x.value > 0)

  const vendorRows = buildVendorRows(orders)

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="section-title">Platform revenue</h2>
        <p className="section-subtitle">
          Settled on delivered & paid orders. Returns claw back product commission; platform keeps delivery & service fees.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard title="GMV (products)" value={formatINR(fin.gmv)} hint="Total product value sold" />
        <StatCard
          title="Platform earnings"
          value={formatINR(fin.platformEarnings)}
          hint="Commission + fees (after returns)"
          accent="text-emerald-400"
        />
        <StatCard title="Commission" value={formatINR(fin.platformCommission - fin.refundedCommission)} />
        <StatCard title="Vendor payouts" value={formatINR(fin.vendorPayouts)} accent="text-blue-400" />
        <StatCard title="Customer refunds" value={formatINR(fin.customerRefunds)} accent="text-orange-400" />
        <StatCard title="Pipeline" value={formatINR(fin.pipelineValue)} hint={`${fin.pendingCount} in-progress orders`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Platform revenue trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} name="Platform ₹" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GMV trend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gmvTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Bar dataKey="amount" fill="#3b82f6" name="GMV ₹" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Order status">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
            <MiniStat label="Delivered" value={fin.deliveredCount} color="text-emerald-400" />
            <MiniStat label="Pending" value={fin.pendingCount} color="text-blue-400" />
            <MiniStat label="Cancelled" value={fin.cancelledCount} color="text-red-400" />
            <MiniStat label="Returned" value={fin.returnedCount} color="text-orange-400" />
          </div>
          {statusPie.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Platform revenue breakdown">
          {feeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={feeBreakdown} dataKey="value" nameKey="name" outerRadius={85} label={({ name, value }) => `${name}: ${formatINR(value)}`}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#06b6d4" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip formatter={(v) => formatINR(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">No settled revenue yet</p>
          )}
        </ChartCard>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Vendor performance</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendorRows.map((row) => (
            <div key={row.vendorId} className="glass-card p-4">
              <h4 className="truncate font-semibold">{row.shopName}</h4>
              <div className="mt-3 space-y-1.5 text-sm text-gray-400">
                <Row label="Orders" value={String(row.orders)} />
                <Row label="GMV" value={formatINR(row.gmv)} />
                <Row label="Vendor earned" value={formatINR(row.vendorPayout)} accent="text-emerald-400" />
                <Row label="Platform commission" value={formatINR(row.commission)} accent="text-violet-400" />
                <Row label="Returns" value={String(row.returns)} accent="text-orange-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function VendorFinanceDashboard({
  orders,
  shopName,
}: {
  orders: OrderLike[]
  shopName?: string
}) {
  const fin = aggregateOrderFinances(orders)
  const revenueTrend = revenueByMonth(orders, 'vendor')
  const gmvTrend = revenueByMonth(orders, 'gmv')

  const productSalesMap: Record<string, number> = {}
  for (const order of orders) {
    const s = getOrderSettlement(order)
    if (!s.recognized || order.orderStatus !== 'delivered') continue
    for (const item of order.products ?? []) {
      const title = item.product?.title ?? 'Product'
      productSalesMap[title] = (productSalesMap[title] ?? 0) + item.quantity
    }
  }
  const topProducts = Object.entries(productSalesMap)
    .map(([product, sold]) => ({ product: product.length > 14 ? `${product.slice(0, 14)}…` : product, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 8)

  const statusPie = [
    { name: 'Delivered', value: fin.deliveredCount },
    { name: 'Pending', value: fin.pendingCount },
    { name: 'Cancelled', value: fin.cancelledCount },
    { name: 'Returned', value: fin.returnedCount },
  ].filter((s) => s.value > 0)

  return (
    <div className="space-y-6 sm:space-y-8">
      {shopName && (
        <div className="glass-card p-5">
          <h2 className="text-xl font-bold">{shopName}</h2>
          <p className="text-sm text-gray-400">Earnings from delivered orders minus returns</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Product sales (GMV)" value={formatINR(fin.gmv)} />
        <StatCard title="Your net earnings" value={formatINR(fin.vendorPayouts)} accent="text-emerald-400" hint="After commission" />
        <StatCard title="Commission paid" value={formatINR(fin.platformCommission - fin.refundedCommission)} accent="text-violet-400" />
        <StatCard title="Refunded to buyers" value={formatINR(fin.customerRefunds)} accent="text-orange-400" />
        <StatCard title="Delivered" value={fin.deliveredCount} />
        <StatCard title="Returns" value={fin.returnedCount} accent="text-orange-400" />
      </div>

      <div className="glass-card border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100/90">
        <p className="font-medium">How your earnings work</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-200/70">
          <li>You receive product sale price minus platform commission on each delivered order.</li>
          <li>Delivery & service charges go to the platform, not your payout.</li>
          <li>On return, product amount is refunded — your earning for that order is reversed.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Your earnings trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} name="Net ₹" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales volume (GMV)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gmvTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Order status">
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500">No orders yet</p>
          )}
        </ChartCard>

        <ChartCard title="Top products sold">
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="product" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="sold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500">No sales yet</p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-200">{title}</h3>
      {children}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-black/30 p-3 text-center">
      <p className="text-[10px] uppercase text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span className={accent ?? 'text-gray-200'}>{value}</span>
    </div>
  )
}

function buildVendorRows(orders: OrderLike[]) {
  const map = new Map<
    string,
    { shopName: string; orders: number; gmv: number; vendorPayout: number; commission: number; returns: number }
  >()

  for (const order of orders) {
    const vid = vendorIdFromOrder(order)
    if (!vid) continue
    const vendorName =
      typeof order.productVendor === 'object' && order.productVendor && 'shopName' in order.productVendor
        ? String((order.productVendor as { shopName?: string }).shopName ?? 'Shop')
        : 'Shop'

    const row = map.get(vid) ?? {
      shopName: vendorName,
      orders: 0,
      gmv: 0,
      vendorPayout: 0,
      commission: 0,
      returns: 0,
    }
    row.orders++
    const s = getOrderSettlement(order)
    row.gmv += s.gmv
    if (order.orderStatus === 'returned') row.returns++
    if (s.recognized && (order.orderStatus === 'delivered' || order.orderStatus === 'returned')) {
      row.vendorPayout += s.vendorPayout
      row.commission += s.platformEarnings
    }
    map.set(vid, row)
  }

  return Array.from(map.entries()).map(([vendorId, row]) => ({ vendorId, ...row }))
}

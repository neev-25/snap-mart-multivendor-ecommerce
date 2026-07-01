'use client'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'

function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'fixed',
    discountValue: '',
    minOrderAmount: '0',
    maxUses: '',
    isActive: true,
  })

  const load = async () => {
    const res = await axios.get('/api/admin/coupon')
    setCoupons(res.data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/admin/coupon', {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        isActive: form.isActive,
      })
      setForm({
        code: '',
        discountType: 'percent',
        discountValue: '',
        minOrderAmount: '0',
        maxUses: '',
        isActive: true,
      })
      await load()
      alert('Coupon created')
    } catch {
      alert('Failed to create coupon')
    } finally {
      setLoading(false)
    }
  }

  const toggleCoupon = async (couponId: string, isActive: boolean) => {
    setTogglingId(couponId)
    try {
      await axios.patch('/api/admin/coupon', { couponId, isActive })
      setCoupons((prev) =>
        prev.map((c) => (c._id === couponId ? { ...c, isActive } : c))
      )
    } catch {
      alert('Failed to update coupon status')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="w-full px-3 sm:px-6 py-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Coupon Codes</h1>
      <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-xl p-4 grid md:grid-cols-2 gap-4 mb-8">
        <input className="p-3 bg-black/40 border border-white/20 rounded" placeholder="Code e.g. SAVE10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
        <select className="p-3 bg-black/40 border border-white/20 rounded" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ₹</option>
        </select>
        <input type="number" className="p-3 bg-black/40 border border-white/20 rounded" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
        <input type="number" className="p-3 bg-black/40 border border-white/20 rounded" placeholder="Min order amount" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
        <input type="number" className="p-3 bg-black/40 border border-white/20 rounded" placeholder="Max uses (optional)" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        <label className="flex items-center gap-3 p-3 bg-black/40 border border-white/20 rounded cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Enable coupon on creation</span>
        </label>
        <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold md:col-span-2">
          {loading ? <ClipLoader size={18} color="white" /> : 'Create Coupon'}
        </button>
      </form>
      <div className="space-y-3">
        {coupons.map((c) => (
          <div key={c._id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="font-bold">{c.code}</p>
              <p className="text-sm text-gray-400">{c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`} · Used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded ${c.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {c.isActive ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                disabled={togglingId === c._id}
                onClick={() => toggleCoupon(c._id, !c.isActive)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  c.isActive
                    ? 'bg-red-600/80 hover:bg-red-600'
                    : 'bg-green-600/80 hover:bg-green-600'
                }`}
              >
                {togglingId === c._id ? '...' : c.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminCoupons

'use client'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { FaStripe, FaTag } from 'react-icons/fa'
import { ClipLoader } from 'react-spinners'
import { calculateOrderPricing } from '@/lib/orderPricing'
import { useActionLock } from '@/hooks/useActionLock'
import { showToast } from '@/component/ui/ToastProvider'

function CartCheckout() {
  const router = useRouter()
  const [cart, setCart] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    couponDiscount: number
    totalAmount: number
  } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const { busy: placingOrder, run: runPlaceOrder } = useActionLock()
  const submittedRef = useRef(false)

  useEffect(() => {
    const loadCart = async () => {
      try {
        const result = await axios.get('/api/user/cart/get')
        const items = result.data.cart || []
        if (!items.length) {
          router.replace('/cart')
          return
        }
        setCart(items)
        const allCod = items.every((i: any) => i.product.payOnDelivery !== false)
        if (!allCod) setPaymentMethod('stripe')
      } catch {
        router.replace('/cart')
      }
    }
    loadCart()
  }, [router])

  const linePricing = useMemo(() => {
    return cart.map((item) => ({
      item,
      pricing: calculateOrderPricing(item.product, item.quantity),
    }))
  }, [cart])

  const cartTotals = useMemo(() => {
    const productsTotal = linePricing.reduce((s, l) => s + l.pricing.productsTotal, 0)
    const deliveryTotal = linePricing.reduce((s, l) => s + l.pricing.deliveryCharge, 0)
    const serviceTotal = linePricing.reduce((s, l) => s + l.pricing.serviceCharge, 0)
    const preCouponTotal = productsTotal + deliveryTotal + serviceTotal
    const couponDiscount = appliedCoupon?.couponDiscount ?? 0
    return {
      productsTotal,
      deliveryTotal,
      serviceTotal,
      preCouponTotal,
      couponDiscount,
      totalAmount: appliedCoupon?.totalAmount ?? preCouponTotal,
    }
  }, [linePricing, appliedCoupon])

  const codAvailable = cart.every((i) => i.product.payOnDelivery !== false)

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponCode).trim()
    if (!code) return
    setCouponCode(code)
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await axios.post('/api/coupon/validate-cart', { code })
      setAppliedCoupon({
        code: res.data.code,
        couponDiscount: res.data.couponDiscount,
        totalAmount: res.data.totalAmount,
      })
      setCouponError('')
      showToast(`Coupon ${res.data.code} applied`)
      setShowCoupons(false)
    } catch {
      setAppliedCoupon(null)
      setCouponError('Invalid or expired coupon')
      showToast('Invalid or expired coupon', 'error')
    } finally {
      setCouponLoading(false)
    }
  }

  const openCouponsModal = async () => {
    setShowCoupons(true)
    setCouponsLoading(true)
    try {
      const res = await axios.get(`/api/coupon/list?subtotal=${cartTotals.preCouponTotal}`)
      setAvailableCoupons(res.data.coupons ?? [])
    } catch {
      showToast('Could not load coupons', 'error')
      setAvailableCoupons([])
    } finally {
      setCouponsLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (placingOrder || submittedRef.current) return
    if (!name || !phone || !address || !city || !pincode) {
      showToast('Please fill all address fields', 'error')
      return
    }
    const payload = {
      address: { name, phone, address, city, pincode },
      couponCode: appliedCoupon?.code,
    }

    await runPlaceOrder(async () => {
      submittedRef.current = true
      try {
        if (paymentMethod === 'cod') {
          await axios.post('/api/order/cod/cart', payload)
          showToast('All orders placed successfully')
          router.push('/order-success')
        } else {
          const result = await axios.post('/api/order/online-pay/cart', payload)
          showToast('Redirecting to secure payment…', 'info')
          window.location.href = result.data.url
        }
      } catch (error) {
        submittedRef.current = false
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Order failed. Please try again.'
        showToast(message, 'error')
        router.push(`/order-failed?reason=${encodeURIComponent(message)}`)
      }
    })
  }

  if (!cart.length) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">Loading cart…</div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8"
      >
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">Delivery Address</h2>
          <input type="text" placeholder="Full Name" className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" placeholder="Phone Number" className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea placeholder="Full Address" className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="City" className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white" value={city} onChange={(e) => setCity(e.target.value)} />
            <input type="text" placeholder="Pincode" className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">Cart checkout ({cart.length} items)</h2>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {linePricing.map(({ item, pricing }) => (
              <div key={String(item.product._id)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <Image src={item.product.image1} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.product.title}</p>
                  <p className="text-xs text-gray-400">Qty {item.quantity} · ₹{pricing.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-300">Have a coupon?</p>
              <button type="button" onClick={openCouponsModal} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <FaTag size={12} /> View coupons
              </button>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 p-3 rounded-xl bg-black/60 border border-white/20 text-white" />
              <button type="button" onClick={() => handleApplyCoupon()} disabled={couponLoading} className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold disabled:opacity-60">
                {couponLoading ? <ClipLoader size={16} color="white" /> : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-400">{couponError}</p>}
            {appliedCoupon && <p className="text-xs text-green-400">Coupon {appliedCoupon.code} applied — saved ₹{appliedCoupon.couponDiscount}</p>}
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{cartTotals.productsTotal}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{cartTotals.deliveryTotal === 0 ? 'Free' : `₹${cartTotals.deliveryTotal}`}</span></div>
            <div className="flex justify-between"><span>Service charge</span><span>₹{cartTotals.serviceTotal}</span></div>
            {cartTotals.couponDiscount > 0 && (
              <div className="flex justify-between text-green-400"><span>Coupon</span><span>-₹{cartTotals.couponDiscount}</span></div>
            )}
            <div className="flex justify-between border-t border-white/20 pt-3 text-lg font-bold text-white">
              <span>Total</span><span className="text-green-400">₹{cartTotals.totalAmount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white">Payment Method</p>
            <div className="flex gap-3">
              <button type="button" disabled={!codAvailable} onClick={() => codAvailable && setPaymentMethod('cod')} className={`flex-1 py-3 rounded-xl font-semibold border-2 ${paymentMethod === 'cod' && codAvailable ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/10 border-white/20 text-white'} ${!codAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}>Cash on Delivery</button>
              <button type="button" onClick={() => setPaymentMethod('stripe')} className={`flex-1 py-3 rounded-xl font-semibold border-2 flex items-center justify-center gap-2 ${paymentMethod === 'stripe' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/10 border-white/20 text-white'}`}><FaStripe className="text-xl border rounded bg-green-300 text-black p-[2px]" /> Stripe</button>
            </div>
            {!codAvailable && <p className="text-xs text-amber-300">Some items require Stripe payment.</p>}
          </div>

          <motion.button onClick={handlePlaceOrder} disabled={placingOrder} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-lg text-white disabled:opacity-60">
            {placingOrder ? <ClipLoader size={20} color="white" /> : paymentMethod === 'cod' ? 'Place all orders' : 'Pay for all items'}
          </motion.button>

          <button type="button" onClick={() => router.push('/cart')} className="w-full text-sm text-gray-400 hover:text-white">
            ← Back to cart (single-item checkout still available)
          </button>
        </div>
      </motion.div>

      {showCoupons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/70" onClick={() => setShowCoupons(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#061526] p-5">
            <h3 className="mb-4 text-lg font-bold text-white">Available coupons</h3>
            {couponsLoading ? (
              <div className="flex justify-center py-10"><ClipLoader size={28} color="#34d399" /></div>
            ) : availableCoupons.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No active coupons right now.</p>
            ) : (
              <ul className="max-h-72 space-y-3 overflow-y-auto">
                {availableCoupons.map((c) => (
                  <li key={c.code} className="rounded-xl border border-white/10 p-3 flex justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-emerald-400">{c.code}</p>
                      <p className="text-sm text-white">{c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</p>
                    </div>
                    <button type="button" disabled={!c.eligible || couponLoading} onClick={() => handleApplyCoupon(c.code)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Apply</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CartCheckout

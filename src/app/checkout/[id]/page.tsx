'use client'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { FaStripe, FaTag } from 'react-icons/fa'
import { ClipLoader } from 'react-spinners'
import { calculateOrderPricing } from '@/lib/orderPricing'
import { useActionLock } from '@/hooks/useActionLock'
import { showToast } from '@/component/ui/ToastProvider'

function Checkout() {
  const params = useParams()
  const productId = params.id as string
  const [item, setItem] = useState<any>(null)
  const router = useRouter()
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
  const [availableCoupons, setAvailableCoupons] = useState<
    {
      code: string
      discountType: 'percent' | 'fixed'
      discountValue: number
      minOrderAmount: number
      expiresAt: string | null
      eligible: boolean
    }[]
  >([])
  const [couponsLoading, setCouponsLoading] = useState(false)
  const { busy: placingOrder, run: runPlaceOrder } = useActionLock()
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!productId) return

    const loadItem = async () => {
      try {
        const result = await axios.get('/api/user/cart/get')
        const foundItem = result.data.cart.find(
          (i: { product: { _id: unknown } }) =>
            String(i.product._id) === String(productId)
        )
        if (!foundItem) {
          router.replace('/cart')
          return
        }
        setItem(foundItem)
        const codAvailable = foundItem.product.payOnDelivery !== false
        if (!codAvailable) {
          setPaymentMethod('stripe')
        }
      } catch (error) {
        console.log(error)
        alert('failed to get item')
      }
    }
    loadItem()
  }, [productId, router])

  const pricing = useMemo(() => {
    if (!item) return null
    const base = calculateOrderPricing(item.product, item.quantity)
    if (!appliedCoupon) return base
    return {
      ...base,
      couponDiscount: appliedCoupon.couponDiscount,
      totalAmount: appliedCoupon.totalAmount,
    }
  }, [item, appliedCoupon])

  if (!item || !pricing) {
    return (
      <div className="text-2xl min-h-screen bg-linear-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12">
        Loading...
      </div>
    )
  }

  const codAvailable = item.product.payOnDelivery !== false

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponCode).trim()
    if (!code) return
    setCouponCode(code)
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await axios.post('/api/coupon/validate', {
        code,
        productId,
        quantity: item.quantity,
      })
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
    if (!item) return
    setShowCoupons(true)
    setCouponsLoading(true)
    try {
      const subtotal = calculateOrderPricing(item.product, item.quantity).totalAmount
      const res = await axios.get(`/api/coupon/list?subtotal=${subtotal}`)
      setAvailableCoupons(res.data.coupons ?? [])
    } catch {
      showToast('Could not load coupons', 'error')
      setAvailableCoupons([])
    } finally {
      setCouponsLoading(false)
    }
  }

  const formatCouponOffer = (c: {
    discountType: 'percent' | 'fixed'
    discountValue: number
  }) =>
    c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`

  const handlePlaceOrder = async () => {
    if (placingOrder || submittedRef.current) return
    if (!name || !phone || !address || !city || !pincode) {
      showToast('Please fill all address fields', 'error')
      return
    }
    const payload = {
      productId,
      quantity: item.quantity,
      address: { name, phone, address, city, pincode },
      couponCode: appliedCoupon?.code,
    }

    await runPlaceOrder(async () => {
      submittedRef.current = true
      try {
        if (paymentMethod === 'cod') {
          await axios.post('/api/order/cod', payload)
          showToast('Order placed successfully')
          router.push('/order-success')
        } else {
          const result = await axios.post('/api/order/online-pay', payload)
          showToast('Redirecting to secure payment…', 'info')
          window.location.href = result.data.url
        }
      } catch (error) {
        submittedRef.current = false
        console.log(error)
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Order failed. Please try again.'
        showToast(message, 'error')
        router.push(`/order-failed?reason=${encodeURIComponent(message)}`)
      }
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white/10 backdrop-blue-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8"
      >
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">Delivery Address</h2>
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition"
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
          />
          <textarea
            placeholder="Full Address"
            className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition"
            onChange={(e) => setAddress(e.target.value)}
            value={address}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="city"
              className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition"
              onChange={(e) => setCity(e.target.value)}
              value={city}
            />
            <input
              type="text"
              placeholder="Pincode"
              className="w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition"
              onChange={(e) => setPincode(e.target.value)}
              value={pincode}
            />
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">Order Summary</h2>
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
            <Image
              src={item.product.image1}
              alt="img"
              width={120}
              height={120}
              className="w-20 h-20 object-contain rounded-lg bg-white"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-100">{item.product?.title}</p>
              <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
            </div>
            <p className="font-bold text-green-400">₹ {pricing.productsTotal}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-300">Have a coupon?</p>
              <button
                type="button"
                onClick={openCouponsModal}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <FaTag size={12} />
                View available coupons
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                disabled={couponLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {couponLoading ? <ClipLoader size={16} color="white" /> : 'Apply'}
              </button>
            </div>
          </div>
          {couponError && <p className="text-xs text-red-400">{couponError}</p>}
          {appliedCoupon && (
            <p className="text-xs text-green-400">
              Coupon {appliedCoupon.code} applied — saved ₹{appliedCoupon.couponDiscount}
            </p>
          )}

          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span>{item.product.freeDelivery ? 'Free' : `₹${pricing.deliveryCharge}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span>₹{pricing.serviceCharge}</span>
            </div>
            {pricing.couponDiscount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Coupon Discount</span>
                <span>-₹{pricing.couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white">
              <span>Total</span>
              <span className="text-green-400">₹{pricing.totalAmount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white">Payment Method</p>
            <div className="flex gap-3">
              <motion.button
                type="button"
                whileHover={codAvailable ? { scale: 1.03 } : undefined}
                whileTap={codAvailable ? { scale: 0.97 } : undefined}
                onClick={() => codAvailable && setPaymentMethod('cod')}
                disabled={!codAvailable}
                className={`flex-1 py-3 text-white rounded-xl font-semibold transition border-2
              ${
                paymentMethod === 'cod' && codAvailable
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-white/10 border-white/20'
              }
              ${!codAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'}`}
              >
                Cash on Delivery
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 text-white py-3 rounded-xl font-semibold flex 
                items-center justify-center gap-2 transition border-2
              ${
                paymentMethod === 'stripe'
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-white/10 border-white/20 hover:border-blue-400'
              }
              `}
              >
                <FaStripe className="text-xl border rounded bg-green-300 text-black p-[2px]" />
                Stripe
              </motion.button>
            </div>
            {!codAvailable && (
              <p className="text-xs text-amber-300">
                Cash on Delivery is not enabled for this product. Please pay with Stripe.
              </p>
            )}
          </div>

          <motion.button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            whileHover={placingOrder ? undefined : { scale: 1.03 }}
            whileTap={placingOrder ? undefined : { scale: 0.97 }}
            className="w-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 py-4 rounded-2xl font-semibold text-lg transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {placingOrder ? (
              <ClipLoader size={20} color="white" />
            ) : paymentMethod === 'cod' ? (
              'Place Order'
            ) : (
              'Proceed to Secure Payment'
            )}
          </motion.button>
        </div>
      </motion.div>

      {showCoupons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowCoupons(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#061526] p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Available coupons</h3>
              <button
                type="button"
                onClick={() => setShowCoupons(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {couponsLoading ? (
              <div className="flex justify-center py-10">
                <ClipLoader size={28} color="#34d399" />
              </div>
            ) : availableCoupons.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                No active coupons right now. Check back later.
              </p>
            ) : (
              <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {availableCoupons.map((c) => (
                  <li
                    key={c.code}
                    className={`rounded-xl border p-3 ${
                      c.eligible
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-white/10 bg-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold tracking-wide text-emerald-400">
                          {c.code}
                        </p>
                        <p className="mt-1 text-sm text-white">{formatCouponOffer(c)}</p>
                        {c.minOrderAmount > 0 && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            Min. order ₹{c.minOrderAmount}
                          </p>
                        )}
                        {c.expiresAt && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Valid till{' '}
                            {new Date(c.expiresAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                        {!c.eligible && (
                          <p className="mt-1 text-xs text-amber-400">
                            Order total too low for this coupon
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={!c.eligible || couponLoading}
                        onClick={() => handleApplyCoupon(c.code)}
                        className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Checkout

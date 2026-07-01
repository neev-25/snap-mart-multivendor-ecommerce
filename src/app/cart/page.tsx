'use client'
import axios from 'axios'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import EmptyState from '@/component/ui/EmptyState'
import PageHeader from '@/component/ui/PageHeader'
import { useKeyedActionLock } from '@/hooks/useActionLock'
import { showToast } from '@/component/ui/ToastProvider'
import { ClipLoader } from 'react-spinners'
import { calculateOrderPricing } from '@/lib/orderPricing'

function Page() {
  const [cart, setCart] = useState<any[]>([])
  const router = useRouter()
  const { run: runCartAction, isBusy } = useKeyedActionLock()

  const getCart = async () => {
    try {
      const result = await axios.get('/api/user/cart/get')
      setCart(result.data.cart || [])
    } catch (error) {
      console.log(error)
      alert('Failed to load cart')
    }
  }

  useEffect(() => {
    getCart()
  }, [])

  const handleUpdateCart = async (productId: string, quantity: number) => {
    if (quantity < 1) return
    await runCartAction(`update-${productId}`, async () => {
      try {
        await axios.post('/api/user/cart/update', { productId, quantity })
        await getCart()
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } }
        showToast(err?.response?.data?.message || 'Failed to update quantity', 'error')
        await getCart()
        throw new Error('update failed')
      }
    })
  }

  const handleRemove = async (productId: string) => {
    await runCartAction(`remove-${productId}`, async () => {
      try {
        setCart((prev) => prev.filter((i) => String(i.product._id) !== String(productId)))
        await axios.post('/api/user/cart/remove', { productId })
        showToast('Removed from cart')
      } catch {
        showToast('Failed to remove item', 'error')
        await getCart()
        throw new Error('remove failed')
      }
    })
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  const cartTotals = useMemo(() => {
    let productsTotal = 0
    let deliveryTotal = 0
    let serviceTotal = 0

    for (const item of cart) {
      const pricing = calculateOrderPricing(item.product, item.quantity)
      productsTotal += pricing.productsTotal
      deliveryTotal += pricing.deliveryCharge
      serviceTotal += pricing.serviceCharge
    }

    return {
      productsTotal,
      deliveryTotal,
      serviceTotal,
      estimatedTotal: productsTotal + deliveryTotal + serviceTotal,
    }
  }, [cart])

  return (
    <div className="app-container">
      <PageHeader
        title="Shopping Cart"
        subtitle={totalItems ? `${totalItems} item${totalItems === 1 ? '' : 's'} in your cart` : undefined}
      />

      {cart.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add products from the store to get started."
          action={
            <button type="button" className="btn-primary" onClick={() => router.push('/category')}>
              Browse Products
            </button>
          }
        />
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          <div className="space-y-4 lg:col-span-2">
            {cart.map((item) => {
              const linePricing = calculateOrderPricing(item.product, item.quantity)
              const productId = String(item.product._id)
              const atMaxStock = item.quantity >= (item.product.stock ?? 0)
              return (
              <div
                key={productId}
                className="glass-card-strong flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white/5 sm:mx-0">
                  <Image
                    alt={item.product.title}
                    src={item.product.image1}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold sm:text-lg">{item.product.title}</h3>
                  <p className="mt-1 font-medium text-emerald-400">₹{item.product.price}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isBusy(`update-${item.product._id}`)}
                      onClick={() => handleUpdateCart(item.product._id, item.quantity - 1)}
                      className="btn-secondary h-9 w-9 rounded-lg p-0 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      disabled={isBusy(`update-${productId}`) || atMaxStock}
                      onClick={() => handleUpdateCart(item.product._id, item.quantity + 1)}
                      className="btn-secondary h-9 w-9 rounded-lg p-0 disabled:opacity-50"
                      title={atMaxStock ? 'Max stock reached' : 'Increase quantity'}
                    >
                      +
                    </button>
                  </div>
                  {atMaxStock && (
                    <p className="mt-1 text-xs text-amber-400">Max stock: {item.product.stock}</p>
                  )}
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <p className="text-right text-lg font-bold text-amber-400">
                    ₹{linePricing.totalAmount}
                  </p>
                  <p className="text-right text-xs text-gray-500">
                    incl. delivery & service
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/checkout/${item.product._id}`)}
                    className="btn-primary text-sm"
                  >
                    Checkout
                  </button>
                  <button
                    type="button"
                    disabled={isBusy(`remove-${item.product._id}`)}
                    onClick={() => handleRemove(item.product._id)}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {isBusy(`remove-${item.product._id}`) ? (
                      <ClipLoader size={14} color="#f87171" />
                    ) : (
                      'Remove'
                    )}
                  </button>
                </div>
              </div>
            )})}
          </div>

          <div className="glass-card-strong h-fit p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Items ({totalItems})</span>
                <span className="text-gray-200">{cart.length} product{cart.length === 1 ? '' : 's'}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span className="text-gray-200">₹{cartTotals.productsTotal}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Est. delivery</span>
                <span className="text-gray-200">
                  {cartTotals.deliveryTotal === 0 ? 'Free' : `₹${cartTotals.deliveryTotal}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Est. service charge</span>
                <span className="text-gray-200">₹{cartTotals.serviceTotal}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <span>Estimated total</span>
                <span className="text-emerald-400">₹{cartTotals.estimatedTotal}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Checkout each product individually, or pay for everything at once.
            </p>
            {cart.length > 1 && (
              <button
                type="button"
                onClick={() => router.push('/checkout/cart')}
                className="btn-primary mt-4 w-full py-3"
              >
                Checkout all items
              </button>
            )}
            {cart.length === 1 && (
              <button
                type="button"
                onClick={() => router.push('/checkout/cart')}
                className="btn-primary mt-4 w-full py-3"
              >
                Checkout cart
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Page

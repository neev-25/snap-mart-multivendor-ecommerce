'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'
import { motion } from 'motion/react'
import { FaTimesCircle } from 'react-icons/fa'

function OrderFailedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')

  return (
    <div className="app-container flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card-strong w-full max-w-md border-red-500/20 p-8 text-center sm:p-10"
      >
        <FaTimesCircle className="mx-auto text-red-400" size={80} />
        <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">Order failed</h1>
        <p className="mt-3 text-gray-400">
          {reason || 'Something went wrong while placing your order.'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Check your cart and try again, or use another payment method.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/cart')}
            className="btn-primary flex-1 py-3"
          >
            Back to cart
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/orders')}
            className="btn-secondary flex-1 py-3"
          >
            View orders
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

function OrderFailed() {
  return (
    <Suspense
      fallback={
        <div className="app-container flex min-h-[60vh] items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <OrderFailedContent />
    </Suspense>
  )
}

export default OrderFailed

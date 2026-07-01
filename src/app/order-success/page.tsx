'use client'
import React from 'react'
import { motion } from 'motion/react'
import { FaBox, FaCheckCircle } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

function OrderSuccess() {
  const router = useRouter()

  return (
    <div className="app-container flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card-strong w-full max-w-md p-8 text-center sm:p-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <FaCheckCircle className="text-emerald-400" size={80} />
        </motion.div>
        <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">Order placed successfully</h1>
        <div className="mt-4 flex flex-col items-center gap-2 text-gray-400">
          <FaBox size={28} className="text-blue-400" />
          <p className="text-sm">Your order is being processed.</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/orders')}
          className="btn-primary mt-8 w-full py-3"
        >
          View orders
        </motion.button>
      </motion.div>
    </div>
  )
}

export default OrderSuccess

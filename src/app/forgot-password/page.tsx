'use client'
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import { showToast } from '@/component/ui/ToastProvider'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setSent(true)
      showToast(res.data.message || 'Check your email')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message || 'Something went wrong', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-10">
      <motion.div
        className="glass-card-strong w-full max-w-md p-6 sm:p-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">Forgot password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter your email and we&apos;ll send a reset link. In test mode, mail goes to TEST_MAIL.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-400">
              If an account exists for that email, a reset link has been sent.
            </p>
            <button type="button" className="btn-secondary w-full py-3" onClick={() => router.push('/login')}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email address"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? <ClipLoader size={20} color="white" /> : 'Send reset link'}
            </button>
            <button type="button" className="text-sm text-gray-400 hover:text-white" onClick={() => router.push('/login')}>
              Back to sign in
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default ForgotPassword

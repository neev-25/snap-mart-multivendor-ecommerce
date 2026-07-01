'use client'
import React, { Suspense, useState } from 'react'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { showToast } from '@/component/ui/ToastProvider'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (!token) {
      showToast('Invalid reset link', 'error')
      return
    }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, password })
      showToast('Password updated successfully')
      router.push('/login')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message || 'Reset failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="glass-card-strong w-full max-w-md p-6 text-center sm:p-8">
        <p className="text-red-400">This reset link is invalid.</p>
        <button type="button" className="btn-primary mt-6 w-full py-3" onClick={() => router.push('/forgot-password')}>
          Request a new link
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="glass-card-strong w-full max-w-md p-6 sm:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-bold text-white">Set new password</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="New password"
            className="input-field pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={6}
          placeholder="Confirm password"
          className="input-field"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
          {loading ? <ClipLoader size={20} color="white" /> : 'Update password'}
        </button>
      </form>
    </motion.div>
  )
}

function ResetPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-10">
      <Suspense fallback={<div className="text-gray-400">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}

export default ResetPassword

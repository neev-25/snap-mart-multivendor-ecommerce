'use client'
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { ClipLoader } from 'react-spinners'
import { FcGoogle } from 'react-icons/fc'
import { GoChevronRight } from 'react-icons/go'
import { signIn } from 'next-auth/react'
import { showToast } from '@/component/ui/ToastProvider'
import { Suspense } from 'react'

const SignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        showToast('Sign in failed. Check email and password.', 'error')
        return
      }
      showToast('Signed in successfully')
      router.refresh()
      router.push(callbackUrl)
    } catch (error) {
      console.log(error)
      showToast('Sign in failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-10">
      <AnimatePresence>
        <motion.div
          className="glass-card-strong w-full max-w-md p-6 sm:p-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to your <span className="text-blue-400">SnapMart</span> account
            </p>
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder="Email address"
              className="input-field"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                className="input-field pr-11"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>

            <motion.button
              disabled={loading}
              type="submit"
              className="btn-primary mt-2 w-full py-3"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <ClipLoader size={20} color="white" /> : 'Sign In'}
            </motion.button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <motion.button
              type="button"
              onClick={() => signIn('google', { callbackUrl })}
              className="btn-secondary w-full py-3"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <FcGoogle className="h-5 w-5" />
              Continue with Google
              <GoChevronRight />
            </motion.button>

            <p className="text-center text-sm text-gray-400">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="font-medium text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </p>

            <p className="text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="font-medium text-blue-400 hover:underline"
              >
                Register
              </button>
            </p>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-400">Loading…</div>}>
      <SignIn />
    </Suspense>
  )
}

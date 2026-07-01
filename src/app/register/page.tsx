'use client'
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GoChevronRight } from 'react-icons/go'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import { signIn } from 'next-auth/react'

const Register = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post('/api/auth/register', { name, email, password })
      setEmail('')
      setName('')
      setPassword('')
      router.push('/login')
    } catch (error) {
      console.log(error)
      alert('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-10">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="glass-card-strong w-full max-w-lg p-6 text-center sm:p-10"
          >
            <h1 className="text-3xl font-bold text-blue-400">Join SnapMart</h1>
            <p className="mt-3 text-gray-400">
              One marketplace for shoppers, vendors, and admins.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { label: 'Shopper', icon: '👤' },
                { label: 'Vendor', icon: '🏪' },
                { label: 'Admin', icon: '🛡️' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-card flex flex-col items-center gap-2 px-2 py-4"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              You&apos;ll choose your role after signing up.
            </p>
            <motion.button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary mt-8 w-full py-3"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue <GoChevronRight />
            </motion.button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="glass-card-strong w-full max-w-md p-6 sm:p-8"
          >
            <h1 className="mb-6 text-center text-2xl font-semibold text-white">
              Create your account
            </h1>
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <input
                type="text"
                required
                placeholder="Full name"
                className="input-field"
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
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
                {loading ? <ClipLoader size={20} color="white" /> : 'Register'}
              </motion.button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-gray-500">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <motion.button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="btn-secondary w-full py-3"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <FcGoogle className="h-5 w-5" />
                Continue with Google
                <GoChevronRight />
              </motion.button>

              <p className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="font-medium text-blue-400 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Register

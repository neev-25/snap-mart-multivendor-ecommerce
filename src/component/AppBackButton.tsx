'use client'

import { usePathname, useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

const HIDDEN_PATHS = ['/login', '/register']

export default function AppBackButton() {
  const pathname = usePathname()
  const router = useRouter()

  if (!pathname || pathname === '/' || HIDDEN_PATHS.includes(pathname)) {
    return null
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className="fixed top-[calc(var(--nav-height)+0.75rem)] left-4 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/90 sm:px-4"
    >
      <FaArrowLeft size={14} />
      Back
    </button>
  )
}

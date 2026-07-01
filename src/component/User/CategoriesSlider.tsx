'use client'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

const categories = [
  { label: 'Fashion & Lifestyle', icon: '👗' },
  { label: 'Electronics & Gadgets', icon: '📱' },
  { label: 'Home & Living', icon: '🏠' },
  { label: 'Beauty & Personal Care', icon: '💄' },
  { label: 'Toys, Kids & Baby', icon: '🧸' },
  { label: 'Food & Grocery', icon: '🛒' },
  { label: 'Sports & Fitness', icon: '🏀' },
  { label: 'Automotive Accessories', icon: '🚗' },
  { label: 'Gifts & Handcrafts', icon: '🎁' },
  { label: 'Books & Stationery', icon: '📚' },
]

function CategoriesSlider() {
  const [startIndex, setStartIndex] = useState(0)
  const router = useRouter()
  const visibleCount = 5

  const nextSlice = () => {
    setStartIndex((prev) => (prev + visibleCount) % categories.length)
  }
  const prevSlice = () => {
    setStartIndex((prev) => (prev - visibleCount < 0 ? categories.length - visibleCount : prev - visibleCount))
  }

  useEffect(() => {
    if (categories.length <= visibleCount) return
    const interval = setInterval(nextSlice, 5000)
    return () => clearInterval(interval)
  }, [])

  const visible = categories.slice(startIndex, startIndex + visibleCount)
  const padded =
    visible.length < visibleCount
      ? [...visible, ...categories.slice(0, visibleCount - visible.length)]
      : visible

  return (
    <section className="app-container py-8 sm:py-12">
      <PageHeaderLocal title="Shop by Category" subtitle="Browse curated collections" />
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={startIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          >
            {padded.map((item, index) => (
              <motion.button
                type="button"
                key={`${item.label}-${index}`}
                whileHover={{ y: -3 }}
                className="glass-card flex flex-col items-center gap-2 px-3 py-5 text-center transition hover:border-blue-500/30 sm:py-6"
                onClick={() =>
                  router.push(`/category?category=${encodeURIComponent(item.label)}`)
                }
              >
                <span className="text-3xl sm:text-4xl">{item.icon}</span>
                <p className="text-xs font-medium leading-snug text-gray-200 sm:text-sm">
                  {item.label}
                </p>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>

        {categories.length > visibleCount && (
          <>
            <button
              type="button"
              onClick={prevSlice}
              className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-2.5 text-white backdrop-blur sm:block lg:-left-4"
              aria-label="Previous categories"
            >
              <FaAngleLeft />
            </button>
            <button
              type="button"
              onClick={nextSlice}
              className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/10 bg-black/70 p-2.5 text-white backdrop-blur sm:block lg:-right-4"
              aria-label="Next categories"
            >
              <FaAngleRight />
            </button>
          </>
        )}
      </div>
    </section>
  )
}

function PageHeaderLocal({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <h2 className="section-title">{title}</h2>
      <p className="section-subtitle">{subtitle}</p>
    </div>
  )
}

export default CategoriesSlider

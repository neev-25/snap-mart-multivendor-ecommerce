'use client'
import React, { useEffect, useState } from 'react'
import slide1 from '@/assets/slider1.png'
import slide2 from '@/assets/slider2.png'
import slide3 from '@/assets/slider3.jpg'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

function Slider() {
  const [current, setCurrent] = useState(0)
  const router = useRouter()
  const slides = [
    {
      image: slide1,
      title: 'RUN ON AIR',
      subtitle: 'DO IT NOW.',
      description: 'Running Shoes',
      button: 'Shop Now',
    },
    {
      image: slide2,
      title: 'STYLE & COMFORT',
      subtitle: 'NEW COLLECTION',
      description: "Women's Fashion",
      button: 'Explore',
    },
    {
      image: slide3,
      title: 'STEP INTO POWER',
      subtitle: 'FEEL THE SPEED',
      description: 'Smart Gadgets',
      button: 'Discover',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative h-[55vh] min-h-[320px] sm:h-[65vh] lg:h-[72vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <Image
              src={slides[current].image}
              alt={slides[current].description}
              fill
              priority
              className="object-cover opacity-60"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20">
              <motion.p
                className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300 sm:text-sm"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {slides[current].subtitle}
              </motion.p>
              <motion.h1
                className="mt-2 max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {slides[current].description}
              </motion.h1>
              <motion.p
                className="mt-3 max-w-md text-base text-gray-300 sm:text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {slides[current].title}
              </motion.p>
              <motion.button
                type="button"
                className="btn-primary mt-6 w-fit px-6 py-3"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/category')}
              >
                {slides[current].button}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-6 sm:right-6">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`relative h-10 w-14 overflow-hidden rounded-lg border-2 transition sm:h-12 sm:w-16 ${
                index === current ? 'border-blue-400 shadow-lg shadow-blue-500/30' : 'border-white/30 opacity-70'
              }`}
            >
              <Image src={slide.image} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Slider

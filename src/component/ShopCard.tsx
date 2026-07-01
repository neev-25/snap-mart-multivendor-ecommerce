'use client'

import { IUser } from '@/model/user.model'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'
import { FaCheckCircle, FaMapMarkerAlt, FaStore } from 'react-icons/fa'

type ShopCardProps = {
  vendor: IUser
  productCount?: number
  index?: number
}

function shopInitial(name?: string) {
  if (!name) return 'S'
  return name.trim().charAt(0).toUpperCase()
}

export default function ShopCard({ vendor, productCount = 0, index = 0 }: ShopCardProps) {
  const router = useRouter()

  return (
    <motion.button
      type="button"
      onClick={() => router.push(`/shopDetails/${vendor._id}`)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={{ y: -6 }}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] text-left shadow-lg transition-all duration-300 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10"
    >
      {/* Banner / logo */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-[#1e1e2a] via-[#14141c] to-[#0a0a10]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_60%)]" />

        {vendor.image ? (
          <div className="relative flex h-full w-full items-center justify-center p-5 sm:p-6">
            <Image
              src={vendor.image}
              alt={vendor.shopName || 'Shop'}
              fill
              className="object-contain p-4 transition duration-500 group-hover:scale-105"
              sizes="(max-width:640px) 50vw, 280px"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <span className="text-2xl font-bold text-blue-400">{shopInitial(vendor.shopName)}</span>
            </div>
            <FaStore className="text-gray-600" size={20} />
          </div>
        )}

        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25 sm:text-[11px] sm:px-2.5 sm:py-1">
          <FaCheckCircle size={10} />
          Verified
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h2 className="line-clamp-1 text-sm font-semibold text-white sm:text-base">
          {vendor.shopName || 'Unnamed Shop'}
        </h2>

        {vendor.shopAddress && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-gray-500 sm:text-xs">
            <FaMapMarkerAlt className="mt-0.5 shrink-0 text-gray-600" size={10} />
            <span className="line-clamp-2">{vendor.shopAddress}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-[11px] text-gray-500 sm:text-xs">
            {productCount > 0 ? (
              <>
                <span className="font-medium text-gray-400">{productCount}</span> product
                {productCount === 1 ? '' : 's'}
              </>
            ) : (
              'No products yet'
            )}
          </span>
          <span className="rounded-lg bg-blue-600/15 px-2.5 py-1 text-[11px] font-medium text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white sm:text-xs">
            View shop →
          </span>
        </div>
      </div>
    </motion.button>
  )
}

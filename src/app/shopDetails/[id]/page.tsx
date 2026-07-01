'use client'

import ProductCard from '@/component/ProductCard'
import EmptyState from '@/component/ui/EmptyState'
import PageHeader from '@/component/ui/PageHeader'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData'
import UseGetAllVendor from '@/hooks/UseGetAllVendor'
import { RootState } from '@/redux/store'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import Image from 'next/image'
import axios from 'axios'
import { FaCheckCircle, FaMapMarkerAlt, FaStore } from 'react-icons/fa'

function ShopDetailsPage() {
  const params = useParams()
  const vendorId = params.id as string
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  UseGetAllProducts()
  UseGetAllVendor()

  const { allVendorData, allProductsData } = useSelector((state: RootState) => state.vendor)
  const vendor = allVendorData.find((v) => String(v._id) === vendorId)

  useEffect(() => {
    if (!vendorId) return
    axios
      .get(`/api/user/follow/status?vendorId=${vendorId}`)
      .then((res) => setFollowing(res.data.following))
      .catch(() => setFollowing(false))
  }, [vendorId])

  const toggleFollow = async () => {
    setFollowLoading(true)
    try {
      const res = await axios.post('/api/user/follow/toggle', { vendorId })
      setFollowing(res.data.following)
    } catch {
      alert('Please sign in to follow shops')
    } finally {
      setFollowLoading(false)
    }
  }

  if (!vendor) {
    return (
      <div className="app-container flex min-h-[50vh] items-center justify-center">
        <EmptyState title="Shop not found" description="This vendor may no longer be available." />
      </div>
    )
  }

  const vendorProducts = Array.isArray(allProductsData)
    ? allProductsData.filter(
        (p) =>
          String(typeof p.vendor === 'object' ? p.vendor?._id : p.vendor) === String(vendor._id) &&
          p.isActive &&
          p.verificationStatus === 'approved'
      )
    : []

  return (
    <div className="app-container pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card-strong overflow-hidden"
      >
        <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          <div className="relative flex min-h-[200px] items-center justify-center bg-gradient-to-br from-[#1e1e2a] via-[#14141c] to-[#0a0a10] p-8 md:min-h-[260px]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />
            {vendor.image ? (
              <div className="relative h-32 w-full sm:h-40">
                <Image src={vendor.image} alt={vendor.shopName || 'Shop'} fill className="object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <FaStore size={32} className="text-gray-400" />
                </div>
                <span className="text-sm">No shop image</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                <FaCheckCircle size={12} />
                Verified seller
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                {vendorProducts.length} product{vendorProducts.length === 1 ? '' : 's'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white sm:text-3xl">{vendor.shopName}</h1>

            {vendor.shopAddress && (
              <p className="mt-2 flex items-start gap-2 text-sm text-gray-400">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-gray-500" size={14} />
                {vendor.shopAddress}
              </p>
            )}

            {vendor.gstNumber && (
              <p className="mt-2 text-xs text-gray-500">GSTIN: {vendor.gstNumber}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followLoading}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  following
                    ? 'border border-white/20 bg-white/10 text-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {followLoading ? '...' : following ? 'Following' : 'Follow shop'}
              </button>
              <p className="text-xs text-gray-500">
                Get email when this shop adds new products
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 sm:mt-10">
        <PageHeader
          title={`Products from ${vendor.shopName}`}
          subtitle={
            vendorProducts.length
              ? `${vendorProducts.length} listing${vendorProducts.length === 1 ? '' : 's'} available`
              : undefined
          }
        />

        {vendorProducts.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="This shop hasn't listed any approved products."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {vendorProducts.map((p) => (
              <ProductCard key={String(p._id)} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShopDetailsPage

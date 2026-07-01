'use client'

import ShopCard from '@/component/ShopCard'
import UseGetAllVendor from '@/hooks/UseGetAllVendor'
import { IUser } from '@/model/user.model'
import { IProduct } from '@/model/product.model'
import { RootState } from '@/redux/store'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import EmptyState from '@/component/ui/EmptyState'
import PageHeader from '@/component/ui/PageHeader'

type ShopGridProps = {
  embedded?: boolean
}

export default function ShopGrid({ embedded = false }: ShopGridProps) {
  UseGetAllVendor()
  const router = useRouter()
  const { allVendorData, allProductsData } = useSelector((state: RootState) => state.vendor)

  const verifiedVendors = Array.isArray(allVendorData)
    ? allVendorData.filter((v: IUser) => v.verificationStatus === 'approved')
    : []

  const productCountByVendor = useMemo(() => {
    const counts = new Map<string, number>()
    if (!Array.isArray(allProductsData)) return counts

    for (const p of allProductsData as IProduct[]) {
      const vendorId =
        typeof p.vendor === 'object' && p.vendor?._id
          ? String(p.vendor._id)
          : String(p.vendor)
      if (!vendorId) continue
      counts.set(vendorId, (counts.get(vendorId) || 0) + 1)
    }
    return counts
  }, [allProductsData])

  if (!verifiedVendors.length) {
    return embedded ? null : (
      <div className="app-container">
        <EmptyState title="No shops found" description="Verified sellers will appear here soon." />
      </div>
    )
  }

  const content = (
    <>
      <PageHeader
        title="Explore Trusted Shops"
        subtitle="Discover verified vendors and their exclusive products"
        centered={embedded}
        action={
          !embedded ? (
            <button
              type="button"
              onClick={() => router.push('/category')}
              className="btn-secondary text-sm"
            >
              Browse all products
            </button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {verifiedVendors.map((v: IUser, i: number) => (
          <ShopCard
            key={String(v._id)}
            vendor={v}
            productCount={productCountByVendor.get(String(v._id)) || 0}
            index={i}
          />
        ))}
      </div>
    </>
  )

  if (embedded) {
    return <section className="app-container py-8 sm:py-12">{content}</section>
  }

  return <div className="app-container pb-8">{content}</div>
}

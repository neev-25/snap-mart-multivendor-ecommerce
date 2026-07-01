'use client'

import ProductCard from '@/component/ProductCard'
import EmptyState from '@/component/ui/EmptyState'
import PageHeader from '@/component/ui/PageHeader'
import UseGetWishlist from '@/hooks/UseGetWishlist'
import { RootState } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'

function WishlistPage() {
  UseGetWishlist()
  const wishlist = useSelector((state: RootState) => state.user.wishlist)
  const userData = useSelector((state: RootState) => state.user.userData)

  if (!userData) {
    return (
      <div className="app-container flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-400">Loading wishlist...</p>
      </div>
    )
  }

  if (userData.role && userData.role !== 'user') {
    return (
      <div className="app-container flex min-h-[50vh] items-center justify-center">
        <EmptyState
          title="Customer accounts only"
          description="Wishlist is available for shopper accounts."
        />
      </div>
    )
  }

  return (
    <div className="app-container">
      <PageHeader
        title="My Wishlist"
        subtitle={`${wishlist.length} saved item${wishlist.length === 1 ? '' : 's'}`}
      />
      {wishlist.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Browse products and tap the heart to save them for later."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {wishlist.map((product) => (
            <ProductCard key={String(product._id)} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage

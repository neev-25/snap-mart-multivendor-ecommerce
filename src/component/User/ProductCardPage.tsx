import { IProduct } from '@/model/product.model'
import { RootState } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'
import ProductCard from '../ProductCard'
import PageHeader from '@/component/ui/PageHeader'
import EmptyState from '@/component/ui/EmptyState'

function ProductCardPage() {
  const { allProductsData } = useSelector((state: RootState) => state.vendor)
  const products = Array.isArray(allProductsData)
    ? allProductsData.filter(
        (p: { isActive?: boolean; verificationStatus?: string }) =>
          p.isActive === true && p.verificationStatus === 'approved'
      )
    : []

  return (
    <section className="app-container py-8 sm:py-12">
      <PageHeader
        title="Trending Products"
        subtitle="Shop from approved sellers with guaranteed quality"
        centered
      />
      {!products.length ? (
        <EmptyState title="No products available" description="Check back soon for new listings." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {products.map((p: IProduct) => (
            <ProductCard key={String(p._id)} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}

export default ProductCardPage

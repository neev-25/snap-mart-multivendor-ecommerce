'use client'

import ProductCard from '@/component/ProductCard'
import EmptyState from '@/component/ui/EmptyState'
import PageHeader from '@/component/ui/PageHeader'
import { IProduct } from '@/model/product.model'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const categoryList = [
  { label: 'all', icon: '📁' },
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

function buildCategoryUrl(filters: { category?: string; shop?: string; query?: string }) {
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)
  if (filters.shop && filters.shop !== 'all') params.set('shop', filters.shop)
  if (filters.query?.trim()) params.set('query', filters.query.trim())
  const query = params.toString()
  return query ? `/category?${query}` : '/category'
}

function CategoriesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { allVendorData } = useSelector((state: RootState) => state.vendor)

  const selectedCategory = searchParams.get('category') || 'all'
  const selectedShop = searchParams.get('shop') || 'all'
  const searchQuery = searchParams.get('query') || ''

  const [searchInput, setSearchInput] = useState(searchQuery)
  const [shopSearch, setShopSearch] = useState('')
  const [displayProducts, setDisplayProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  const updateFilters = useCallback(
    (next: { category?: string; shop?: string; query?: string }) => {
      router.replace(
        buildCategoryUrl({
          category: next.category ?? selectedCategory,
          shop: next.shop ?? selectedShop,
          query: next.query ?? searchQuery,
        })
      )
    },
    [router, selectedCategory, selectedShop, searchQuery]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) updateFilters({ query: searchInput })
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, updateFilters])

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const param = new URLSearchParams()
        if (searchQuery) param.append('query', searchQuery)
        if (selectedCategory !== 'all') param.append('category', selectedCategory)
        if (selectedShop !== 'all') param.append('shop', selectedShop)
        const result = await axios.get(`/api/search?${param.toString()}`)
        setDisplayProducts(result.data.products ?? [])
      } catch (error) {
        console.log(error)
        setDisplayProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [selectedCategory, searchQuery, selectedShop])

  const filterShops = !shopSearch
    ? []
    : allVendorData.filter((v: IUser) =>
        v.shopName?.toLowerCase().includes(shopSearch.toLowerCase())
      )

  return (
    <div className="app-container">
      <PageHeader
        title="Browse Products"
        subtitle="Filter by category, shop, or search keywords"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="glass-card space-y-5 p-4 lg:sticky lg:top-24 lg:self-start">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
              Search
            </label>
            <input
              type="text"
              placeholder="Search products..."
              className="input-field"
              onChange={(e) => setSearchInput(e.target.value)}
              value={searchInput}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
              Categories
            </label>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {categoryList.map((cat) => (
                <button
                  type="button"
                  onClick={() => {
                    updateFilters({ category: cat.label, shop: 'all', query: searchInput })
                    setShopSearch('')
                  }}
                  key={cat.label}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selectedCategory === cat.label
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label === 'all' ? 'All Categories' : cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
              Shop
            </label>
            <input
              type="text"
              placeholder="Search shop..."
              className="input-field"
              onChange={(e) => setShopSearch(e.target.value)}
              value={shopSearch}
            />
            {shopSearch && filterShops.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-white/10">
                {filterShops.map((v: IUser) => (
                  <button
                    type="button"
                    key={String(v._id)}
                    onClick={() => {
                      setShopSearch(v.shopName || '')
                      updateFilters({ shop: String(v._id), query: searchInput })
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    {v.shopName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center text-gray-400">
              Loading products...
            </div>
          ) : displayProducts.length === 0 ? (
            <EmptyState title="No products found" description="Try a different category or search term." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {displayProducts.map((p) => (
                <ProductCard key={String(p._id)} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="app-container flex min-h-[50vh] items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  )
}

export default CategoriesPage

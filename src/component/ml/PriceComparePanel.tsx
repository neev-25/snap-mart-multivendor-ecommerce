'use client'

import axios from 'axios'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { FaBalanceScale, FaChartLine, FaStore } from 'react-icons/fa'

function verdictLabel(v: string) {
  if (v === 'best_value') return 'Best value'
  if (v === 'cheapest') return 'Lowest price'
  if (v === 'premium') return 'Premium seller'
  return 'Same product'
}

function verdictStyle(v: string) {
  if (v === 'best_value') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  if (v === 'cheapest') return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  if (v === 'premium') return 'text-violet-400 bg-violet-500/10 border-violet-500/30'
  return 'text-gray-400 bg-white/5 border-white/10'
}

function truncateTitle(title: string | undefined | null, max = 35) {
  const text = String(title ?? 'Product listing')
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export default function PriceComparePanel({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    axios
      .get(`/api/ml/pricing/compare?productId=${productId}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) {
    return (
      <div className="glass-card flex justify-center p-8">
        <ClipLoader color="#34d399" size={28} />
      </div>
    )
  }

  if (!data) return null

  const hasOtherSellers = data.comparisons?.length > 0

  return (
    <section className="glass-card border-violet-500/20 p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <FaBalanceScale className="mt-1 shrink-0 text-violet-400" size={22} />
        <div>
          <h3 className="text-lg font-bold text-white">Price comparison</h3>
          <p className="text-sm text-gray-400">
            Compare prices for{' '}
            <span className="text-violet-300">{data.productIdentity}</span> across SnapMart
            vendors.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          {data.listingCount} seller{data.listingCount === 1 ? '' : 's'} listed
        </span>
      </div>

      <div className="mb-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <FaChartLine className="text-violet-300" />
          <span className="text-sm font-medium text-violet-200">
            Fair price estimate: ₹{data.fairPrice}
          </span>
          <span className="text-xs text-gray-400">
            · This listing: ₹{data.currentListing.price} ({data.currentListing.vendorName || 'seller'})
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-300">{data.priceSummary}</p>
      </div>

      {data.cheapestOffer && hasOtherSellers && (
        <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-300">
            <FaStore className="mr-1 inline" />
            Best deal: ₹{data.cheapestOffer.price} at{' '}
            {data.cheapestOffer.isCurrentListing ? (
              'this seller (you are here)'
            ) : (
              <Link
                href={`/viewProduct/${data.cheapestOffer.productId}`}
                className="underline hover:text-emerald-200"
              >
                {data.cheapestOffer.vendorName || 'another seller'}
              </Link>
            )}
          </p>
        </div>
      )}

      {!hasOtherSellers ? (
        <div className="space-y-2 text-sm text-gray-500">
          <p>
            No other approved seller lists &quot;{data.productIdentity}&quot; on SnapMart yet.
          </p>
          {data.pendingMatchesCount > 0 && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              {data.pendingMatchesCount} matching listing
              {data.pendingMatchesCount === 1 ? '' : 's'} from other seller
              {data.pendingMatchesCount === 1 ? '' : 's'} found but still{' '}
              <strong>pending admin approval</strong>. Approve them in the admin panel to enable
              price comparison.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-gray-500">
                <th className="py-2 pr-3">Seller / shop</th>
                <th className="py-2 pr-3">Listing</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">vs this page</th>
                <th className="py-2 pr-3">Rating</th>
                <th className="py-2 pr-3">Match</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10 bg-blue-500/10">
                <td className="py-3 pr-3 font-medium text-blue-300">
                  {data.currentListing.vendorName || 'This seller'}
                  <span className="ml-1 text-xs">(viewing)</span>
                </td>
                <td className="py-3 pr-3 text-gray-300">
                  {truncateTitle(data.currentListing?.title)}
                </td>
                <td className="py-3 pr-3 font-semibold text-emerald-400">
                  ₹{data.currentListing.price}
                </td>
                <td className="py-3 pr-3 text-gray-500">—</td>
                <td className="py-3 pr-3">★ {data.currentListing.avgRating || '—'}</td>
                <td className="py-3 pr-3">100%</td>
                <td className="py-3 text-xs text-blue-300">Current</td>
              </tr>
              {data.comparisons.map((c: any, idx: number) => (
                <tr key={c.productId ?? idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-3 font-medium text-white">
                    {c.vendorName || 'Other seller'}
                  </td>
                  <td className="py-3 pr-3">
                    {c.productId ? (
                      <Link
                        href={`/viewProduct/${c.productId}`}
                        className="text-blue-400 hover:underline"
                      >
                        {truncateTitle(c.title)}
                      </Link>
                    ) : (
                      truncateTitle(c.title)
                    )}
                  </td>
                  <td className="py-3 pr-3 font-semibold text-emerald-400">₹{c.price ?? '—'}</td>
                  <td className="py-3 pr-3">
                    <span className={(c.priceDiff ?? 0) <= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {(c.priceDiff ?? 0) <= 0 ? '' : '+'}₹{c.priceDiff ?? 0} ({c.priceDiffPct ?? 0}%)
                    </span>
                  </td>
                  <td className="py-3 pr-3">★ {c.avgRating || '—'}</td>
                  <td className="py-3 pr-3">{Math.round((c.similarityScore ?? 0) * 100)}%</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${verdictStyle(c.verdict)}`}
                    >
                      {verdictLabel(c.verdict)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

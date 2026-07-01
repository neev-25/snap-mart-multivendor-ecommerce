'use client'

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'

type SentimentLabel = 'positive' | 'neutral' | 'negative'

function sentimentColor(label: SentimentLabel) {
  if (label === 'positive') return 'text-emerald-400'
  if (label === 'negative') return 'text-red-400'
  return 'text-amber-300'
}

function SentimentBadge({ label }: { label: SentimentLabel }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${sentimentColor(label)} bg-white/5`}
    >
      {label}
    </span>
  )
}

export default function VendorMLPanel() {
  const [loading, setLoading] = useState(true)
  const [sentiment, setSentiment] = useState<any>(null)
  const [pricing, setPricing] = useState<any[]>([])
  const [stock, setStock] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, p, st] = await Promise.all([
          axios.get('/api/ml/sentiment'),
          axios.get('/api/ml/pricing/vendor'),
          axios.get('/api/ml/stock-alerts'),
        ])
        setSentiment(s.data)
        setPricing(p.data.insights || [])
        setStock(st.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="glass-card flex justify-center p-10">
        <ClipLoader color="#60a5fa" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">ML Insights</h2>
        <p className="text-sm text-gray-400">
          Review sentiment, smart pricing, and demand-based stock alerts from your MongoDB data
        </p>
      </div>

      {/* Stock alerts */}
      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Stock alerts</h3>
          {stock?.summary && (
            <span className="text-xs text-gray-400">
              {stock.summary.critical} critical · {stock.summary.warning} warning
            </span>
          )}
        </div>
        {!stock?.alerts?.length ? (
          <p className="text-sm text-gray-500">No products to analyze.</p>
        ) : (
          <div className="space-y-2">
            {stock.alerts.slice(0, 6).map((a: any) => (
              <div
                key={a.productId}
                className={`rounded-xl border p-3 text-sm ${
                  a.alertLevel === 'critical'
                    ? 'border-red-500/40 bg-red-500/10'
                    : a.alertLevel === 'warning'
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{a.title}</p>
                  <span className="text-xs uppercase text-gray-400">{a.alertLevel}</span>
                </div>
                <p className="mt-1 text-gray-400">{a.message}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Stock: {a.currentStock} · Sold (14d): {a.unitsSold14d} · Avg/day:{' '}
                  {a.avgDailySales}
                  {a.reorderSuggestion > 0 && ` · Suggest reorder: ${a.reorderSuggestion} units`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Smart pricing */}
      <section className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Pricing insights</h3>
        {!pricing.length ? (
          <p className="text-sm text-gray-500">Add products to see pricing insights.</p>
        ) : (
          <div className="space-y-3">
            {pricing.slice(0, 5).map((p: any) => (
              <div key={p.productId} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    {p.productIdentity && (
                      <p className="text-xs text-violet-400">Product: {p.productIdentity}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase ${
                      p.position === 'below_market'
                        ? 'text-emerald-400'
                        : p.position === 'above_market'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                    }`}
                  >
                    {p.position.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400 sm:grid-cols-4">
                  <span>Your price: ₹{p.currentPrice}</span>
                  <span>Market median: ₹{p.marketMedian}</span>
                  <span>Suggested: ₹{p.suggestedOptimal}</span>
                  <span>Other sellers: {p.peerCount}</span>
                </div>
                <p className="mt-2 text-sm text-gray-300">{p.insight}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review sentiment */}
      <section className="glass-card p-5">
        <h3 className="mb-4 font-semibold">Review sentiment (NLP)</h3>
        {sentiment?.platform?.totalReviews === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet for sentiment analysis.</p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500">Avg sentiment</p>
                <p className={`text-lg font-bold ${sentimentColor(sentiment.platform.sentimentLabel)}`}>
                  {sentiment.platform.avgSentiment}
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500">Reviews</p>
                <p className="text-lg font-bold">{sentiment.platform.totalReviews}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500">Positive products</p>
                <p className="text-lg font-bold text-emerald-400">{sentiment.platform.positivePct}%</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-xs text-gray-500">Negative products</p>
                <p className="text-lg font-bold text-red-400">{sentiment.platform.negativePct}%</p>
              </div>
            </div>
            <div className="space-y-2">
              {(sentiment.products || []).slice(0, 5).map((p: any) => (
                <div
                  key={p.productId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.reviewCount} reviews · ★ {p.avgRating}
                    </p>
                  </div>
                  <SentimentBadge label={p.sentimentLabel} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

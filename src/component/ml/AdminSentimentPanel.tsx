'use client'

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'

function sentimentColor(label: string) {
  if (label === 'positive') return 'text-emerald-400'
  if (label === 'negative') return 'text-red-400'
  return 'text-amber-300'
}

export default function AdminSentimentPanel() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    axios
      .get('/api/ml/sentiment')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="glass-card flex justify-center p-8">
        <ClipLoader color="#60a5fa" />
      </div>
    )
  }

  if (!data?.platform?.totalReviews) {
    return (
      <section className="glass-card p-5">
        <h3 className="font-semibold">Review sentiment (platform-wide)</h3>
        <p className="mt-2 text-sm text-gray-500">No reviews available for ML sentiment analysis.</p>
      </section>
    )
  }

  return (
    <section className="glass-card p-5">
      <h3 className="mb-1 font-semibold">Review sentiment (platform-wide ML)</h3>
      <p className="mb-4 text-sm text-gray-400">
        Lexicon + rating fusion NLP on all product reviews across vendors
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-gray-500">Platform sentiment</p>
          <p className={`text-xl font-bold ${sentimentColor(data.platform.sentimentLabel)}`}>
            {data.platform.avgSentiment}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-gray-500">Total reviews</p>
          <p className="text-xl font-bold">{data.platform.totalReviews}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-gray-500">Positive listings</p>
          <p className="text-xl font-bold text-emerald-400">{data.platform.positivePct}%</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-center">
          <p className="text-xs text-gray-500">Negative listings</p>
          <p className="text-xl font-bold text-red-400">{data.platform.negativePct}%</p>
        </div>
      </div>

      {data.platform.topAspects?.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-300">Top discussed aspects</p>
          <div className="flex flex-wrap gap-2">
            {data.platform.topAspects.map((a: any) => (
              <span
                key={a.aspect}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize"
              >
                {a.aspect}:{' '}
                <span className={sentimentColor(a.label)}>{a.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {(data.products || [])
          .sort((a: any, b: any) => a.avgSentiment - b.avgSentiment)
          .slice(0, 8)
          .map((p: any) => (
            <div
              key={p.productId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1 pr-3">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {p.reviewCount} reviews · score {p.avgSentiment}
                </p>
              </div>
              <span className={`shrink-0 text-xs font-semibold capitalize ${sentimentColor(p.sentimentLabel)}`}>
                {p.sentimentLabel}
              </span>
            </div>
          ))}
      </div>
    </section>
  )
}

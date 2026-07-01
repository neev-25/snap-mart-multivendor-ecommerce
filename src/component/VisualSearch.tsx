'use client'

import ProductCard from '@/component/ProductCard';
import axios from 'axios';
import React, { useState } from 'react';
import { FaCamera } from 'react-icons/fa';

export default function VisualSearch() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [searched, setSearched] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProducts([]);
    setStatusMessage('');
    setSearched(false);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await axios.post('/api/visual-search', form);
      setSearched(true);
      setProducts(res.data.products || []);
      setStatusMessage(res.data.message || '');
    } catch {
      setProducts([]);
      setStatusMessage('Visual search failed. First run downloads the CLIP model (one time).');
      setSearched(true);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="glass-card mb-6 border-violet-500/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
            <FaCamera />
          </div>
          <div>
            <h3 className="font-semibold text-white">Visual Search</h3>
            <p className="text-xs text-gray-400 sm:text-sm">
              Upload a photo to find matching products from our catalog
            </p>
          </div>
        </div>
        <label className="btn-primary cursor-pointer sm:ml-auto">
          {loading ? 'Analyzing...' : 'Upload image'}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={loading} />
        </label>
      </div>

      {loading && (
        <p className="mt-3 text-xs text-violet-300">
          Indexing catalog and running similarity search...
        </p>
      )}

      {statusMessage && !loading && (
        <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300">{statusMessage}</p>
      )}

      {searched && products.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

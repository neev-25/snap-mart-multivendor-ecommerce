'use client'

import { IUser } from '@/model/user.model'
import { useRouter } from 'next/navigation'
import React from 'react'

function Footer({ user }: { user: IUser }) {
  const role = user?.role
  const isUser = role === 'user' || !role
  const isAdminOrVendor = role === 'admin' || role === 'vendor'
  const router = useRouter()

  return (
    <footer className="mt-auto border-t border-white/5 bg-[#08080d]">
      <div
        className={`mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 ${
          isUser
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        <div className="space-y-3 text-center md:text-left">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-2xl font-bold tracking-tight text-white transition hover:text-blue-400"
          >
            SnapMart
          </button>
          <p className="text-sm leading-relaxed text-gray-500">
            Smart, secure multi-vendor commerce built for performance and growth.
          </p>
          {isAdminOrVendor && (
            <span
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium text-white ${
                role === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
            >
              {role === 'admin' ? 'Admin Panel' : 'Vendor Panel'}
            </span>
          )}
        </div>

        {isUser && (
          <div className="text-center md:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {[
                { label: 'Home', path: '/' },
                { label: 'Categories', path: '/category' },
                { label: 'Shops', path: '/shop' },
                { label: 'Orders', path: '/orders' },
                { label: 'Wishlist', path: '/wishlist' },
              ].map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => router.push(item.path)}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isUser && (
          <div className="text-center md:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Help & Support
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <button type="button" onClick={() => router.push('/support')} className="hover:text-white">
                  Support Chat
                </button>
              </li>
              <li>
                <button type="button" onClick={() => router.push('/orders')} className="hover:text-white">
                  Track Orders
                </button>
              </li>
            </ul>
          </div>
        )}

        {isAdminOrVendor && (
          <div className="glass-card p-6 text-center md:text-left">
            <h2 className="mb-3 text-lg font-semibold text-white">
              {role === 'admin' ? 'System Access' : 'Vendor Dashboard'}
            </h2>
            <ul className="space-y-2 text-sm text-gray-400">
              {role === 'admin' ? (
                <>
                  <li>Platform management</li>
                  <li>Vendor control</li>
                  <li>Orders & revenue</li>
                </>
              ) : (
                <>
                  <li>Product upload & edit</li>
                  <li>Order tracking</li>
                  <li>Sales analytics</li>
                </>
              )}
            </ul>
          </div>
        )}

        <div className="space-y-2 text-center md:text-left">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
            Contact
          </h3>
          <a
            href="mailto:neevm789@gmail.com"
            className="text-sm text-gray-500 transition hover:text-white"
          >
            neevm789@gmail.com
          </a>
          <p className="text-sm text-gray-500">+91 9375524133</p>
          <p className="text-sm text-gray-500">Gandhinagar, India</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} SnapMart — Secure Commerce Engine
      </div>
    </footer>
  )
}

export default Footer

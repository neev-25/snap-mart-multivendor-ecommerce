'use client'

import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { AiOutlineClose, AiOutlineMenu } from 'react-icons/ai'
import { FaBoxOpen, FaShoppingCart } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import VendorProducts from './VendorProducts'
import VendorOrders from './VendorOrders'
import Dashboard from './Dashboard'

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: <MdDashboard size={20} /> },
  { id: 'products', label: 'Products', icon: <FaBoxOpen size={20} /> },
  { id: 'orders', label: 'Orders', icon: <FaShoppingCart size={20} /> },
]

function VendorDashboard() {
  const [activePage, setActivePage] = useState('dashboard')
  const [openMenu, setOpenMenu] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'products':
        return <VendorProducts />
      case 'orders':
        return <VendorOrders />
      default:
        return <Dashboard />
    }
  }

  const navButtonClass = (id: string) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
      activePage === id
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
        : 'text-gray-300 hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="relative flex w-full text-white">
      {/* Mobile sub-header — fixed below main navbar */}
      <div className="fixed left-0 top-16 z-30 flex w-full items-center justify-between border-b border-white/10 bg-[#0f0f16]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <h1 className="text-base font-bold">Vendor Panel</h1>
        {!openMenu && (
          <button type="button" onClick={() => setOpenMenu(true)} aria-label="Open menu">
            <AiOutlineMenu size={22} />
          </button>
        )}
      </div>

      {/* Desktop sidebar — sticky, does not scroll with main content */}
      <aside className="sticky top-16 hidden h-[calc(100vh-var(--nav-height))] w-72 shrink-0 flex-col border-r border-white/10 bg-[#0f0f16]/90 p-6 backdrop-blur-xl lg:flex">
        <h1 className="mb-6 text-lg font-bold">Vendor Panel</h1>
        <nav className="flex flex-col gap-2">
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={navButtonClass(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {openMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setOpenMenu(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/10 bg-[#0f0f16] p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-lg font-bold">Vendor Panel</h1>
                <button type="button" onClick={() => setOpenMenu(false)} aria-label="Close menu">
                  <AiOutlineClose size={24} />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {menu.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id)
                      setOpenMenu(false)
                    }}
                    className={navButtonClass(item.id)}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content — sole scroll area on the page */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-w-0 flex-1 pt-[3.25rem] lg:pt-0 lg:pl-0"
      >
        <div className="p-4 sm:p-6 lg:p-8">{renderPage()}</div>
      </motion.main>
    </div>
  )
}

export default VendorDashboard

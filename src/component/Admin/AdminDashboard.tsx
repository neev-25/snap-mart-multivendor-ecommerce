'use client'

import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { AiOutlineClose, AiOutlineMenu } from 'react-icons/ai'
import { FaBox, FaCheckCircle, FaShoppingBag, FaStore } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import VendorDetails from './VendorDetails'
import UserOrders from './UserOrders'
import VendorApproval from './VendorApproval'
import ProductApproval from './ProductApproval'
import Dashboard from './Dashboard'
import AdminCoupons from './AdminCoupons'

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: <MdDashboard size={20} /> },
  { id: 'vendors', label: 'Vendor Details', icon: <FaStore size={20} /> },
  { id: 'orders', label: 'User Orders', icon: <FaShoppingBag size={20} /> },
  { id: 'vendor-approval', label: 'Vendor Approval', icon: <FaCheckCircle size={20} /> },
  { id: 'product-approval', label: 'Product Requests', icon: <FaBox size={20} /> },
  { id: 'coupons', label: 'Coupons', icon: <FaBox size={20} /> },
]

function AdminDashboard() {
  const [activePage, setActivePage] = useState('dashboard')
  const [openMenu, setOpenMenu] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />
      case 'vendors':
        return <VendorDetails />
      case 'orders':
        return <UserOrders />
      case 'vendor-approval':
        return <VendorApproval />
      case 'product-approval':
        return <ProductApproval />
      case 'coupons':
        return <AdminCoupons />
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
      <div className="fixed left-0 top-16 z-30 flex w-full items-center justify-between border-b border-white/10 bg-[#0f0f16]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <h1 className="text-base font-bold">Admin Panel</h1>
        {!openMenu && (
          <button type="button" onClick={() => setOpenMenu(true)} aria-label="Open menu">
            <AiOutlineMenu size={22} />
          </button>
        )}
      </div>

      <aside className="sticky top-16 hidden h-[calc(100vh-var(--nav-height))] w-72 shrink-0 flex-col border-r border-white/10 bg-[#0f0f16]/90 p-6 backdrop-blur-xl lg:flex">
        <h1 className="mb-6 text-lg font-bold">Admin Panel</h1>
        <nav className="flex flex-col gap-2 overflow-y-auto">
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
                <h1 className="text-lg font-bold">Admin Panel</h1>
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

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-w-0 flex-1 pt-[3.25rem] lg:pt-0"
      >
        <div className="p-4 sm:p-6 lg:p-8">{renderPage()}</div>
      </motion.main>
    </div>
  )
}

export default AdminDashboard

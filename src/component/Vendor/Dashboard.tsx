'use client'

import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData'
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser'
import { RootState } from '@/redux/store'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { VendorFinanceDashboard } from '@/component/analytics/FinanceDashboard'
import { filterOrdersByVendor, OrderLike } from '@/lib/orderFinances'
import VendorMLPanel from '@/component/ml/VendorMLPanel'

function Dashboard() {
  UseGetAllOrdersData()
  UseGetAllProducts()
  UseGetCurrentUser()

  const { allProductsData } = useSelector((state: RootState) => state.vendor)
  const { allOrdersData, userData } = useSelector((state: RootState) => state.user)

  const vendorId = String(userData?._id ?? '')

  const vendorOrders = useMemo(
    () => filterOrdersByVendor((allOrdersData || []) as OrderLike[], vendorId),
    [allOrdersData, vendorId]
  )

  const vendorProducts = allProductsData.filter(
    (p) => String(p.vendor?._id || p.vendor) === vendorId
  )

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase text-gray-500">Active listings</p>
          <p className="mt-1 text-2xl font-bold">{vendorProducts.filter((p) => p.isActive).length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase text-gray-500">Total products</p>
          <p className="mt-1 text-2xl font-bold">{vendorProducts.length}</p>
        </div>
        <div className="glass-card col-span-2 p-4 text-center sm:col-span-1">
          <p className="text-xs uppercase text-gray-500">Total orders</p>
          <p className="mt-1 text-2xl font-bold">{vendorOrders.length}</p>
        </div>
      </div>

      <VendorFinanceDashboard orders={vendorOrders} shopName={userData?.shopName} />

      <VendorMLPanel />
    </div>
  )
}

export default Dashboard

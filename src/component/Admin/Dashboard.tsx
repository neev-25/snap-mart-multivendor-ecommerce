'use client'

import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData'
import UseGetAllVendor from '@/hooks/UseGetAllVendor'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import React from 'react'
import { useSelector } from 'react-redux'
import { AdminFinanceDashboard, StatCard } from '@/component/analytics/FinanceDashboard'
import { OrderLike } from '@/lib/orderFinances'
import AdminSentimentPanel from '@/component/ml/AdminSentimentPanel'

function Dashboard() {
  UseGetAllOrdersData()
  UseGetAllProducts()
  UseGetAllVendor()

  const { allVendorData, allProductsData } = useSelector((state: RootState) => state.vendor)
  const { allOrdersData } = useSelector((state: RootState) => state.user)

  const vendors = allVendorData || []
  const pendingVendors = vendors.filter((v: IUser) => v.verificationStatus === 'pending')
  const products = allProductsData || []
  const pendingProducts = products.filter((p) => p.verificationStatus === 'pending')
  const orders = (allOrdersData || []) as OrderLike[]

  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="section-title">Admin overview</h2>
        <p className="section-subtitle">Platform operations & catalog status</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard title="Vendors" value={vendors.length} />
        <StatCard title="Pending vendors" value={pendingVendors.length} accent="text-yellow-400" />
        <StatCard title="Products" value={products.length} />
        <StatCard title="Pending products" value={pendingProducts.length} accent="text-yellow-400" />
        <StatCard title="Total orders" value={orders.length} />
      </div>

      <AdminFinanceDashboard orders={orders} />

      <AdminSentimentPanel />
    </div>
  )
}

export default Dashboard

'use client'
import React from 'react'
import Slider from './Slider'
import CategoriesSlider from './CategoriesSlider'
import ProductCardPage from './ProductCardPage'
import ShopGrid from '@/component/ShopGrid'
import VisualSearch from '@/component/VisualSearch'

function UserDashBoard() {
  return (
    <div className="w-full">
      <Slider />
      <div className="app-container pb-2">
        <VisualSearch />
      </div>
      <CategoriesSlider />
      <ProductCardPage />
      <ShopGrid embedded />
    </div>
  )
}

export default UserDashBoard

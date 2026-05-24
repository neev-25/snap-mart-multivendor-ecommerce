'use client'
import React from 'react'
import Slider from './Slider'
import CategoriesSlider from './CategoriesSlider'
import ProductCardPage from './ProductCardPage'
import ShopPage from '@/app/shop/page'

function UserDashBoard() {
  return (
    <div className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 font-sans flex-col'>
        {/* <h1 className='text-white text-4xl'>User dashBoard</h1> */}
      <Slider/>
      <CategoriesSlider/>
      <ProductCardPage/>
      <ShopPage/>
    </div>
  )
}

export default UserDashBoard

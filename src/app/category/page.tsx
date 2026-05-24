'use client'
import ProductCard from '@/component/ProductCard';
import { RootState } from '@/redux/store';
import axios from 'axios';
import React, { use, useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function CategoriesPage() {
  const categoryList = [
  { label: "all", icon: "📁" },
  { label: "Fashion & Lifestyle", icon: "👗" },
  { label: "Electronics & Gadgets", icon: "📱" },
  { label: "Home & Living", icon: "🏠" },
  { label: "Beauty & Personal Care", icon: "💄" },
  { label: "Toys, Kids & Baby", icon: "🧸" },
  { label: "Food & Grocery", icon: "🛒" },
  { label: "Sports & Fitness", icon: "🏀" },
  { label: "Automotive Accessories", icon: "🚗" },
  { label: "Gifts & Handcrafts", icon: "🎁" },
  { label: "Books & Stationery", icon: "📚" },
];
const {allVendorData}=useSelector((state:RootState)=>state.vendor)

const [selectedCategory,setSelectedCategory]=useState("all");
const [selectedShop,setSelectedShop]=useState("all");
const [search,setSearch]=useState("");
const [shopSearch,setShopSearch]=useState("");

// const [apiProducts,setApiProducts]=useState<any[]>([]);
const [displayProducts,setDisplayProducts]=useState<any[]>([]);
const [isReady,setIsReady]=useState(false)
useEffect(()=>{
  const params=new URLSearchParams(window.location.search)
  const cat=params.get("category")
  if(cat)
  {
    setSelectedCategory(cat)
  }
  setIsReady(true)
})

const fetchProduct=async () => {
  try {
    const param=new URLSearchParams()
    if(search)
      param.append("query",search);

    if(selectedCategory!=="all")
    {
      param.append("category",selectedCategory);
    }
    if(selectedShop!=="all")
    {
      param.append("shop",selectedShop)
    }
    const result=await axios.get(`/api/search?${param.toString()}`)
    // const data=await result.json()
    // setApiProducts(result.data.products)
    console.log(result.data.products)
    setDisplayProducts(result.data.products)
  } catch (error) {
    console.log(error)
  }
}
useEffect(()=>{
  if(!isReady)
    return;

  fetchProduct()
},[selectedCategory,search,selectedShop,isReady])


const filterShops=!shopSearch ? [] : allVendorData.filter((v:any)=>v.shopName.toLowerCase().includes(shopSearch.toLowerCase()))
return (
    <div
    className='min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-6'
    >
      <div className='max-w-7xl mx-auto mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>
          Browse Products by Categories
        </h1>
        <p className='text-gray-300 text-sm'>
          Filter by category, shop or search your favorite
        </p>
      </div>
      <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6'>
        {/* left sidebar */}
        <div className='md:col-span-1 bg-white/10 border border-white/20 rounded-xl p-4 space-y-6'>
        <input type="text" placeholder='Search Products...'
        className='w-full px-3 py-2 rounded bg-black border border-white/20'
        onChange={(e)=>setSearch(e.target.value)}
        value={search}
        />
        <div className='space-y-2 max-h-64 overflow-y-auto'>
          {
            categoryList.map((cat)=>(
              <button 
              onClick={()=>{
                setSelectedCategory(cat.label);
                setSelectedShop("all");
                setShopSearch("")
              }}
              key={cat.label}
              className={`w-full flex gap-2 px-3 py-2 rounded ${
                selectedCategory===cat.label
                ? "bg-blue-600"
                : "bg-white/10 hover:bg-white/20"
              }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))
          }
        </div>

        <input type="text" placeholder='Search Shop...'
        className='w-full px-3 py-2 rounded bg-black border border-white/20'
        onChange={(e)=>setShopSearch(e.target.value)}
        value={shopSearch}
        />

        {shopSearch && 
        <div
        className='bg-black border border-white/20 rounded max-h-48 overflow-y-auto'
        >
          {filterShops.map((v:any)=>(
            <button
            key={v._id}
            onClick={()=>
            {
              setShopSearch(v.shopName);
              setSelectedShop(v._id);
            }}
            className='block w-full px-3 py-2 text-left hover:bg-white/10'
            >
              {v.shopName}
            </button>
          ))}
        </div>
        }
        </div>

        <div className='md:col-span-3'>
          {
            displayProducts.length===0?(
              <div className='text-center mt-20 text-gray-400'>
                No Products found
              </div>
            ):(
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5'>
              {displayProducts.map((p:any)=>(
                <ProductCard key={p._id} product={p}/>
              ))}
            </div>
          )
          }
        </div>
      </div>
    </div>
  )
}

export default CategoriesPage

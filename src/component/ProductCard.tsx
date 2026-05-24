'use client'
import { IProduct } from '@/model/product.model'
import axios from 'axios'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaRegStar, FaShoppingCart, FaStar } from 'react-icons/fa'
function ProductCard({product}:{product:IProduct}) {
    const images=[
        product.image1,
        product.image2,
        product.image3,
        product.image4
    ].filter(Boolean)
    const [current,setCurrent]=useState(0);
    const next=()=>{
        setCurrent((prev)=>(prev+1)%images.length)
    }
    const prev=()=>{
        setCurrent((prev)=>(prev-1+images.length)%images.length)
    }
    const router=useRouter()
    const totalReviews: number = product?.reviews?.length ?? 0;
const avgRating=product && totalReviews>0 ? (
    product.reviews!.reduce((sum:number,r:{rating:number})=>sum+r.rating,0)/totalReviews).toFixed(1):0

const handleAddtoCart=async (e:React.MouseEvent)=>{
    e.stopPropagation()
    try {
        const result=await axios.post("/api/user/cart/add",{
            productId:product._id,
            quantity:1
        })
        console.log(result.data)
        alert("✅ Added to cart")
        router.push("/cart")
    } catch (error) {

        console.log(error)
        alert("add to cart error")
    }
}
  return (
    <motion.div 
    onClick={()=>router.push(`/viewProduct/${product._id}`)}
    initial={{opacity:0,y:60}}
    whileInView={{opacity:1,y:0}}
    transition={{type:"spring",stiffness:70,damping:18}}
    viewport={{once:true,amount:0.2}}
    whileHover={{scale:1.03}}
    className='bg-white rounded-xl shadow-md overflow-hidden border hover:shadow-xl transition cursor-pointer'>
        {/* images */}
        <div className='relative w-full h-[220px] bg-gray-100 overflow-hidden flex items-center justify-center'>
            <div className='relative w-[90%] h-[90%]'>
                <Image
                src={images[current]}
                alt={product.title}
                fill
                className='object-contain'
                sizes='(max-width:768px) 100vw, 300px'
                />
            </div>
            <button 
            onClick={(e)=>{
                e.stopPropagation()
                prev()
            }}
            className='absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white z-10'>
            <FaChevronLeft size={14}/>
            </button>
            <button 
            onClick={(e)=>{
                e.stopPropagation()
                next()
            }}
            className='absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white z-10'>
                <FaChevronRight size={14}/>
            </button>
            <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1'>
            {images.map((_,i)=>(
                <span key={i} className={`w-2 h-2 rounded-full ${current===i ? "bg-black":"bg-black/40"}`}></span>
            ))}
            </div>
        </div>
        {/* productData */}
        <div className='p-4 space-y-2'>
            <h3 className='font-semibold text-sm text-black line-clamp-1'>
                {product.title}
            </h3>
            <p className='text-xs text-gray-500'>{product.category}</p>
            <p className='font-bold text-lg text-green-600'>₹ {product.price}</p>
            <div className='flex items-center gap-1 text-yellow-500 text-sm'>
                {[1,2,3,4,5].map((i)=>(
                    i<=Math.round(Number(avgRating))?
                    <FaStar key={i}/>:<FaRegStar key={i}/>
                ))}
                <span className='text-gray-500 text-xs ml-1'>
                    ({avgRating}/{totalReviews})
                </span>
            </div>
            <p className='text-xs text-gray-500'>Sold By : <span>{product.vendor.shopName}</span></p>
            <motion.button
            onClick={handleAddtoCart}
            whileTap={{scale:0.95}}
            whileHover={{scale:1.05}}
            className='w-full mt-3 bg-black text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-900 transition'
            >
                <FaShoppingCart size={14}/> Add to Cart
            </motion.button>
        </div>
      
    </motion.div>
  )
}

export default ProductCard

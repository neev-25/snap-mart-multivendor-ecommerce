'use client'

import { AppDispatch, RootState } from '@/redux/store'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'motion/react';
import axios from 'axios';
import { setAllProductsData, setAllVendorData } from '@/redux/vendorSlice';
import { ClipLoader } from 'react-spinners';
import UseGetAllProducts from '@/hooks/UseGetAllProductsData';
import { IProduct } from '@/model/product.model';
import Image from 'next/image';

function ProductApproval() {

const dispatch=useDispatch<AppDispatch>()

  UseGetAllProducts()
const allProductsData:IProduct[]=useSelector((state:RootState)=>state.vendor.allProductsData)
const pendingProducts=Array.isArray(allProductsData)?
allProductsData.filter((p)=>p.verificationStatus==="pending"):[]
// console.log(pendingVendors)

const [selectedProduct,setSelectedproduct]=useState<IProduct|null>(null)
const [loading,setLoading]=useState(false)
const [rejectModel,setRejectModel]=useState(false)
const [rejectedReason,setRejectedReason]=useState("")

const openRejectedReasonArea=()=>{
  setRejectModel(true)
  setRejectedReason("")
}
const handleApproved=async () => {
  if(!selectedProduct)
  return;

  setLoading(true)
  try {
    
    await axios.post("/api/admin/update-product-status",{
      productId:selectedProduct._id,
      status:"approved"
    })
    const updated=allProductsData.filter((v)=>v._id!==selectedProduct._id)
    dispatch(setAllProductsData(updated))
    setSelectedproduct(null)
    setLoading(false)
    alert("Product Approved")
  } catch (error) {
    console.log(error)
    setLoading(false)
    alert("Product Failed")
  }
}
const handleRejected=async () => {
  if(!selectedProduct)
  return;

  setLoading(true)
  try {
    
    await axios.post("/api/admin/update-product-status",{
      productId:selectedProduct._id,
      status:"rejected",
      rejectedReason
    })
    const updated=allProductsData.filter((p)=>p._id!==selectedProduct._id)
    dispatch(setAllProductsData(updated))
    setSelectedproduct(null)
    setLoading(false)
    alert("Product Rejected")
  } catch (error) {
    console.log(error)
    setLoading(false)
    alert("Rejection Failed")
  }
}
  return (
    <div className='w-full px-3 sm:px-6 lg:px-10 py-6 text-white'>
      <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left'>Product Approval Request</h1>
      {/* desktop table */}
      <div className='hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10'>
      <table className='w-full text-left'>
        <thead className='bg-white/10'>
        <tr>
          <th className='p-4'>Image</th>
          <th className='p-4'>Title</th>
          <th className='p-4'>Price</th>
          <th className='p-4'>Category</th>
          <th className='p-4'>Status</th>
          <th className='p-4 text-center'>Action</th>
        </tr>
        </thead>
        <tbody>
          {pendingProducts.length===0?(
            <tr>
              <td  colSpan={5} className='p-6 text-center text-gray-400'>No Product Approval requests found</td>
            </tr>
          ):(
            pendingProducts.map((product,index)=>(
              <tr 
              key={index}
              className='border-t border-white/10 hover:bg-white/5'
              >
                <td className='p-4'>
                  <Image src={product.image1}
                  alt='img'
                  width={50}
                  height={50}
                  className='rounded object-cover'
                  />
                </td>
                <td className='p-4'>{product.title}</td>
                <td className='p-4'>₹ {product.price}</td>
                <td className='p-4'>{product.category}</td>

                <td className='p-4'><span className='px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300'>{product?.verificationStatus}</span></td>
                <td className='p-4 text-center'>
                  <motion.button 
                  whileHover={{scale:1.02}}
                  whileTap={{scale:0.97}}
                  onClick={()=>setSelectedproduct(product)}
                  className='px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm'>Check Details</motion.button>
                </td>
              </tr>
            ))
          )}


        </tbody>
      </table>
      </div>
      {/* mobile card */}
      <div className='md:hidden flex flex-col gap-4'>
        {pendingProducts.length===0?(
          <div className='text-center text-gray-400 mt-10'>
            No Product Approval requests found
          </div>
        ):(
          pendingProducts.map((product,index)=>(
            <div key={index} className='bg-white/10 border border-white/20 rounded-xl p-4 space-y-2'>
              <div className='flex items-center'>
                <Image 
                src={product.image1}
                alt='img'
                width={60}
                height={60}
                className='rounded'
                />
              </div>
              <div>
                <h3 className='font-semibold '>{product.title}</h3>
                <p className='text-sm text-gray-400'>₹ {product.price}</p>
              </div>
              <div className='space-y-2 flex justify-between items-center'>
              <p className='text-sm text-gray-400'>{product.category}</p>
              <span className='px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300'>{product?.verificationStatus}</span>
              </div>
              <motion.button 
              whileHover={{scale:1.02}}
              whileTap={{scale:0.97}}
              onClick={()=>setSelectedproduct(product)}
              className='px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm'>Check Details</motion.button>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>

      {selectedProduct &&(
        <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:0.3}}
        exit={{opacity:0}}
        className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4'
        >
          <motion.div
        initial={{scale:0.9}}
        animate={{scale:1}}
        exit={{scale:0.9}}
        transition={{duration:0.6}}
          className='bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10'
          >
          <h3 className='text-xl sm:text-2xl font-bold mb-4'>Selected Product Details</h3>
          <Image src={selectedProduct?.image1} alt='img'
          width={50}
          height={40}
          className='rounded mb-4'
          />
          <div className='space-y-2 text-sm'>
            <p><b>Title:</b> {selectedProduct.title}</p>
            <p><b>Price:</b> ₹ {selectedProduct.price}</p>
            <p><b>Category:</b> {selectedProduct.category}</p>
            <p><b>Description:</b> {selectedProduct.description}</p>
            <p>
              <b>Status:</b>{" "}
              <span className="text-yellow-400">Pending</span>
            </p>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 mt-6'>
            <button disabled={loading} className='flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm' onClick={handleApproved}>{loading ? <ClipLoader size={20} color='white'/> : "Approve"}</button>
            <button onClick={openRejectedReasonArea} className='flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm'>Reject</button>
            <button onClick={()=>setSelectedproduct(null)} className='flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm'>Cancel</button>
          </div>
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>


      <AnimatePresence>

      {rejectModel && (
        <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:0.3}}
        exit={{opacity:0}}
        className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4'
        >
          <motion.div
        initial={{scale:0.9}}
        animate={{scale:1}}
        exit={{scale:0.9}}
        transition={{duration:0.6}}
          className='bg-gray-900 p-6 rounded-2xl w-full max-w-lg border border-white/10'
          >
          <h3 className='text-xl sm:text-2xl font-bold mb-4'>Enter Rejection Reason</h3>
          <textarea className='w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm'
          rows={3}
          placeholder='Enter rejction reason...'
          onChange={(e)=>setRejectedReason(e.target.value)}
          value={rejectedReason}
          />
          <div className='flex flex-col sm:flex-row gap-3 mt-6'>
            <button disabled={loading} onClick={handleRejected} className='flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm'>{loading ? <ClipLoader size={20} color='white'/>:"Confirm Reject"}</button>
            <button onClick={()=>setRejectModel(false)} className='flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm'>Cancel</button>
          </div>
            
          
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

    </div>
  )
}

export default ProductApproval

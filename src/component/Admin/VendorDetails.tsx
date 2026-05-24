'use client'

import { AppDispatch, RootState } from '@/redux/store'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IUser } from '../../model/user.model';
import { AnimatePresence, motion } from 'motion/react';
import axios from 'axios';
import UseGetAllVendor from '@/hooks/UseGetAllVendor';
import { setAllVendorData } from '@/redux/vendorSlice';
import { ClipLoader } from 'react-spinners';
import Image from 'next/image';

function VendorDetails() {

const dispatch=useDispatch<AppDispatch>()

  UseGetAllVendor()
const allVendorData:IUser[]=useSelector((state:RootState)=>state.vendor.allVendorData)
const ApprovedVendors=Array.isArray(allVendorData)?
allVendorData.filter((v)=>v.verificationStatus==="approved"):[]

const [selectedVendor,setSelectedVendor]=useState<IUser|null>(null)

  return (
    <div className='w-full px-3 sm:px-6 lg:px-10 py-6 text-white'>
      <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left'>Approved Vendor Details</h1>
      {/* desktop table */}
      <div className='hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10'>
      <table className='w-full text-left'>
        <thead className='bg-white/10'>
        <tr>
          <th className='p-4'>Vendor Name</th>
          <th className='p-4'>Shop Name</th>
          <th className='p-4'>Shop Address</th>
          <th className='p-4'>Phone</th>
          <th className='p-4'>GSTIN</th>
          <th className='p-4 text-center'>Action</th>
        </tr>
        </thead>
        <tbody>
          {ApprovedVendors.length===0?(
            <tr>
              <td  colSpan={5} className='p-6 text-center text-gray-400'>No Vendor Approval requests found</td>
            </tr>
          ):(
            ApprovedVendors.map((vendor,index)=>(
              <tr 
              key={index}
              className='border-t border-white/10 hover:bg-white/5'
              >
                <td className='p-4 text-sm'>{vendor?.name}</td>
                <td className='p-4 text-sm'>{vendor?.shopName || "-"}</td>
                <td className='p-4 text-sm'>{vendor?.shopAddress || "-"}</td>
                <td className='p-4 text-sm'>{vendor?.phone || "-"}</td>
                <td className='p-4 text-sm'>{vendor.gstNumber}</td>
                <td className='p-4 text-center text-sm'>
                  <button 
                  onClick={()=>setSelectedVendor(vendor)}
                  className='px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm'>Vendor Products</button>
                </td>
              </tr>
            ))
          )}


        </tbody>
      </table>
      </div>
      {/* mobile card */}
      <div className='md:hidden flex flex-col gap-4'>
        {ApprovedVendors.length===0?(
          <div className='text-center text-gray-400 mt-10'>
            No Vendor Approval requests found
          </div>
        ):(
          ApprovedVendors.map((vendor,index)=>(
            <div key={index} className='bg-white/10 border border-white/20 rounded-xl p-4 space-y-2'>
              <div className='flex justify-between items-center'>
                <h3 className='font-semibold text-lg '>{vendor?.name}</h3>
                <span className='px-3 py-1 rounded-full text-xs'>{vendor?.gstNumber}</span>
              </div>
              <p className='text-sm text-gray-300'><b>Shop:{" "}</b>{vendor.shopName}</p>
              <p className='text-sm text-gray-300'><b>Shop:{" "}</b>{vendor.shopAddress}</p>
              <p className='text-sm text-gray-300'><b>Phone:{" "}</b>{vendor.phone}</p>
              <button className='w-full mt-3 bg-blue-600 hover:bg-blue-700 text-sm py-2 rounded-lg' 
              onClick={()=>setSelectedVendor(vendor)}
              >
                Vendor Products
              </button>

            </div>
          ))
        )}
      </div>

      <AnimatePresence>

      {selectedVendor && (
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
          <h3 className='text-xl sm:text-2xl font-bold mb-4'>Products of {selectedVendor.shopName}</h3>

          {selectedVendor.vendorProducts?.length ?
          (
          <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2'>
            {selectedVendor.vendorProducts.map((p:any,i:number)=>(
              <div key={i} className='bg-white/10 p-4 rounded-lg border border-white/20'>
              <div className='flex gap-3 items-center'>
                <Image src={p.image1} alt='img' 
                width={70}
                height={70}
                className='rounded object-cover'/>
                <div>
                  <p className='font-semibold'>{p.title}</p>
                  <p className='text-sm text-gray-300'>₹ {p.price}</p>
                </div>
              </div>
              <div className='mt-3 text-sm space-y-1'>
                <p><b>Category:</b>{p.category}</p>
                <p><b>Description:</b>{p.description}</p>
                <p>
                  <b>Verification:</b>{" "}
                  <span
                  className={`px-2 py-1 rounded text-xs ${
                    p.verificationStatus==="approved"
                    ? "bg-green-600/30 text-green-400"
                    : p.verificationStatus==="pending"
                    ? "bg-yellow-600/30 text-yellow-400"
                    : "bg-red-600/30 text-red-400"
                  }`}
                  >
                    {p.verificationStatus}
                  </span>
                </p>
                <p>
                  <b>Active:</b>{" "}
                  <span className={`
                    ${p.isActive

                      ? "text-green-400"
                      : "text-red-400"
                    }
                    `}>
                      {p.isActive?"Yes":"No"}
                    </span>
                </p>
              </div>
              </div>
            ))}
          
          </div>
          )  :
          (
            <p className='text-center text-gray-400 mt-6'>
              No Product Found Yet
            </p>
          )}
        <motion.button 
        whileHover={{scale:1.03}}
        whileTap={{scale:0.97}}

        onClick={()=>setSelectedVendor(null)} 
        className='w-full flex-1 bg-gray-700 mt-3  hover:bg-gray-800 py-2 rounded-lg text-sm'>
            Close
        </motion.button>

          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>


    </div>
  )
}

export default VendorDetails

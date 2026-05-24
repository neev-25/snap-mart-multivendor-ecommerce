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

function VendorApproval() {

const dispatch=useDispatch<AppDispatch>()

  UseGetAllVendor()
const allVendorData:IUser[]=useSelector((state:RootState)=>state.vendor.allVendorData)
const pendingVendors=Array.isArray(allVendorData)?
allVendorData.filter((v)=>v.verificationStatus==="pending"):[]
// console.log(pendingVendors)

const [selectedVendor,setSelectedVendor]=useState<IUser|null>(null)
const [loading,setLoading]=useState(false)
const [rejectModel,setRejectModel]=useState(false)
const [rejectedReason,setRejectedReason]=useState("")

const openRejectedReasonArea=()=>{
  setRejectModel(true)
  setRejectedReason("")
}
const handleApproved=async () => {
  if(!selectedVendor)
  return;

  setLoading(true)
  try {
    
    await axios.post("/api/admin/update-vendor-status",{
      vendorId:selectedVendor._id,
      status:"approved"
    })
    const updated=allVendorData.filter((v)=>v._id!==selectedVendor._id)
    dispatch(setAllVendorData(updated))
    setSelectedVendor(null)
    setLoading(false)
    alert("Vendor Approved")
  } catch (error) {
    console.log(error)
    setLoading(false)
    alert("Approved Failed")
  }
}
const handleRejected=async () => {
  if(!selectedVendor)
  return;

  setLoading(true)
  try {
    
    await axios.post("/api/admin/update-vendor-status",{
      vendorId:selectedVendor._id,
      status:"rejected",
      rejectedReason
    })
    const updated=allVendorData.filter((v)=>v._id!==selectedVendor._id)
    dispatch(setAllVendorData(updated))
    setSelectedVendor(null)
    setLoading(false)
    alert("Vendor Rejected")
  } catch (error) {
    console.log(error)
    setLoading(false)
    alert("Rejection Failed")
  }
}
  return (
    <div className='w-full px-3 sm:px-6 lg:px-10 py-6 text-white'>
      <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left'>Vendor Approval Request</h1>
      {/* desktop table */}
      <div className='hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10'>
      <table className='w-full text-left'>
        <thead className='bg-white/10'>
        <tr>
          <th className='p-4'>Vendor Name</th>
          <th className='p-4'>Shop Name</th>
          <th className='p-4'>Phone</th>
          <th className='p-4'>Status</th>
          <th className='p-4 text-center'>Action</th>
        </tr>
        </thead>
        <tbody>
          {pendingVendors.length===0?(
            <tr>
              <td  colSpan={5} className='p-6 text-center text-gray-400'>No Vendor Approval requests found</td>
            </tr>
          ):(
            pendingVendors.map((vendor,index)=>(
              <tr 
              key={index}
              className='border-t border-white/10 hover:bg-white/5'
              >
                <td className='p-4'>{vendor?.name}</td>
                <td className='p-4'>{vendor?.shopName || "-"}</td>
                <td className='p-4'>{vendor?.phone || "-"}</td>
                <td className='p-4'><span className='px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300'>{vendor?.verificationStatus}</span></td>
                <td className='p-4 text-center'>
                  <button 
                  onClick={()=>setSelectedVendor(vendor)}
                  className='px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-sm'>Check Details</button>
                </td>
              </tr>
            ))
          )}


        </tbody>
      </table>
      </div>
      {/* mobile card */}
      <div className='md:hidden flex flex-col gap-4'>
        {pendingVendors.length===0?(
          <div className='text-center text-gray-400 mt-10'>
            No Vendor Approval requests found
          </div>
        ):(
          pendingVendors.map((vendor,index)=>(
            <div key={index} className='bg-white/10 border border-white/20 rounded-xl p-4 space-y-2'>
              <div className='flex justify-between items-center'>
                <h3 className='font-semibold text-lg '>{vendor?.name}</h3>
                <span className='px-3 py-1 rounded-full text-xs bg-yellow-500/30 text-yellow-300'>{vendor?.verificationStatus}</span>
              </div>
              <p className='text-sm text-gray-300'><b>Shop:{" "}</b>{vendor.shopName}</p>
              <p className='text-sm text-gray-300'><b>Phone:{" "}</b>{vendor.phone}</p>
              <button className='w-full mt-3 bg-blue-600 hover:bg-blue-700 text-sm py-2 rounded-lg' 
              onClick={()=>setSelectedVendor(vendor)}
              >
                Check Details
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
          <h3 className='text-xl sm:text-2xl font-bold mb-4'>Selected Vendor Details</h3>
          <div className='space-y-2 text-sm'>

            <p><b>Name:{" "}</b>{selectedVendor.name}</p>
            <p><b>Email:{" "}</b>{selectedVendor.email}</p>
            <p><b>Phone:{" "}</b>{selectedVendor.phone}</p>
            <p><b>ShopName:{" "}</b>{selectedVendor.shopName}</p>
            <p><b>ShopAddress:{" "}</b>{selectedVendor.shopAddress}</p>
            <p><b>GSTIN:{" "}</b>{selectedVendor.gstNumber}</p>

          </div>
          <div className='flex flex-col sm:flex-row gap-3 mt-6'>
            <button disabled={loading} className='flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg text-sm' onClick={handleApproved}>{loading ? <ClipLoader size={20} color='white'/> : "Approve"}</button>
            <button onClick={openRejectedReasonArea} className='flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm'>Reject</button>
            <button onClick={()=>setSelectedVendor(null)} className='flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm'>Cancel</button>
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
            <button disabled={loading} onClick={()=>{handleRejected;setRejectModel(false)}} className='flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg text-sm'>{loading ? <ClipLoader size={20} color='white'/>:"Confirm Reject"}</button>
            <button onClick={()=>setRejectModel(false)} className='flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg text-sm'>Cancel</button>
          </div>
            
          
          </motion.div>
        </motion.div>
      )}

      </AnimatePresence>

    </div>
  )
}

export default VendorApproval

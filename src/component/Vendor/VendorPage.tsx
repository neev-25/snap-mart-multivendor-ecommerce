'use client'
import { IUser } from '@/model/user.model'
import React, { useState } from 'react'
import VendorDashboard from './VendorDashBoard'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { ClipLoader } from 'react-spinners'

function VendorPage({user}:{user:IUser}) {
  const [openVerifyform,setOpenVerifyform]=useState(false)
  const [shopName,setShopName]=useState(user?.shopName || "")
  const [shopAddress,setShopAddress]=useState(user?.shopAddress || "")
  const [gstNumber,setGstNumber]=useState(user?.gstNumber|| "")
  const [loading,setLoading]=useState(false)
  const router=useRouter()
  const handleVerifyAgain=async ()=>{
    if(!shopAddress || !shopName || !gstNumber)
    {
      alert("Fill all fields")
      return;
    }
    setLoading(true)
    try {
      const result=await axios.post("/api/vendor/verifyagain",{
        shopName,
        shopAddress,
        gstNumber
      })
      console.log(result.data)
      setLoading(false)
      alert("Verification request sent again Successfully ✅")
      router.push("/")
    } catch (error) {
      console.log(error)
      setLoading(false)
      alert("Failed to send verification ❌")
    }
  }

    if(!user)
    {
    return (<div className='w-full min-h-screen flex items-center 
    justify-center text-white bg-linear-to-br
     from-gray-900 via-black to-gray-900'>
      Loading...
    </div>)
    }
    if(user.verificationStatus=="approved")
    {
      return (
        <div className='w-full min-h-screen pt-16'>
          <VendorDashboard/>
        </div>
      )
    }
    if(user.verificationStatus=="pending")
    {
      return (
        <div className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4'>
          <div className='bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center'>
          <h2 className='text-4xl font-bold mb-6 text-blue-400'>Verfication Pending ⌛</h2>
          <p className='text-gray-200 text-lg leading-relaxed'>
            You can access vendor dashboard only after 
            <span className='font-semibold'>admin verification</span>
          </p>
          <div className='mt-6 text-base text-gray-300'>
            VerificationStatus : {" "} <span className='text-blue-400 font-semibold uppercase'>{user.verificationStatus}</span>
          </div>
          <div className='mt-10 text-sm text-gray-400'>It usually takes 2-3 hours.</div>
          </div>
          
        </div>
      )
    }
    if(user.verificationStatus=="rejected")
    {
      return (
        <div className='w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4'>
          <div className='bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center'>
          <h2 className='text-4xl font-bold mb-6 text-red-400'>Verfication Rejected ❌</h2>
          <p className='text-gray-200 text-lg leading-relaxed'>
            Your business verification was rejected by 
            <span className='font-semibold'>Admin</span>
          </p>
          <div className='mt-6 mb-2 text-base text-gray-300'>
            VerificationStatus : {" "} <span className='text-red-400 font-semibold uppercase'>{user.verificationStatus}</span>
          </div>
          <div className='text-sm text-red-300 mb-6'>Rejected Reason : {user.rejectedReason}</div>

          {!openVerifyform ? (
            <button 
            onClick={()=>setOpenVerifyform(true)}
            className='bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold'>
              Verify Again
            </button>
          ):(
            <div className='mt-6 text-left space-y-4'>
              <input
              placeholder='Shop Name' 
              type="text" 
              className='w-full p-3 rounded bg-white/10 border border-white/20'
              onChange={(e)=>setShopName(e.target.value)}
              value={shopName}
              />
              <input
              placeholder='Shop Address' 
              type="text" 
              className='w-full p-3 rounded bg-white/10 border border-white/20'
              onChange={(e)=>setShopAddress(e.target.value)}
              value={shopAddress}
              />
              <input
              placeholder='GST Number' 
              type="text" 
              className='w-full p-3 rounded bg-white/10 border border-white/20'
              onChange={(e)=>setGstNumber(e.target.value)}
              value={gstNumber}
              />
              <button 
              onClick={handleVerifyAgain}
              disabled={loading}
              className='w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold'>
                {loading ? <ClipLoader size={20} color='white'/> : "Submit & Verify again"}</button>
                <button className='w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-semibold'
                onClick={()=>setOpenVerifyform(false)}
                >
                Cancel</button>
            </div>
          ) }

          </div>
    </div> 
      )
    }
  
}

export default VendorPage

'use client'
import { IUser } from '@/model/user.model'
import { AppDispatch, RootState } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
import VendorDashboard from './VendorDashBoard'

function VendorPage({ user: initialUser }: { user: IUser }) {
  const dispatch = useDispatch<AppDispatch>()
  const userData = useSelector((state: RootState) => state.user.userData)
  const user = userData ?? initialUser

  const [openVerifyform, setOpenVerifyform] = useState(false)
  const [shopName, setShopName] = useState(user?.shopName || "")
  const [shopAddress, setShopAddress] = useState(user?.shopAddress || "")
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setShopName(user?.shopName || "")
    setShopAddress(user?.shopAddress || "")
    setGstNumber(user?.gstNumber || "")
  }, [user?.shopName, user?.shopAddress, user?.gstNumber])

  useEffect(() => {
    if (user?.role !== "vendor" || user?.verificationStatus === "approved") return

    const refetchUser = async () => {
      try {
        const result = await axios.get("/api/user/currentUser")
        dispatch(setUserData(result.data))
        router.refresh()
      } catch (error) {
        console.log(error)
      }
    }

    refetchUser()
    const interval = setInterval(refetchUser, 10000)
    return () => clearInterval(interval)
  }, [dispatch, router, user?.role, user?.verificationStatus])

  const handleVerifyAgain = async () => {
    if (!shopAddress || !shopName || !gstNumber) {
      alert("Fill all fields")
      return
    }
    setLoading(true)
    try {
      const result = await axios.post("/api/vendor/verifyagain", {
        shopName,
        shopAddress,
        gstNumber,
      })
      console.log(result.data)
      const refreshed = await axios.get("/api/user/currentUser")
      dispatch(setUserData(refreshed.data))
      setOpenVerifyform(false)
      setLoading(false)
      alert("Verification request sent again Successfully ✅")
      router.refresh()
    } catch (error) {
      console.log(error)
      setLoading(false)
      alert("Failed to send verification ❌")
    }
  }

  if (!user) {
    return (
      <div
        className="w-full min-h-screen flex items-center 
    justify-center text-white bg-linear-to-br
     from-gray-900 via-black to-gray-900"
      >
        Loading...
      </div>
    )
  }
  if (user.verificationStatus == "approved") {
    return <VendorDashboard />
  }
  if (user.verificationStatus == "pending") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
        <div className="bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center">
          <h2 className="text-4xl font-bold mb-6 text-blue-400">Verfication Pending ⌛</h2>
          <p className="text-gray-200 text-lg leading-relaxed">
            You can access vendor dashboard only after
            <span className="font-semibold"> admin verification</span>
          </p>
          <div className="mt-6 text-base text-gray-300">
            VerificationStatus :{" "}
            <span className="text-blue-400 font-semibold uppercase">{user.verificationStatus}</span>
          </div>
          <div className="mt-10 text-sm text-gray-400">It usually takes 2-3 hours.</div>
        </div>
      </div>
    )
  }
  if (user.verificationStatus == "rejected") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
        <div className="bg-white/10 backdrop-blur-md p-12 rounded-2xl shadow-2xl border border-white/30 max-w-2xl w-full text-center">
          <h2 className="text-4xl font-bold mb-6 text-red-400">Verfication Rejected ❌</h2>
          <p className="text-gray-200 text-lg leading-relaxed">
            Your business verification was rejected by
            <span className="font-semibold"> Admin</span>
          </p>
          <div className="mt-6 mb-2 text-base text-gray-300">
            VerificationStatus :{" "}
            <span className="text-red-400 font-semibold uppercase">{user.verificationStatus}</span>
          </div>
          <div className="text-sm text-red-300 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <span className="font-semibold">Rejected Reason:</span>{" "}
            {user.rejectedReason || "No reason provided by admin"}
          </div>

          {!openVerifyform ? (
            <button
              onClick={() => setOpenVerifyform(true)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
            >
              Verify Again
            </button>
          ) : (
            <div className="mt-6 text-left space-y-4">
              <input
                placeholder="Shop Name"
                type="text"
                className="w-full p-3 rounded bg-white/10 border border-white/20"
                onChange={(e) => setShopName(e.target.value)}
                value={shopName}
              />
              <input
                placeholder="Shop Address"
                type="text"
                className="w-full p-3 rounded bg-white/10 border border-white/20"
                onChange={(e) => setShopAddress(e.target.value)}
                value={shopAddress}
              />
              <input
                placeholder="GST Number"
                type="text"
                className="w-full p-3 rounded bg-white/10 border border-white/20"
                onChange={(e) => setGstNumber(e.target.value)}
                value={gstNumber}
              />
              <button
                onClick={handleVerifyAgain}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
              >
                {loading ? <ClipLoader size={20} color="white" /> : "Submit & Verify again"}
              </button>
              <button
                className="w-full bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-semibold"
                onClick={() => setOpenVerifyform(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default VendorPage

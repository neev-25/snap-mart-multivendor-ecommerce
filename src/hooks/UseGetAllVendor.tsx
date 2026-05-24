'use client'
import { AppDispatch } from '@/redux/store'
import { setAllVendorData } from '@/redux/vendorSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function UseGetAllVendor() {
    const dispatch=useDispatch<AppDispatch>()
 useEffect(()=>{
    const fetchAllVendor=async()=>{
        try {
            const result=await axios.get("/api/vendor/AllVendor")
            // console.log(result.data)
            dispatch(setAllVendorData(result.data.vendors))

        } catch (error) {
            console.log(error)
            dispatch(setAllVendorData(null))
        }
    }
    fetchAllVendor()
 },[])
 
}

export default UseGetAllVendor

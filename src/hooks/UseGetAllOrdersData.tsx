'use client'
import { AppDispatch } from '@/redux/store'
import { setAllOrdersData } from '@/redux/userSlice'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function UseGetAllOrdersData() {
    const dispatch=useDispatch<AppDispatch>()
    const { status } = useSession()

 useEffect(()=>{
    if (status === 'loading') return
    if (status !== 'authenticated') {
      dispatch(setAllOrdersData([]))
      return
    }

    const fetchAllOrders=async()=>{
        try {
            const result=await axios.get("/api/order/allOrders")
            dispatch(setAllOrdersData(result.data))

        } catch (error) {
            console.log(error)
            dispatch(setAllOrdersData([]))
        }
    }
    fetchAllOrders()
 },[status, dispatch])
 
}

export default UseGetAllOrdersData

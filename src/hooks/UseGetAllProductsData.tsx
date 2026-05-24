'use client'
import { AppDispatch } from '@/redux/store'
import { setAllProductsData} from '@/redux/vendorSlice'
import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function UseGetAllProducts() {
    const dispatch=useDispatch<AppDispatch>()
 useEffect(()=>{
    const fetchAllProducts=async()=>{
        try {
            const result=await axios.get("/api/vendor/allProduct")
            dispatch(setAllProductsData(result.data))
            console.log(result.data)

        } catch (error) {
            console.log(error)
            dispatch(setAllProductsData(null))
        }
    }
    fetchAllProducts()
 },[])
 
}

export default UseGetAllProducts

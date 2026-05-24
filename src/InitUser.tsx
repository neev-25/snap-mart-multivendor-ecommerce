'use client'
import React from 'react'
import UseGetCurrentUser from './hooks/UseGetCurrentUser'
import UseGetAllVendor from './hooks/UseGetAllVendor'
import UseGetAllProducts from './hooks/UseGetAllProductsData'
import UseGetAllOrdersData from './hooks/UseGetAllOrdersData'

function InitUser() {
 UseGetCurrentUser()
 UseGetAllVendor() 
 UseGetAllProducts()
 UseGetAllOrdersData()
 return null
}

export default InitUser

"use client"
import { getOrderDisplayId } from '@/lib/orderDisplay'
import { AppDispatch, RootState } from '@/redux/store'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios';
import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData';
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser';
import { setAllOrdersData } from '@/redux/userSlice';
import { useKeyedActionLock } from '@/hooks/useActionLock';
import { showToast } from '@/component/ui/ToastProvider';
import { ClipLoader } from 'react-spinners';

function VendorOrders() {

  UseGetAllOrdersData()
  UseGetCurrentUser()
  const dispatch=useDispatch<AppDispatch>()
  const [otpModel,setOtpModel]=useState<any|null>(null)
  const [otp,setOtp]=useState("")
  const [verifyingOtp,setVerifyingOtp]=useState(false)
  const { run: runOrderAction, isBusy } = useKeyedActionLock()
  const {userData}=useSelector((state:RootState)=>state.user)
  const {allOrdersData}=useSelector((state:RootState)=>state.user)

  const orders=Array.isArray(allOrdersData)?allOrdersData.filter((o)=>String(o.productVendor?._id ?? o.productVendor)===String(userData?._id)):[]

const orderKey = (order: { _id: unknown }) => String(order._id)
const statusOptions=["pending","confirmed","shipped","delivered"];

const requestDeliveryOtp=async (order:any) => {
  const key = `otp-${order._id}`
  await runOrderAction(key, async () => {
    try {
      await axios.post("/api/order/update-status",{orderId:orderKey(order),status:"delivered"})
      setOtpModel(order)
      setOtp("")
      showToast("OTP sent to buyer email")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message || "Failed to send delivery OTP", "error")
      throw error
    }
  })
}

const updateStatus=async (orderId:string,status:string) => {
  await runOrderAction(orderId, async () => {
    try {
      await axios.post("/api/order/update-status",{orderId,status})
      dispatch(setAllOrdersData(
        allOrdersData.map((o:any)=>(
          orderKey(o)===String(orderId)?{...o,orderStatus:status}:o
        ))
      ))
      showToast(`Order marked as ${status}`)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message || "Failed to update status", "error")
      throw error
    }
  })
}

const verifyOtp=async () => {
  if (verifyingOtp) return
  if (!otp.trim()) {
    showToast("Please enter the OTP", "error")
    return
  }
  setVerifyingOtp(true)
  try {
    await axios.post("/api/order/verify-delivery-otp",{
      orderId:orderKey(otpModel),
      otp:otp.trim()
    })
    dispatch(setAllOrdersData(
      allOrdersData.map((o:any)=>(
        orderKey(o)===orderKey(otpModel)?{...o,orderStatus:"delivered",isPaid:o.paymentMethod==="cod"?true:o.isPaid}:o
      ))
    ))
    showToast("Order delivered successfully")
    setOtpModel(null)
    setOtp("")
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    showToast(err?.response?.data?.message || "Invalid OTP", "error")
  } finally {
    setVerifyingOtp(false)
  }
}

const handleStatusChange = async (order: any, nextStatus: string, selectEl: HTMLSelectElement) => {
  if (isBusy(String(order._id)) || isBusy(`otp-${order._id}`)) {
    selectEl.value = order.orderStatus
    return
  }
  if (nextStatus === "delivered") {
    selectEl.value = order.orderStatus
    await requestDeliveryOtp(order)
  } else {
    await updateStatus(String(order._id), nextStatus)
  }
}


return (
    <div className="w-full">
      <div className='flex items-center justify-between'>
        <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold mb-6 text-center sm:text-left'>
        Vendor Orders
      </h1>
      <p className='text-gray-300'>{orders.length} Orders</p>
      </div>
      {/* desktop table */}
      <div className='hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10'>
      <table className='w-full text-left'>
        <thead className='bg-white/10'>
        <tr>
          <th className='p-4'>Orders</th>
          <th className='p-4'>Buyers</th>
          <th className='p-4'>Products</th>
          <th className='p-4'>Payment</th>
          <th className='p-4'>Status</th>
          <th className='p-4 text-center'>Update</th>
        </tr>
        </thead>
        <tbody>
          {orders.length===0?(
            <tr>
              <td  colSpan={6} className='p-6 text-center text-gray-400'>No Orders found</td>
            </tr>
          ):(
            orders.map((order,index)=>(
              <tr 
              key={index}
              className='border-t border-white/10 hover:bg-white/5'
              >
                <td className='p-4'>{getOrderDisplayId(order)}</td>
                <td className='p-4'>{order.address.name}
                  <div className='text-xs text-gray-400'>
                    {order.address.phone}
                  </div>
                </td>
                <td className='p-4'>
                  {order.products.map((p:any,i:number)=>(
                    <div key={i}>
                      {p.product?.title} x {p.quantity}
                    </div>
                  ))}
                </td>
                <td className='p-4'>{order.paymentMethod.toUpperCase()}
                  <div className='text-xs text-gray-400'>
                    {order.isPaid?"Paid":"Pending"}
                  </div>
                </td>
                <td className='p-4'>{order.orderStatus.toUpperCase()}</td>
              <td className='p-4'>

              {order.orderStatus==="cancelled" && (
                <span className='text-red-400 font-semibold capitalize'>
                  Cancelled
                </span>
              )}
              {order.orderStatus==="delivered" && (
                <span className='text-green-400 font-semibold capitalize'>
                  Delivered
                </span>
              )}
              {order.orderStatus==="returned" && (
                <span className='text-orange-400 font-semibold capitalize'>
                  Returned
                </span>
              )}

              {
                order.orderStatus!=="cancelled" && 
                order.orderStatus!=="delivered" && 
                order.orderStatus!=="returned" &&
                <select 
              disabled={isBusy(String(order._id)) || isBusy(`otp-${order._id}`)}
              onChange={async (e) => {
                await handleStatusChange(order, e.target.value, e.currentTarget)
              }}
              title='status' value={order.orderStatus} className='bg-white/10 justify-center border border-white/20 rounded px-2 py-1 disabled:opacity-50'>
              {statusOptions.map((s,i)=>(
                <option key={i} value={s} className='bg-black'>{s}</option>
              ))}
              </select>}
              {(isBusy(String(order._id)) || isBusy(`otp-${order._id}`)) && (
                <span className="ml-2 inline-flex align-middle">
                  <ClipLoader size={14} color="#fff" />
                </span>
              )}
              </td>
              </tr>
            ))
          )}


        </tbody>
      </table>
      </div>
      {/* mobile card */}
      <div className='md:hidden flex flex-col gap-4'>
        {orders.length===0?(
          <div className='text-center text-gray-400 mt-10'>
            No Orders found
          </div>
        ):(
          orders.map((order,index)=>(
            <div key={index} className='bg-white/10 border border-white/20 rounded-xl p-4 space-y-2'>
             <div className='flex justify-between mb-2'>
              <span className='text-sm'>{getOrderDisplayId(order)}</span>
              <span className='text-green-400 font-bold'>₹ {order.totalAmount}</span>
             </div>
             <p className='text-sm'>
              <b>Buyer:</b>{order.address?.name}
             </p>
             <p className='text-xs text-gray-400'>
              {order.address?.phone}
             </p>

             <div className='mt-2 text-sm'>
              {order.products.map((p:any,i:number)=>(
                <p key={i}>
                  {p.product?.title} x {p.quantity}
                </p>
              ))}
             </div>

            <div className='mt-3 text-sm'>
              <b>Status:</b>{" "}
              <span className='capitalize'>{order.orderStatus}</span>
            </div> 
            {order.orderStatus==="cancelled" && (
                <span className='text-red-400 font-semibold capitalize'>
                  Cancelled
                </span>
              )}
              {order.orderStatus==="delivered" && (
                <span className='text-green-400 font-semibold capitalize'>
                  Delivered
                </span>
              )}
              {order.orderStatus==="returned" && (
                <span className='text-orange-400 font-semibold capitalize'>
                  Returned
                </span>
              )}
            {
              order.orderStatus!=="cancelled" && 
              order.orderStatus!=="delivered" && 
              order.orderStatus!=="returned" &&
              <select 
            disabled={isBusy(String(order._id)) || isBusy(`otp-${order._id}`)}
            onChange={async (e) => {
                await handleStatusChange(order, e.target.value, e.currentTarget)
              }}
            title='status' value={order.orderStatus} className='bg-white/10 justify-center border border-white/20 rounded px-2 py-1 disabled:opacity-50'>
              {statusOptions.map((s,i)=>(
                <option key={i} value={s} className='bg-black'>{s}</option>
              ))}
              </select>}            

            </div>
          ))
        )}
      </div>

      {otpModel && 
      (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50'>
          <div className='bg-[#061526] p-6 rounded-xl w-full max-w-md'>
            <h2 className='text-lg font-semibold mb-3'>
              Enter Delivery OTP
            </h2>
            <input type="text" 
            className='w-full bg-white/10 border border-white/20 px-4 py-2 rounded mb-4'
            placeholder='Enter Otp'
            onChange={(e)=>setOtp(e.target.value)}
            value={otp}
            disabled={verifyingOtp}
            />
            <button 
            onClick={verifyOtp}
            disabled={verifyingOtp}
            className='w-full bg-green-600 py-2 rounded flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60'>
              {verifyingOtp ? <ClipLoader size={18} color="white" /> : "Verify & Deliver"}
            </button>
            <button 
            onClick={()=>{setOtpModel(null);setOtp("")}}
            disabled={verifyingOtp}
            className='w-full mt-2 bg-white/10 py-2 rounded disabled:opacity-50'>
              Cancel
            </button>
          </div>
        </div>
      )}
    

    </div>
  )
}

export default VendorOrders

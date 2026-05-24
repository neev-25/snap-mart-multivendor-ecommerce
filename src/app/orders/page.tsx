'use client'
import UseGetAllOrdersData from '@/hooks/UseGetAllOrdersData'
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser'
import { AppDispatch, RootState } from '@/redux/store'
import React, { useState } from 'react'
import { FiTruck } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'motion/react';
import axios from 'axios'
import { setAllOrdersData } from '@/redux/userSlice'

function Orders() {
  UseGetAllOrdersData()
  UseGetCurrentUser()
  const {userData}=useSelector((state:RootState)=>state.user)
  const {allOrdersData}=useSelector((state:RootState)=>state.user)
  const [selectedOrder,setSelectedOrder]=useState<any|null>(null)
  const [trackOrderModel,setTrackOrderModel]=useState<any|null>(null)


  const orders=Array.isArray(allOrdersData)?
  allOrdersData.filter((o)=>String(o.buyer._id)===String(userData?._id)) : []
  
  if(!orders)
  {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-4xl text-white p-6'>
        Loading Orders...
      </div>
    )
  }

  const dispatch=useDispatch<AppDispatch>()

  const formatDate=(date:string)=>{
    if(!date)
      return;

    const d=new Date(date)
    return d.toLocaleString("en-IN",{
      day:"2-digit",
      month:"short",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit",
    });
  };

  const isCancelDisable=(order:any)=> order.isPaid===true && order.paymentMethod==="stripe"
  
  const status=["pending","confirmed","shipped","delivered"];
  const renderTrackStep=(currentStatus:string)=>{
    return (
      <div className='relative pl-6'>
      <div className='absolute top-0 left-8 w-[1px] h-full  bg-gray-600'> </div>
        {status.map((s,i)=>{
          const active=currentStatus===s
          return(
            <div
            key={i}
            className='relative mb-6 flex items-start'
            >
              {/* dot */}
              <div className={`
                w-4 h-4 rounded-full ${active?"bg-blue-500 shadow-lg shadow-blue-500/50":"bg-gray-500"}
                `}></div>
                <div className='ml-4 text-sm'>{s.toUpperCase()}</div>
            </div>
          )
        })}
     
      </div>
    )
  }

  const handleCancel=async (orderId:string) => {
    try {
      await axios.post("/api/order/cancelOrder",{orderId})
      const updatedOrder=allOrdersData.map((o:any)=>o._id===orderId ? {...o,orderStatus:"cancelled"}:o)
      dispatch(setAllOrdersData(updatedOrder))
      alert("Order Cancelled")
      setSelectedOrder(null)
    } catch (error) {
      console.log(error)
      alert("Order Cancel error")
    }
  }

  const isEligibleReturn=(deliveryDate:string,replacementDays:number)=>
  {
    if(!deliveryDate || !replacementDays)
      return false;

    const deliveredAt=new Date(deliveryDate).getTime();

    const expiry=deliveredAt+replacementDays*24*60*60*1000;

    return Date.now()<=expiry;

  }
  
  const remainingDays=(deliveryDate:string,replacementDays:number)=>{
    if(!deliveryDate || !replacementDays)
      return 0;

    const deliveredAt=new Date(deliveryDate).getTime();

    const expiry=deliveredAt+replacementDays*24*60*60*1000;

    const diff=expiry-Date.now();

    if(diff<=0)
      return 0;

    return Math.ceil(diff/(24*60*60*1000));
  }
  const ReturnDate=(deliveryDate:string,replacementDays:number)=>{
    if(!deliveryDate || !replacementDays)
      return null;

    const deliveredAt=new Date(deliveryDate);
    deliveredAt.setDate(deliveredAt.getDate()+replacementDays);

    return deliveredAt;
  }

  const returnOrder=async (orderId:string) => {
    try {
      const result=await axios.post("/api/order/return",{orderId})
      const updatedOrder=allOrdersData.map((o:any)=>o._id===orderId ? {...o,orderStatus:"returned",returnedAmount:result.data.returnedAmount}:o)
      dispatch(setAllOrdersData(updatedOrder))
      alert("Order returned")
      setSelectedOrder(null)
    } catch (error) {
      console.log(error) 
      alert("Order returned error")
    }
  }


  return (
    <div className='min-h-screen p-6 bg-gradient-to-br from-black via-gray-900 to-black text-white'>
      <div className='max-w-6xl mx-auto'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold'>My Orders</h1>
            <p className='text-sm text-gray-300'>All orders placed by you</p>
          </div>
          <div className='text-sm text-gray-300'>
            {orders.length} Orders
          </div>
        </div>

        {/* large devices */}
        <div className='hidden lg:block bg-white/5 border border-white/10 rounded-xl overflow-auto shadow-xl shadow-black/40'>
        <table className='w-full text-left'>
          <thead className='text-xs bg-white/5 border-b border-white/10 text-gray-300 uppercase tracking-wider'>
          <tr>
            <th className='px-4 py-4'>Order ID</th>
            <th className='px-4 py-4'>Date</th>
            <th className='px-4 py-4'>Products</th>
            <th className='px-4 py-4'>Vendor</th>
            <th className='px-4 py-4'>Payment</th>
            <th className='px-4 py-4'>Status</th>
            <th className='px-4 py-4 text-right'>Total</th>
            <th className='px-4 py-4 text-center'>Actions</th>
          </tr>
          </thead>
          <tbody>
            {
              orders.length!==0 ? 
              (
                (orders.map((order,index)=>(
              <tr 
              key={index}
              className='border-t border-white/5 hover:bg-white/10 transition-all duration-200'>
                <td className='px-4 py-4 text-sm'>#{String(order._id).slice(-8)}</td>
                <td className='px-4 py-4 text-sm'>{formatDate(String(order.createdAt))}</td>
                <td className='px-4 py-4 text-sm'>{order.products.map((p,i)=>(
                  <div key={i} className='text-gray-200'>{p.product.title} * {p.quantity}</div>
                ))}</td>
                <td className='px-4 py-4 text-sm'>
                  {order.productVendor.shopName}
                </td>
                <td className='px-4 py-4 text-sm'>
                  {order.paymentMethod.toUpperCase()}
                  <div
                  className={`text-xs ${order.isPaid ?
                    "text-green-300":"text-yellow-300"
                  }`}
                  >
                    {order.isPaid?"paid":"pending"}
                  </div>
                </td>
                <td className='px-4 py-4 text-sm'>
                  {order.orderStatus.toUpperCase()}
                </td>
                <td className='px-4 py-4 text-right text-green-300 font-semibold'>
                  ₹{order.totalAmount}
                </td>
                <td className='px-4 py-4 flex justify-center'>
                  {order.orderStatus==="cancelled" && (
                      <span className='text-red-400 font-semibold'>Cancelled</span>
                    )}
                    {order.orderStatus==="returned" && (
                <span className='text-orange-400 font-semibold flex flex-col gap-1 text-nowrap'>Returned<span className='text-white'>Returned Amount : {order.returnedAmount}</span></span>
              )}
                    {order.orderStatus!=="cancelled" && order.orderStatus!=="returned" && 
                  <div className='flex gap-2'>
                    
                    <button 
                    onClick={()=>setSelectedOrder(order)}
                    className='px-3 py-1 bg-white/10 rounded text-nowrap hover:bg-white/20'>Check Details</button>
                    <button 
                    disabled={order.orderStatus==="delivered"}
                    onClick={()=>setTrackOrderModel(order)}
                    // className='px-3 py-1 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center gap-0.5'
                    className={`px-3 py-1 rounded flex items-center gap-2 transition text-nowrap
                      ${order.orderStatus==="delivered"
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                        :"bg-white/10 hover:bg-white/20"      
                      }`}
                    >
                      <FiTruck/>
                      {order.orderStatus==="delivered" ? "Delivered" : "Track Order"}
                      </button>
                  </div>}
                </td>
              </tr>
            
            )))
              )
              :
              (
                <tr>
                  <td className='text-center text-gray-400 p-6' colSpan={8}>
                    No orders found
                  </td>
                </tr>
              )
            }
            

          </tbody>
        </table>
        </div>

        <div className='lg:hidden space-y-4'>
        {  orders.length!==0 ? 
        (
          orders.map((order,index)=>(
            <motion.div
            initial={{scale:0.95,opacity:0}}
            animate={{scale:1,opacity:1}}
            transition={{duration:0.4}}
            key={index}
            className='bg-white/5 border border-white/10 p-4 rounded'
            >
              <div className='flex justify-between'>
                <div>
                  <div className='text-sm text-gray-300'>#{String(order._id).slice(-8)}</div>
                  <div className='font-semibold'>{formatDate(String(order.createdAt))}</div>
                  <div className='text-sm text-gray-300 mt-1'>{order.productVendor.shopName}</div>
                </div>
                <div className='text-green-300 font-bold text-right'>
                 ₹ {order.totalAmount}
                </div>
              </div>
              <div
              className='mt-3 flex justify-between'
              >
                <div>
                  <div className='text-sm text-gray-400'>
                    Payment Method: {" "}
                    {order.paymentMethod.toUpperCase()}
                  </div>
                  <div className={`text-sm font-semibold ${order.isPaid?"text-green-400":"text-yellow-400"}`}>
                    {order.isPaid?"paid":"pending"}
                    </div>
                </div>
                <div className='text-right'>
                  <div className='text-xs text-gray-400'>Status</div>
                  <div className='text-sm font-semibold'>{order.orderStatus.toUpperCase()}</div>
                </div>
              </div>
              <div className='mt-3 space-y-1'>
                {order.products.map((p,i)=>(
                  <div key={i} className='text-gray-200 text-sm'>
                    {p.product.title} * {p.quantity}
                  </div>
                ))}
              </div>
              {order.orderStatus==="cancelled" && (
                <span className='text-red-400 font-semibold'>Cancelled</span>
              )}
              {order.orderStatus==="returned" && (
                <span className='text-orange-400 font-semibold flex flex-col gap-1 text-nowrap'>Returned<span className='text-white'>Returned Amount : {order.returnedAmount}</span></span>
              )}
                    {order.orderStatus!=="cancelled" && order.orderStatus!=="returned" && 
              <div className='mt-3 flex gap-2'>
                <button 
                onClick={()=>setSelectedOrder(order)}
                className='flex-1 py-2 bg-white/10 rounded'>
                Check Details
                </button>
                {/* <button 
                onClick={()=>setTrackOrderModel(order)}
                className='flex flex-1 items-center justify-center gap-1 py-2 bg-white/10 rounded'>
                <FiTruck/>Track Order
                </button> */}
                <button 
                    disabled={order.orderStatus==="delivered"}
                    onClick={()=>setTrackOrderModel(order)}
                    // className='px-3 py-1 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center gap-0.5'
                    className={`px-3 py-1 rounded flex items-center gap-2 transition text-nowrap
                      ${order.orderStatus==="delivered"
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                        :"bg-white/10 hover:bg-white/20"      
                      }`}
                    >
                      <FiTruck/>
                      {order.orderStatus==="delivered" ? "Delivered" : "Track Order"}
                      </button>
              </div>}
          </motion.div>
          ))
        )
        :
        
          <motion.div 
          initial={{scale:0.95,opacity:0}}
          animate={{scale:1,opacity:1}}
          transition={{duration:0.4}}
          className='text-xl text-center  text-gray-600 bg-white/5 border border-white/10 p-4 rounded-xl '>
            No Orders found
          </motion.div>
          
      }
        </div>

      </div>
      {selectedOrder && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
          initial={{scale:0.95,opacity:0}}
          animate={{scale:1,opacity:1}}
          transition={{duration:0.4}}
          className='relative z-10 w-full max-w-3xl bg-[#061526] border border-white/10 p-6 rounded-xl shadow-xl shadow-black/40'
          >
            <h2 className='text-lg font-semibold'>#{String(selectedOrder._id).slice(-8)}</h2>
            <p className='text-sm text-gray-300'>{formatDate(String(selectedOrder.createdAt))}</p>
            <hr className='my-4 border-white/10'/>
            <h3 className='font-semibold mb-2'>Product</h3>
            {selectedOrder.products.map((p:any,i:any)=>(
              <div key={i} className='flex justify-between bg-white/5 p-3 rounded mb-2'>
                <div>
                  <div className='font-medium'>
                    {p.product.title} 
                  </div>
                  <div>
                    Qty : {p.quantity} * Price: {p.price}
                  </div>
                </div>
              
              </div>
            ))}
            <hr className='my-4 border-white/10'/>
            <h3 className='font-semibold mb-2'>
              Invoice  
            </h3>
            <div className='text-sm space-y-1'>
              <div className='flex justify-between'>
                <span>Product Total</span>
                <span>{selectedOrder.productsTotal}</span>
              </div>
              <div className='flex justify-between'>
                <span>Delivery Charge</span>
                <span>{selectedOrder.deliveryCharge}</span>
              </div>
              <div className='flex justify-between'>
                <span>Service Charge</span>
                <span>{selectedOrder.serviceCharge}</span>
              </div>
              </div>
              <hr className='my-4 border-white/10'/>
              <div className='flex justify-between font-semibold text-green-300'>
                <span>Final Total</span>
                <span>₹ {selectedOrder.totalAmount}</span>
              </div>

              {selectedOrder.orderStatus==="delivered" && 
              selectedOrder.deliveryDate && (
                <div className='mt-3 text-sm text-green-400'>
                  Delivered on : {" "}
                  {new Date(selectedOrder.deliveryDate).toLocaleDateString("en-IN")}
                </div>
              )}

            {selectedOrder.isPaid === true && selectedOrder.paymentMethod === "stripe" && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs rounded-lg p-3 mt-4">
              <p className="font-semibold mb-1">Important Note:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Order cancellation feature is <b>not available if payment is done 
                  using Online Payment (Stripe)</b>.
                </li>
                <li>You can only <b>return the product</b> after delivery.</li>
                <li>
                  On return, you will receive only the <b>product amount</b>.
                </li>
                <li>
                  <b>Delivery & service charges are non-refundable.</b>
                </li>
              </ul>
            </div>
            )}
            <div className='mt-6 flex flex-col sm:flex-row justify-end gap-3'>
              <button 
              onClick={()=>setSelectedOrder(null)}
              className='px-4 py-2 bg-white/10 rounded'
              >
                Cancel
              </button>
              <button 
                    disabled={selectedOrder.orderStatus==="delivered"}
                    onClick={()=>setTrackOrderModel(selectedOrder)}
                    // className='px-3 py-1 bg-white/10 rounded hover:bg-white/20 flex items-center justify-center gap-0.5'
                    className={`px-3 py-1 rounded flex items-center justify-center gap-2 transition text-nowrap
                      ${selectedOrder.orderStatus==="delivered"
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                        :"bg-white/10 hover:bg-white/20"      
                      }`}
                    >
                      <FiTruck/>
                      {selectedOrder.orderStatus==="delivered" ? "Delivered" : "Track Order"}
                      </button>
              {selectedOrder.orderStatus!=="delivered" ? (<button
              disabled={isCancelDisable(selectedOrder)}
              onClick={()=>handleCancel(selectedOrder._id)}
              className={`px-4 py-2 rounded 
                ${isCancelDisable(selectedOrder)

                  ?"bg-white/10 text-gray-400 cursor-not-allowed"
                  :"bg-red-600 hover:bg-red-700"
                }`}
              >
                Cancel Order
              </button>):(
                selectedOrder.products.map((p:any,i:number)=>{
                  const replacementDays=p.product.replacementDays||0;
                  const eligible=isEligibleReturn(selectedOrder.deliveryDate,replacementDays);
                  const remaining=remainingDays(selectedOrder.deliveryDate,replacementDays);
                  const returnEndDate=ReturnDate(selectedOrder.deliveryDate,replacementDays);
                  return(
                    <div
                    key={i}
                    className='flex md:flex-row flex-col justify-between items-center bg-white/5 px-3 py-2 rounded ml-2'
                    >
                      <div>
                        <p className='text-xs text-gray-300'>
                          {p.product?.title}
                        </p>
                        {eligible ? (
                          <>
                          <p className='text-xs text-yellow-400'>
                            Return available for {remaining} day
                            {remaining > 1 ? "s" :""}
                          </p>
                          {returnEndDate && (
                            <p className='text-[11px] text-gray-400'>
                              Return till: {" "}
                              {returnEndDate.toLocaleDateString("en-IN")}
                            </p>
                          )}
                          </>
                        ):(
                          <p className='text-xs text-red-400'>
                            Return window closed
                          </p>
                        )}
                      </div>
                      {eligible && (
                        <button
                        className='mx-3 px-3 py-1 bg-yellow-600 rounded text-sm'
                        onClick={()=>returnOrder(selectedOrder._id)}
                        >
                          Return
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
      {trackOrderModel && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <motion.div
          initial={{scale:0.95,opacity:0}}
          animate={{scale:1,opacity:1}}
          transition={{duration:0.4}}
          className='relative z-10 w-full max-w-md bg-[#061526] border border-white/10 p-6 rounded-xl space-y-2'
          >
            <h2 className='text-xl font-semibold'>Track Order</h2>
            <div className='text-sm text-gray-300 mb-4 leading-relaxed'>
              <span className='text-md font-bold mb-2'>Complete Delivery Address</span>
              <div className='flex justify-start gap-2'>
                <span className='font-semibold'>Buyer Name:</span>
                <span>{trackOrderModel.address.name}</span>
              </div>
              <div className='flex justify-start gap-2'>
                <span className='font-semibold'>Delivery Address:</span>
                <span>{trackOrderModel.address.address}</span>
              </div>
              <div className='flex justify-start gap-2'>
                <span className='font-semibold'>City:</span>
                <span>{trackOrderModel.address.city}
                </span>
              </div>
              <div className='flex justify-start gap-2'>
                <span className='font-semibold'>PinCode:</span>
                <span>{trackOrderModel.address.pincode}
                </span>
              </div>
              <div className='flex justify-start gap-2'>
                <span className='font-semibold'>Mobile no:</span>
                <span>{trackOrderModel.address.phone}
                </span>
              </div>
            </div>
            {renderTrackStep(trackOrderModel.orderStatus)}
            <button 
            onClick={()=>setTrackOrderModel(null)}
            className='px-4 py-2 bg-white/10 rounded'
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Orders

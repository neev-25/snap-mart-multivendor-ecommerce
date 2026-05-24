'use client'
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react';
import Image from 'next/image';
import { FaStripe } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

function Checkout() {
  const params=useParams();
  const productId=params.id as string;
  const [item,setItem]=useState<any>(null);
  const router=useRouter()
  const [paymentMethod,setPaymentMethod]=useState<"cod"|"stripe">("cod")
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [address,setAddress]=useState("");
  const [city,setCity]=useState("");
  const [pincode,setPincode]=useState("");
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if(!productId)
      return;

    const loadItem=async () => {
      try {
        const result=await axios.get("/api/user/cart/get")
        const foundItem=result.data.cart.find((i:any)=>i.product._id===productId)
        if(!foundItem)
        {
          router.replace("/cart")
        }
        setItem(foundItem)
        if(!foundItem.product.payOnDelivery)
        {
          setPaymentMethod("stripe")
        }


      } catch (error) {
        console.log(error)
        alert("failed to get item")
      }
    }
    loadItem()
  },[productId,router])

  if(!item)
  {
    return <div className='text-2xl min-h-screen bg-linear-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12'>
      Loading...
    </div>
  }

  const productTotal=item.product.price*item.quantity;
  const deliveryCharge=item.product.freeDelivery?0:50;
  const serviceCharge=30;
  const finalTotal=productTotal+deliveryCharge+serviceCharge;
  const codDisabled=!item.product.payOnDelivery

const handlePlaceOrder=async () => {
  if(!name || !phone || !address || !city || !pincode)
  {
    alert("Please fill all address fields");
    return;
  }
  const payload={
    productId,
    quantity:item.quantity,
    address:{name,phone,address,city,pincode},
    amount:finalTotal,
    deliveryCharge,
    serviceCharge,
  };
  setLoading(true)
  try {
    if(paymentMethod==="cod")
    {
      const result=await axios.post("/api/order/cod",payload)
      router.push("/order-success")
      console.log(result)
      setLoading(false)
    }
    else
    {
     const result=await axios.post("/api/order/online-pay",payload)
    window.location.href=result.data.url
    }
  } catch (error) {
    console.log(error)
    router.push("/order-failed")
    setLoading(false)
  }
}


  return (
    <div className='min-h-screen bg-linear-to-br from-[#020617] via-black to-[#020617] flex items-center justify-center px-4 py-12'>
      <motion.div
      initial={{opacity:0,y:40}}
      animate={{opacity:1,y:0}}
      transition={{duration:0.5}}
      className='w-full max-w-5xl bg-white/10 backdrop-blue-xl border border-white/20 rounded-3xl shadow-2xl p-6 md:p-10 grid md:grid-cols-2 gap-8'
      >
        <div className='space-y-5'>
          <h2 className='text-2xl font-bold text-white'>Delivery Address</h2>
          <input 
          type="text" 
          placeholder='Full Name'
          className='w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition'
          
          onChange={(e)=>setName(e.target.value)}
          value={name}
          />
          <input 
          type="text" 
          placeholder='Phone Number'
          className='w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition'
          onChange={(e)=>setPhone(e.target.value)}
          value={phone}
          />
          <textarea
          placeholder='Full Address'
          className='w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition'
          onChange={(e)=>setAddress(e.target.value)}
          value={address}
          />
          <div className='grid grid-cols-2 gap-4'>
          <input 
          type="text" 
          placeholder='city'
          className='w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition'
          onChange={(e)=>setCity(e.target.value)}
          value={city}
          />
          <input 
          type="text" 
          placeholder='Pincode'
          className='w-full p-3 rounded-xl bg-black/60 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-white/40 transition'
          onChange={(e)=>setPincode(e.target.value)}
          value={pincode}
          />
          </div>
        </div>
        {/* Order summart */}
        <div className='space-y-5'>
          <h2 className='text-2xl font-bold text-white'>
            Order Summary
          </h2>
          <div className='flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10'>
          <Image
          src={item.product.image1}
          alt='img'
          width={120}
          height={120}
          className='w-20 h-20 object-contain rounded-lg bg-white'
          />
          <div className='flex-1'>
            <p className='font-semibold text-gray-100'>{item.product?.title}</p>
            <p className='text-sm text-gray-400'>Qty: {item.quantity}</p>
          </div>
          <p className='font-bold text-green-400'>
            ₹ {productTotal}
          </p>
          </div>

          <div className='space-y-2 text-sm text-gray-300'>
            <div className='flex justify-between'>
              <span>Delivery Charge</span>
              <span>₹{deliveryCharge}</span>
            </div>
            <div className='flex justify-between'>
              <span>Service Charge</span>
              <span>₹{serviceCharge}</span>
            </div>
            <div 
            className='flex justify-between text-lg font-bold border-t border-white/20 pt-3 text-white'>
              <span>Total</span>
              <span className='text-green-400'>₹{finalTotal}</span>
            </div>
          </div>
          <div className='space-y-3'>
            <p className='font-semibold text-white'>Payment Method</p>
            <div className='flex gap-3'>
              <motion.button 
              whileHover={{scale:1.03}}
              whileTap={{scale:0.97}}
              onClick={()=>setPaymentMethod("cod")}
              disabled={codDisabled}
              className={`flex-1 py-3 text-white rounded-xl font-semibold transition 
              ${
                paymentMethod==="cod"
                ?"bg-blue-600"
                :"bg-white/10"
              }
              ${codDisabled ? "opacity-40 cursor-not-allowed":""}`}>
                Cash on Delivery
                </motion.button>
              <motion.button 
              whileHover={{scale:1.03}}
              whileTap={{scale:0.97}}
              onClick={()=>setPaymentMethod("stripe")}
              className={`flex-1 text-white py-3 rounded-xl font-semibold flex 
                items-center justify-center gap-2 transition
              ${
                paymentMethod==="stripe"
                ?"bg-blue-600"
                :"bg-white/10"
              }
              `}><FaStripe className='text-xl border rounded bg-green-300 text-black p-[2px]'/>Stripe</motion.button>
            </div>
          </div>

          <motion.button
          onClick={handlePlaceOrder}
          disabled={loading}
          whileHover={{scale:1.03}}
          whileTap={{scale:0.97}}
          className='w-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 py-4 rounded-2xl font-semibold text-lg transition'
          >
            {loading ? <ClipLoader size={20} color='white'/> : paymentMethod==="cod"
            ?"Place Order"
            :"Proceed to Secure Payment"
            }
          </motion.button>

        </div>
      </motion.div>
    </div>
  )
}

export default Checkout

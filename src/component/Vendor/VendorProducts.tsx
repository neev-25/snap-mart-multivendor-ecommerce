'use client'
import UseGetAllProducts from '@/hooks/UseGetAllProductsData';
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser';
import { AppDispatch, RootState } from '@/redux/store';
import { setAllProductsData } from '@/redux/vendorSlice';
import axios from 'axios';
import { motion } from 'motion/react'
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

function VendorProducts() {
  const router=useRouter();
  UseGetCurrentUser();
  UseGetAllProducts();
  const dispatch=useDispatch<AppDispatch>();
  const currentUser=useSelector((state:RootState)=>state.user.userData)
  const {allProductsData}=useSelector((state:RootState)=>state.vendor)
  const myProducts=currentUser?._id && allProductsData?.length ?
  allProductsData.filter((p:any)=>p.vendor===currentUser?._id || p.vendor?._id===currentUser?._id):[]

const toggleIsActive = async (productId: string, currentIsActive: boolean) => {
  try {
    const result = await axios.post("/api/vendor/isActiveProduct", {
      productId,
      isActive: !currentIsActive,
    });

    const updatedProducts = allProductsData.map((p: any) =>
      p._id === productId ? result.data : p
    );

    dispatch(setAllProductsData(updatedProducts));
  } catch (error) {
    console.log(error);
    alert("Update isActive error");
  }
};


  return (
    <div className='w-full p-4 sm:p-8 text-white'>
      {/* header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold'>My Products</h1>
        <motion.button 
        whileHover={{scale:1.03}}
        whileTap={{scale:0.97}}
        onClick={()=>router.push("/addVendorProduct")}
        className='bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg font-semibold text-sm sm:text-base'
        >
          + Add Product
        </motion.button>
      </div>

      <div className='hidden md:block overflow-x-auto bg-white/5 rounded-xl border border-white/10'>
      <table className='w-full text-left'>
        <thead className='bg-white/10'>
        <tr>
          <th className='p-4'>Image</th>
          <th className='p-4'>Title</th>
          <th className='p-4'>Price</th>
          <th className='p-4'>Status</th>
          <th className='p-4'>Active</th>
          <th className='p-4 text-center'>Action</th>

        </tr>
        </thead>
        <tbody>
          {myProducts.length===0?(
            <tr>
              <td  colSpan={5} className='p-6 text-center text-gray-400'>No Vendor Approval requests found</td>
            </tr>
          ):(
            myProducts.map((p,index)=>(
              <tr 
              key={index}
              className='border-t border-white/10 hover:bg-white/5'
              >
                <td className='p-4'>
                  <Image
                  src={p?.image1}
                  alt='img1'
                  width={50}
                  height={50}
                  className='rounded object-cover'
                  />
                </td>
                <td className='p-4'>{p.title}</td>
                <td className='p-4'>₹ {p.price}</td>
                <td className='p-4'><span className={`px-3 py-1 rounded-full text-xs bg-gray-500/30  ${p.verificationStatus==="approved" ? "text-green-400" : p.verificationStatus==="pending" ? "text-yellow-400" : "text-red-400"}`}
                >{p?.verificationStatus}</span></td>
                <td className='p-4'>
                 <span className={`text-sm ${
                  p.isActive
                  ?"text-green-400"
                  :"text-red-400"
                 }`}>{p?.isActive ? "Active" : "InAction"}</span>
                </td>
                <td className='p-4 text-center'>
                  <div className='flex items-center justify-center space-x-2'>
                  <motion.button 
                  whileHover={{scale:1.02}}
                  whileTap={{scale:0.97}}
                  onClick={()=>router.push(`/updateProduct/${p._id}`)}
                  className='px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-700'>Edit</motion.button>
                  <motion.button 
                  disabled={p.verificationStatus!=="approved"}
                  whileHover={{scale:1.02}}
                  whileTap={{scale:0.97}}
                  onClick={()=>toggleIsActive(String(p._id),Boolean(p.isActive))}
                  className={`px-3 py-1 rounded text-sm ${
                    p.verificationStatus==="approved"
                    ? "bg-green-600 hover:bg-green-700"
                    :"bg-gray-600 cursor-not-allowed"
                  }`}>{p.isActive ? "Disable" : "Enable"}</motion.button>
                  </div>
                  

                  {p.verificationStatus==="rejected" &&
                  <div className='mt-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2 rounded'>
                    <p><b>Rejected:</b>{" "}
                    {p.rejectedReason || " No reason provided"}
                    </p>
                    <p className='mt-1 text-yellow-300'>
                      After edit,product will be sent for re-verification
                    </p>
                  </div>}  



                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* mobile */}
      <div className='md:hidden flex flex-col gap-4'>
        {myProducts.length===0?(
          <div className='text-center text-gray-400 mt-10'>
            No Vendors product found
          </div>
        ):(
          myProducts.map((p,index)=>(
            <div key={index} className='bg-white/10 border border-white/20 rounded-xl p-4 space-y-2'>
              <div className='flex items-center gap-3'>
                <Image src={p.image1} alt='product' width={60} height={60} className='rounded'/>
              </div>
              <div>
                <h2 className='font-semibold'>{p.title}</h2>
                <p className='text-sm text-gray-300'>₹{p.price}</p>
              </div>
              <div className='mt-3 text-sm space-y-1'>
                <p>
                  <b>Status:</b>{" "}
                  <span className={`${p.verificationStatus==="approved" ? "text-green-400" : p.verificationStatus==="pending" ? "text-yellow-400" : "text-red-400"}`}>
                    {p.verificationStatus}
                  </span>
                </p>
                <p>
                  <b>Active:</b>{" "}
                  <span
                  className={
                    p.isActive
                    ?"text-green-400"
                    :"text-red-400"
                    }
                  >
                    {p.isActive?"Yes":"No"}
                  </span>
                </p>
              </div>
              {p.verificationStatus==="rejected" &&
                  <div className='mt-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-2 rounded'>
                    <p><b>Rejected:</b>{" "}
                    {p.rejectedReason || " No reason provided"}
                    </p>
                    <p className='mt-1 text-yellow-300'>
                      After edit,product will be sent for re-verification
                    </p>
                  </div>}

                  <div className='flex gap-3 mt-4'>
                      <motion.button 
                  whileHover={{scale:1.02}}
                  whileTap={{scale:0.97}}
                  onClick={()=>router.push(`/updateProduct/${p._id}`)}
                  className='px-3 py-1 rounded text-sm bg-purple-600 hover:bg-purple-700'>Edit</motion.button>
                  <motion.button 
                  disabled={p.verificationStatus!=="approved"}
                  whileHover={{scale:1.02}}
                  whileTap={{scale:0.97}}
                  onClick={()=>toggleIsActive(String(p._id),Boolean(p.isActive))}
                  className={`px-3 py-1 rounded text-sm ${
                    p.verificationStatus==="approved"
                    ? "bg-green-600 hover:bg-green-700"
                    :"bg-gray-600 cursor-not-allowed"
                  }`}>{p.isActive ? "Disable" : "Enable"}</motion.button>
                  </div>
            </div> 
          ))
        )}
      </div>

    </div>
  )
}

export default VendorProducts

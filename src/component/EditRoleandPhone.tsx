'use client'
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { AiOutlineShop, AiOutlineTool, AiOutlineUser } from 'react-icons/ai';
import { ClipLoader } from 'react-spinners';

const EditRoleandPhone = () => {
    const [role,setRole]=useState<string>("")
    const [phone,setPhone]=useState<string>("")
    const { update: updateSession } = useSession()

   const roles = [
  { label: "Admin", value: "admin", icon: <AiOutlineTool size={40} /> },
  { label: "Vendor", value: "vendor", icon: <AiOutlineShop size={40} /> },
  { label: "User", value: "user", icon: <AiOutlineUser size={40} /> },
];

const [adminExist,setAdminExist]=useState(false)
const [loading,setLoading]=useState(false)
const router=useRouter()
useEffect(()=>{
    const checkAdmin=async () => {
        try {
            const res=await axios.get("/api/admin/check-admin")
            setAdminExist(res.data.exists)
        } catch (error) {
            setAdminExist(false)
            console.log(error)
        }
    }
    checkAdmin()

},[])
const handleSubmit=async (e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(!role || !phone)
    {
        alert("please select the role and enter the phone number")
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number")
        return;
    }
    setLoading(true)
    try{
        const result=await axios.post("/api/user/edit-role-phone",{role,phone})
        await updateSession({ role: result.data.user.role })
        setLoading(false)
        router.refresh()
        router.push("/")
    }catch(error: unknown)
    {
        console.log(error)
        setLoading(false)
        const msg =
          axios.isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : "Could not save role. Please try again."
        alert(msg)
    }

}
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6'>
    <AnimatePresence>

    <motion.div
    initial={{opacity:0,y:40}}
      animate={{opacity:1,y:0}}
      exit={{opacity:0,y:-40}}
      transition={{duration:0.5}}
      className='w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white/10'
    >
        <h1 className='text-4xl font-semibold text-center mb-4'>Choose Your Role</h1>
        <p className='text-center text-gray-300 mb-8 text-base'>Select your role and enter your mobile number to continue.</p>
        <form 
        onSubmit={handleSubmit}
        className='flex flex-col gap-8'
        >
            <input 
            type="tel"
            inputMode="numeric"
            placeholder='Enter Your Mobile Number'
            maxLength={10}
            pattern="\d{10}"
            required
            className='bg-white/10 border border-white/30 rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 '
            onChange={(e)=>setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            value={phone}
            />

            {/* role component */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-5'>
                {
                    roles.map((rol)=>{
                        const isAdminBlocked=rol.value=="admin" && adminExist
                        
                        return (
                         <motion.div 
                         whileHover={!isAdminBlocked ? {scale:1.07}:{}}
                         key={rol.value}
                         onClick={()=>{
                            if(isAdminBlocked)
                            {
                                alert("⚠️ Admin already exists. You cannot select Admin role.")
                                return;

                            }
                            setRole(rol.value)
                         }}
                           className={`cursor-pointer p-6 text-center rounded-2xl border
                           transition text-lg font-medium
                           ${
                             role === rol.value
                               ? "border-blue-500 bg-blue-500/40"
                               : "border-white/20 bg-white/10 hover:bg-white/20"
                           }
                           ${isAdminBlocked && "opacity-40 cursor-not-allowed"}
                         `}>
                            <div className='flex justify-center mb-3'>{rol.icon}</div>
                            <p>{rol.value}</p>
                            {isAdminBlocked && <p className='text-xs text-red-400 mt-2'>Admin already exists</p> }
                           </motion.div>
                        )
                    })
                }                      
                                    
            </div>

            <motion.button
                disabled={loading}
                type='submit'
                className='mt-4 px-8 py-3 flex items-center justify-center gap-2  bg-blue-400 hover:bg-blue-500 rounded-xl font-medium w-full'
                whileHover={{scale:1.03}}
                whileTap={{scale:0.95}}
                >
                {loading ? <ClipLoader size={20}color='white'/>:"Submit"}
                </motion.button>
        </form>
    </motion.div>
    </AnimatePresence>
    </div>
  )
}

export default EditRoleandPhone

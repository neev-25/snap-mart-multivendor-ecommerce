'use client'
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import { FcGoogle } from 'react-icons/fc';
import { GoChevronRight } from 'react-icons/go';
import { signIn, useSession } from 'next-auth/react';

const SignIn = () => {
   const [email,setEmail]=useState("")
      const [password,setPassword]=useState("")
      const [showPassword,setShowPassword]=useState(false)
      const router=useRouter()
      const [loading,setLoading]=useState(false)
      const session=useSession()
      console.log(session.data?.user)
      const handleSignIn=async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
          const result=await signIn("credentials",{
            email,
            password,
            redirect:false
          })
          alert("SignIn Successfully")
          router.push("/")
          setLoading(false)
        } catch (error) {
          console.log(error)
          setLoading(false)
          alert(error)
        }
      }
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6'>
      <AnimatePresence>
      
      <motion.div
      className='w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20'
      initial={{opacity:0,y:40}}
      animate={{opacity:1,y:0}}
      exit={{opacity:0,y:-40}}
      transition={{duration:0.5}}
      >
        <h1 className='text-2xl font-semibold text-center mb-6 text-gray-100'>Welcome Back to <span className='text-blue-400'>SnapMart</span></h1>
        <form 
        onSubmit={handleSignIn}
        className='flex flex-col gap-4'
        >
            <input type="text" 
            required
            placeholder='Email'
            className='bg-white/10 border border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            onChange={(e)=>setEmail(e.target.value)}
            value={email}
            />
            <input 
            type={showPassword?"text":"password"}
            required
            placeholder='Password'
            className='bg-white/10 border relative border-white/30 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            onChange={(e)=>setPassword(e.target.value)}
            value={password}
            />
            <button 
            type='button'
            onClick={()=>setShowPassword(!showPassword)}
            className='absolute cursor-pointer right-12 top-45 -translate-y-1/2 text-gray-400 hover:text-white transition'>
                {showPassword?<FaEyeSlash size={18}/>:<FaEye size={18}/>}
                </button>
                <motion.button
                disabled={loading}
                type='submit'
                className='mt-4 px-8 py-3 flex items-center justify-center gap-2  bg-blue-400 hover:bg-blue-500 rounded-xl font-medium w-full'
                whileHover={{scale:1.03}}
                whileTap={{scale:0.95}}
                >
                {loading ? <ClipLoader size={20}color='white'/>:"Login"}
                </motion.button>
        <div className='flex items-center my-3'>
            <div className='flex-1 h-px bg-gray-600'></div>
            <span className='px-3 text-sm text-gray-400'>or</span>
            <div className='flex-1 h-px bg-gray-600'></div>
        </div>
                <motion.button
                onClick={()=>signIn("google",{callbackUrl:"/"})}
                className='flex items-center justify-center gap-3 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl transition'
                whileHover={{scale:1.03}}
                whileTap={{scale:0.95}}
                >
                <FcGoogle className='w-5 h-5'/>
                <span className='font-medium'>Continue with Google</span><GoChevronRight/>
                </motion.button>
                <p className='text-center text-sm mt-4 text-gray-400'>
                    No have Account {"?"} Create an Account{"."}
                    <span 
                    onClick={()=>router.push("/register")}
                    className='text-blue-400 cursor-pointer hover:underline hover:text-blue-300 transition'>
                        Register
                    </span>
                </p>
        </form>
      </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default SignIn

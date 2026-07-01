'use client'
import UseGetCurrentUser from '@/hooks/UseGetCurrentUser'
import { AppDispatch, RootState } from '@/redux/store'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { AiOutlineUser, AiOutlineMail, AiOutlineCalendar } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import userImage from '@/assets/userpng.png'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import { setUserData } from '@/redux/userSlice'

function Profile() {
    UseGetCurrentUser()
    const user = useSelector((state: RootState) => state.user.userData)
    const router=useRouter()
    const [showEditProfile,setShowEditProfile]=useState(false)
    const [showEditShop,setShowEditShop]=useState(false)
    const [previewImage,setPreviewImage]=useState(user?.image ||userImage)
    const [profileImage,setProfileImage]=useState<File|null>(null)
    const [name,setName]=useState(user?.name || " ")
    const [phone,setPhone]=useState(user?.phone || "")
    const [shopName,setShopName]=useState(user?.shopName||"")
    const [shopAddress,setShopAddress]=useState(user?.shopAddress||"")
    const [gstNumber,setGSTNumber]=useState(user?.gstNumber||"")
    const [loading,setLoading]=useState(false)
    const dispatch=useDispatch<AppDispatch>()

    useEffect(() => {
        if (!user) return
        setName(user.name || '')
        setPhone(user.phone || '')
        setShopName(user.shopName || '')
        setShopAddress(user.shopAddress || '')
        setGSTNumber(user.gstNumber || '')
        if (user.image) setPreviewImage(user.image)
    }, [user])
    
    const handlePreviewImage=(e:React.ChangeEvent<HTMLInputElement>)=>{
        const file=e.target?.files?.[0]
        if(!file)
            return
        setProfileImage(file)
        setPreviewImage(URL.createObjectURL(file))
    }

    const handleUpdateProfile=async () => {
        const formData=new FormData()
        formData.append("name",name)
        formData.append("phone",phone)
        if(profileImage)
        {
            formData.append("image",profileImage)
        }
        setLoading(true)

        try {
            const result=await axios.post("/api/user/update-profile",formData)
            dispatch(setUserData(result.data))
            console.log(result)
            setLoading(false)
            setProfileImage(null)
            alert("Profile updated successfully ✅")
            
        } catch (error) {
            console.log(error)
            setLoading(false)
            alert("profile update error ❌")
        }
    }



    const handleVerifyAgain=async ()=>{
        if(!shopAddress || !shopName || !gstNumber)
        {
          alert("Fill all fields")
          return;
        }
        setLoading(true)
        try {
          const result=await axios.post("/api/vendor/verifyagain",{
            shopName,
            shopAddress,
            gstNumber
          })
          console.log(result.data)
          setLoading(false)
          alert("Verification request sent again Successfully ✅")
          router.push("/")
        } catch (error) {
          console.log(error)
          setLoading(false)
          alert("Failed to send verification ❌")
        }
      }
    return (
        <div className='app-container flex justify-center'>
            <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className='glass-card-strong w-full max-w-3xl p-6 sm:p-10'
            >
                <div className='flex flex-col items-center text-center'>
                    {/* Profile Image Wrapper */}
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className='w-24 h-24 sm:w-28 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/30 hover:border-blue-400 bg-gray-700'
                    >
                       
                            <Image 
                                src={previewImage} 
                                alt='profile'
                                className='object-cover w-full h-full'
                                width={120}
                                height={120}
                                
                            />
                    
                    </motion.div>     
                    <h2 className='text-2xl sm:text-3xl font-bold mt-4'>{user?.name}</h2>
                    <p className='text-gray-300 text-sm sm:text-base'>{user?.email}</p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-1'>Role :{" "} <span className='text-blue-400 uppercase'> {user?.role}</span></p>
                </div>

                <div className='mt-5 space-y-3 text-sm sm:text-base'>
                    <p><b>Phone:</b>{user?.phone||"-"}</p>
                    {user?.role=="vendor" && (<>
                        <p><b>Shop Name:</b>{user?.shopName || "-"}</p>
                        <p><b>Shop Address:</b>{user?.shopAddress || "-"}</p>
                        <p><b>GSTIN:</b>{user?.gstNumber || "-"}</p>
                    </>
                    )}    
                </div>
                <div className='grid grid-cols-1 gap-4 mt-8'>
                    {user?.role=="user" && (
                        <motion.button
                        whileHover={{scale:1.02}}
                        onClick={()=>router.push("/orders")}
                        className='bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-semibold'
                        >
                            My Orders
                        </motion.button>
                        
                    )}
                    <motion.button
                        whileHover={{scale:1.02}}
                        onClick={()=>{setShowEditProfile(!showEditProfile);setShowEditShop(false)}}
                        className='bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold'
                        >
                            Edit Profile
                        </motion.button>

                        {user?.role=="vendor" && (
                        <motion.button
                        whileHover={{scale:1.02}}
                    onClick={()=>{setShowEditShop(!showEditShop);setShowEditProfile(false)}}
                        className='bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-semibold'
                        >
                            Edit Shop Details
                        </motion.button>
                        
                    )}
                </div>
                <AnimatePresence>
                {showEditProfile && (
                    <motion.div 
                    initial={{opacity:0,y:30}}
                    animate={{opacity:1,y:0}}
                    // transition={{duration:0.3}}
                    exit={{opacity:0,y:30}}
                    className='mt-10 bg-white/5 p-5 sm:p-6 rounded-xl border border-white/20'>
                        <h3 className='text-xl font-bold mb-5 '>Edit Profile</h3>
                        <div className='flex flex-col items-center mb-6'>
                            <motion.div 
                            whileHover={{scale:1.05}}
                            className='w-24 h-24 rounded-full overflow-hidden border border-white/30 mb-3 hover:border-blue-400 bg-gray-700'>
                            <Image src={previewImage} alt='select Image' width={120} height={120}  className='object-cover w-full h-full'/>
                            </motion.div>
                            <label className='cursor-pointer bg-blue-600 px-4 py-2 rounded-lg text-sm'>
                                Select Image
                                <input type="file" hidden accept='image/*' onChange={handlePreviewImage}/>

                            </label>
                        </div>
                        <div className='space-y-4'>
                            <input type="text" className='input-field'
                            placeholder='full Name'
                            onChange={(e)=>setName(e.target.value)}
                            value={name}
                            />
                            <input type="text" className='input-field'
                            placeholder='Phone no'
                            onChange={(e)=>setPhone(e.target.value)}
                            value={phone}

                            />
                            <motion.button
                            disabled={loading}
                        whileHover={{scale:1.02}}
                        className='btn-primary w-full py-3 font-semibold'
                        onClick={handleUpdateProfile}
                        >
                            {loading ? <ClipLoader size={20} color='white'/>:"Update Profile"}
                        </motion.button>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence> 
            <AnimatePresence>
                {showEditShop && (
                    <motion.div 
                    initial={{opacity:0,y:30}}
                    animate={{opacity:1,y:0}}
                    // transition={{duration:0.3}}
                    exit={{opacity:0,y:30}}
                    className='mt-10 bg-white/5 p-5 sm:p-6 rounded-xl border border-white/20'>
                        <h3 className='text-xl font-bold mb-5 p-8'>Edit Shop Details</h3>
                        <div className='space-y-4'>
                            <input type="text" className='input-field'
                            placeholder='Shop Name'
                            onChange={(e)=>setShopName(e.target.value)}
                            value={shopName}
                            />
                            <input type="text" className='input-field'
                            placeholder='Shop Address'
                            onChange={(e)=>setShopAddress(e.target.value)}
                            value={shopAddress}

                            />
                            <input type="text" className='input-field'
                            placeholder='GSTIN'
                            onChange={(e)=>setGSTNumber(e.target.value)}
                            value={gstNumber}

                            />
                            <motion.button
                        whileHover={{scale:1.02}}
                        className='btn-primary w-full py-3 font-semibold'
                        onClick={handleVerifyAgain}
                        disabled={loading}
                        >
                            {loading ? <ClipLoader size={20}/>:"Update Shop Details"}
                        </motion.button>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
            </motion.div>
            
        </div>
    )
}

export default Profile
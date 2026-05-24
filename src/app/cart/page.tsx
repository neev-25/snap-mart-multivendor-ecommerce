// 'use client'
// import axios from 'axios'
// import Image from 'next/image'
// import { useRouter } from 'next/navigation'
// import React, { useEffect, useState } from 'react'

// function Page() {
//     const [cart,setCart]=useState<any[]>([])
//     const router=useRouter()
//     const getCart=async ()=>{
//             try {
//                 const result=await axios.get("/api/user/cart/get")
//                 setCart(result.data.cart || [])
//             } catch (error) {
//                 console.log(error)
//                 alert("failed to get cart")
//             }
//         }
//     useEffect(()=>{
//         getCart()
//     },[])

//     const handleUpdateCart=async (productId:string,quantity:number) => {
//         try {
//             const result=await axios.post("/api/user/cart/update",{
//                 productId,
//                 quantity
//             });
//             getCart()
//         } catch (error) {
//             console.log(error)
//             alert("failed to update quantity")
//         }
//     }

//     const handleRemove=async (productId:string) => {
//         setCart((prev)=>prev.filter((i)=>i.product._id!==productId))
//         await axios.post("/api/user/cart/remove",{productId})
//     }


//     if(cart.length==0)
//     {
//         return <div className='text-4xl min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6'>Cart Empty</div>;
//     }
//   return (
//     <div className='min-h-screen bg-gradient-to-br from-gray-900 text-4xl via-black to-gray-900 text-white p-6'>
//       <div className='max-w-5xl mx-auto space-y-4'>
//         {cart.map((item,index)=>(
//             <div key={index} className='bg-white/10 p-4 rounded-lg flex gap-4 flex-col md:flex-row'>
//                 <Image
//                 alt={item.product.title}
//                 src={item.product.image1}
//                 width={100}
//                 height={100}
//                 />
//                 <div className='flex-1'>
//                     <h3 className='font-bold'>{item.product.title}</h3>
//                     <p className='text-green-500'>₹ {item.product.price}</p>
//                     <div className='flex gap-2 mt-2'>

//                         <button 
//                         onClick={()=>handleUpdateCart(item.product._id,item.quantity-1)}
//                         className='border rounded border-gray-600 px-2'>
//                             -
//                         </button>
//                         <span>{item.quantity}</span>
//                         <button 
//                         onClick={()=>handleUpdateCart(item.product._id,item.quantity+1)}
//                         className='border rounded border-gray-600 px-2'>
//                             +
//                         </button>
//                     </div>
//                     <div className='w-full flex md:flex-row gap-2 md:gap-4 items-start md:items-center justify-start '>
//                     <button 
//                     onClick={()=>router.push(`/checkout/${item.product._id}`)}
//                     className='mt-3 text-nowrap bg-blue-600 px-4 py-2 rounded'>
//                         CheckOut this product
//                     </button>
//                    <button 
//                    onClick={()=>handleRemove(item.product._id)}
//                    className='mt-3 bg-red-200 text-red-600 px-4 py-2 rounded'>
//                         Remove
//                     </button>
//                     </div>
//                 </div>
                 
//                     <div className='font-bold'>₹ {item.product.price * item.product.quantity}</div>
//             </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default Page
'use client'
import axios from 'axios'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

function Page() {
    const [cart, setCart] = useState<any[]>([])
    const router = useRouter()

    const getCart = async () => {
        try {
            const result = await axios.get("/api/user/cart/get")
            setCart(result.data.cart || [])
        } catch (error) {
            console.log(error)
            alert("failed to get cart")
        }
    }

    useEffect(() => {
        getCart()
    }, [])

    const handleUpdateCart = async (productId: string, quantity: number) => {
        if (quantity < 1) return
        try {
            await axios.post("/api/user/cart/update", {
                productId,
                quantity
            })
            getCart()
        } catch (error) {
            console.log(error)
            alert("failed to update quantity")
        }
    }

    const handleRemove = async (productId: string) => {
        try {
            setCart((prev) => prev.filter((i) => i.product._id !== productId))
            await axios.post("/api/user/cart/remove", { productId })
        } catch (error) {
            console.log(error)
            alert("failed to remove item")
        }
    }

    if (cart.length === 0) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6'>
                <h1 className='text-2xl sm:text-3xl font-bold'>Cart Empty</h1>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4 py-8 sm:px-6'>
            <div className='max-w-5xl mx-auto'>
                <h1 className='text-2xl sm:text-3xl font-bold mb-6'>My Cart</h1>

                <div className='space-y-5'>
                    {cart.map((item, index) => (
                        <div
                            key={index}
                            className='bg-white/10 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:gap-6 shadow-lg backdrop-blur-md'
                        >
                            <div className='flex justify-center md:justify-start'>
                                <Image
                                    alt={item.product.title}
                                    src={item.product.image1}
                                    width={130}
                                    height={130}
                                    className='rounded-xl object-cover w-[130px] h-[130px] border border-white/10'
                                />
                            </div>

                            <div className='flex-1 flex flex-col justify-between'>
                                <div>
                                    <h3 className='text-lg sm:text-xl font-semibold text-white'>
                                        {item.product.title}
                                    </h3>
                                    <p className='text-green-400 text-base sm:text-lg font-medium mt-1'>
                                        ₹ {item.product.price}
                                    </p>

                                    <div className='flex items-center gap-3 mt-4'>
                                        <button
                                            onClick={() => handleUpdateCart(item.product._id, item.quantity - 1)}
                                            className='w-9 h-9 rounded-lg border border-gray-500 hover:bg-white/10 transition'
                                        >
                                            -
                                        </button>

                                        <span className='text-xl font-medium min-w-[24px] text-center'>
                                            {item.quantity}
                                        </span>

                                        <button
                                            onClick={() => handleUpdateCart(item.product._id, item.quantity + 1)}
                                            className='w-9 h-9 rounded-lg border border-gray-500 hover:bg-white/10 transition'
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 mt-5'>
                                    <button
                                        onClick={() => router.push(`/checkout/${item.product._id}`)}
                                        className='bg-blue-600 hover:bg-blue-700 transition px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium text-white'
                                    >
                                        Checkout this product
                                    </button>

                                    <button
                                        onClick={() => handleRemove(item.product._id)}
                                        className='bg-red-100 hover:bg-red-200 transition px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium text-red-600'
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className='md:min-w-[120px] flex md:block justify-between items-center text-base sm:text-lg font-bold text-yellow-400'>
                                <span className='md:hidden'>Total:</span>
                                <span>₹ {item.product.price * item.quantity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Page
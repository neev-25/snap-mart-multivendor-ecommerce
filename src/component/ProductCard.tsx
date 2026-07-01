'use client'



import { IProduct } from '@/model/product.model'

import { AppDispatch, RootState } from '@/redux/store'

import { addWishlistItem, removeWishlistItem, setWishlistIds } from '@/redux/userSlice'

import axios from 'axios'

import { motion } from 'motion/react'

import Image from 'next/image'

import { useRouter } from 'next/navigation'

import React, { useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useSession } from 'next-auth/react'

import { useActionLock } from '@/hooks/useActionLock'

import { showToast } from '@/component/ui/ToastProvider'

import { ClipLoader } from 'react-spinners'

import {

  FaChevronLeft,

  FaChevronRight,

  FaHeart,

  FaRegHeart,

  FaRegStar,

  FaShoppingCart,

  FaStar,

} from 'react-icons/fa'



function ProductCard({ product }: { product: IProduct }) {

  const images = [product.image1, product.image2, product.image3, product.image4].filter(Boolean)

  const [current, setCurrent] = useState(0)

  const dispatch = useDispatch<AppDispatch>()

  const userData = useSelector((state: RootState) => state.user.userData)

  const wishlistIds = useSelector((state: RootState) => state.user.wishlistIds)

  const inWishlist = wishlistIds.includes(String(product._id))

  const canUseWishlist = userData?.role === 'user'

  const router = useRouter()

  const { status } = useSession()

  const { busy: addingToCart, run: runAddToCart } = useActionLock()

  const totalReviews: number = product?.reviews?.length ?? 0

  const avgRating =

    product && totalReviews > 0

      ? Number(

          (product.reviews!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews).toFixed(1)

        )

      : 0



  const handleAddtoCart = async (e: React.MouseEvent) => {

    e.stopPropagation()

    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/viewProduct/${product._id}`)}`)
      return
    }

    await runAddToCart(async () => {

      try {

        await axios.post('/api/user/cart/add', {

          productId: product._id,

          quantity: 1,

        })

        showToast('Added to cart')

        router.push('/cart')

      } catch (error: unknown) {

        const err = error as { response?: { data?: { message?: string } } }

        showToast(err?.response?.data?.message || 'Could not add to cart', 'error')

        throw error

      }

    })

  }



  const toggleWishlist = async (e: React.MouseEvent) => {

    e.stopPropagation()

    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/viewProduct/${product._id}`)}`)
      return
    }

    if (!canUseWishlist) {

      showToast('Wishlist is available for customer accounts only', 'error')

      return

    }

    const productId = String(product._id)

    try {

      if (inWishlist) {

        const res = await axios.post('/api/user/wishlist/remove', { productId })

        dispatch(removeWishlistItem(productId))

        if (res.data.wishlistIds) dispatch(setWishlistIds(res.data.wishlistIds))

      } else {

        const res = await axios.post('/api/user/wishlist/add', { productId })

        dispatch(addWishlistItem(res.data.product || product))

        if (res.data.wishlistIds) dispatch(setWishlistIds(res.data.wishlistIds))

      }

    } catch (error: unknown) {

      const err = error as { response?: { data?: { message?: string }; status?: number } }

      if (err?.response?.status === 401) {

        router.push(`/login?callbackUrl=${encodeURIComponent(`/viewProduct/${product._id}`)}`)

      } else {

        showToast(err?.response?.data?.message || 'Could not update wishlist', 'error')

      }

    }

  }



  if (!product?._id || !images.length) {

    return null

  }



  return (

    <motion.article

      onClick={() => router.push(`/viewProduct/${product._id}`)}

      initial={{ opacity: 0, y: 20 }}

      whileInView={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.35 }}

      viewport={{ once: true, amount: 0.1 }}

      whileHover={{ y: -4 }}

      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:shadow-xl"

    >

      <div className="relative aspect-square w-full overflow-hidden bg-gray-50">

        <button

          type="button"

          onClick={toggleWishlist}

          className="absolute right-2 top-2 z-20 rounded-full bg-white/95 p-2 text-red-500 shadow-md transition hover:scale-110"

          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}

        >

          {inWishlist ? <FaHeart size={14} /> : <FaRegHeart size={14} />}

        </button>

        <div className="relative h-full w-full p-3">

          <Image

            src={images[current]}

            alt={product.title}

            fill

            className="object-contain transition duration-300 group-hover:scale-105"

            sizes="(max-width:640px) 50vw, 25vw"

          />

        </div>

        {images.length > 1 && (

          <>

            <button

              type="button"

              onClick={(e) => {

                e.stopPropagation()

                setCurrent((prev) => (prev - 1 + images.length) % images.length)

              }}

              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100"

            >

              <FaChevronLeft size={12} />

            </button>

            <button

              type="button"

              onClick={(e) => {

                e.stopPropagation()

                setCurrent((prev) => (prev + 1) % images.length)

              }}

              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition group-hover:opacity-100"

            >

              <FaChevronRight size={12} />

            </button>

            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">

              {images.map((_, i) => (

                <span

                  key={i}

                  className={`h-1.5 w-1.5 rounded-full ${current === i ? 'bg-gray-800' : 'bg-gray-400'}`}

                />

              ))}

            </div>

          </>

        )}

      </div>



      <div className="flex flex-1 flex-col p-3 sm:p-4">

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{product.title}</h3>

        <p className="mt-1 truncate text-xs text-gray-500">{product.category}</p>

        <p className="mt-2 text-lg font-bold text-emerald-600">₹{product.price}</p>

        <div className="mt-1 flex items-center gap-0.5 text-amber-500">

          {[1, 2, 3, 4, 5].map((i) =>

            i <= Math.round(Number(avgRating)) ? (

              <FaStar key={i} size={11} />

            ) : (

              <FaRegStar key={i} size={11} />

            )

          )}

          <span className="ml-1 text-xs text-gray-400">

            {avgRating} ({totalReviews})

          </span>

        </div>

        <p className="mt-1 truncate text-[11px] text-gray-400">

          {typeof product.vendor === 'object' ? product.vendor?.shopName : ''}

        </p>

        <motion.button

          type="button"

          onClick={handleAddtoCart}

          disabled={addingToCart}

          whileTap={addingToCart ? undefined : { scale: 0.97 }}

          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"

        >

          {addingToCart ? (
            <ClipLoader size={14} color="white" />
          ) : (
            <>
              <FaShoppingCart size={13} /> Add to Cart
            </>
          )}

        </motion.button>

      </div>

    </motion.article>

  )

}



export default ProductCard


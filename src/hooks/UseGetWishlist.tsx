'use client'

import { AppDispatch, RootState } from '@/redux/store'
import { setWishlistData } from '@/redux/userSlice'
import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function UseGetWishlist() {
  const dispatch = useDispatch<AppDispatch>()
  const userData = useSelector((state: RootState) => state.user.userData)

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!userData?._id) {
        return
      }

      if (userData.role && userData.role !== 'user') {
        dispatch(setWishlistData({ products: [], ids: [] }))
        return
      }

      try {
        const result = await axios.get('/api/user/wishlist/get')
        dispatch(
          setWishlistData({
            products: result.data.wishlist || [],
            ids: result.data.wishlistIds || [],
          })
        )
      } catch {
        dispatch(setWishlistData({ products: [], ids: [] }))
      }
    }

    fetchWishlist()
  }, [dispatch, userData?._id, userData?.role])
}

export default UseGetWishlist

'use client'
import { AppDispatch } from '@/redux/store'
import { setUserData } from '@/redux/userSlice'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

function UseGetCurrentUser() {
  const dispatch = useDispatch<AppDispatch>()
  const { status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (status !== 'authenticated') {
      dispatch(setUserData(null))
      return
    }

    const fetchUser = async () => {
      try {
        const result = await axios.get('/api/user/currentUser')
        dispatch(setUserData(result.data))
      } catch (error) {
        console.log(error)
        dispatch(setUserData(null))
      }
    }

    fetchUser()
  }, [status, dispatch])
}

export default UseGetCurrentUser

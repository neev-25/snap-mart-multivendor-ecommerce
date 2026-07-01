'use client'

import Footer from '@/component/Footer'
import Navbar from '@/component/Navbar'
import { RootState } from '@/redux/store'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import React from 'react'
import { useSelector } from 'react-redux'

const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

function isOnboarding(user: RootState['user']['userData']) {
  if (!user) return false
  if (!user.phone) return true
  if (
    user.role === 'vendor' &&
    (!user.shopName || !user.shopAddress || !user.gstNumber)
  ) {
    return true
  }
  return false
}

function isPanelHome(
  pathname: string,
  user: RootState['user']['userData'],
  sessionRole?: string
) {
  const role = user?.role ?? sessionRole
  return pathname === '/' && (role === 'vendor' || role === 'admin')
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const userData = useSelector((state: RootState) => state.user.userData)
  const { status, data: session } = useSession()

  const hideShell =
    AUTH_ONLY_PATHS.includes(pathname) ||
    (pathname === '/' && status !== 'loading' && isOnboarding(userData))

  if (hideShell) {
    return <>{children}</>
  }

  const panelHome = isPanelHome(pathname, userData, session?.user?.role)

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <Navbar user={userData} />
      <main className={panelHome ? 'app-main flex flex-col' : 'app-main'}>{children}</main>
      {userData && !panelHome && <Footer user={userData} />}
    </div>
  )
}

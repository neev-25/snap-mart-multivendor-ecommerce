'use client'

import { IUser } from '@/model/user.model'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import logo from '@/assets/logo.png'
import {
  AiOutlineSearch,
  AiOutlineUser,
  AiOutlineShoppingCart,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineHome,
  AiOutlineAppstore,
  AiOutlinePhone,
  AiOutlineShop,
  AiOutlineLogin,
  AiOutlineLogout,
} from 'react-icons/ai'
import { GoListUnordered } from 'react-icons/go'
import { AiOutlineHeart } from 'react-icons/ai'
import { AnimatePresence, motion } from 'motion/react'
import { signOut } from 'next-auth/react'

function Navbar({ user }: { user: IUser | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isGuest = !user?._id
  const isCustomer = user?.role === 'user'

  const browseLinks = [
    { label: 'Home', path: '/', icon: AiOutlineHome },
    { label: 'Categories', path: '/category', icon: AiOutlineAppstore },
    { label: 'Shop', path: '/shop', icon: AiOutlineShop },
  ]

  const customerLinks = [
    ...browseLinks,
    { label: 'Orders', path: '/orders', icon: GoListUnordered },
    { label: 'Wishlist', path: '/wishlist', icon: AiOutlineHeart },
  ]

  const navLinks = isGuest ? browseLinks : isCustomer ? customerLinks : browseLinks

  const goLogin = (target?: string) => {
    const url = target
      ? `/login?callbackUrl=${encodeURIComponent(target)}`
      : '/login'
    router.push(url)
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          className="flex items-center gap-2.5"
          onClick={() => router.push('/')}
        >
          <Image src={logo} width={36} height={36} alt="SnapMart" className="rounded-full" />
          <span className="hidden text-lg font-bold tracking-tight text-white sm:inline">
            SnapMart
          </span>
        </button>

        {(isGuest || isCustomer) && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavItem
                key={link.path}
                label={link.label}
                path={link.path}
                active={pathname === link.path}
                onClick={() => router.push(link.path)}
              />
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {(isGuest || isCustomer) && (
            <IconBtn Icon={AiOutlineSearch} onClick={() => router.push('/category')} label="Search" />
          )}
          {!isGuest && (
            <IconBtn Icon={AiOutlinePhone} onClick={() => router.push('/support')} label="Support" />
          )}

          {isGuest ? (
            <>
              <button type="button" onClick={() => goLogin()} className="btn-secondary px-4 py-2 text-sm">
                Sign in
              </button>
              <button type="button" onClick={() => router.push('/register')} className="btn-primary px-4 py-2 text-sm">
                Register
              </button>
            </>
          ) : (
            <div className="relative ml-1">
              {user?.image ? (
                <button type="button" onClick={() => setOpenMenu(!openMenu)} className="rounded-full ring-2 ring-white/10">
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                </button>
              ) : (
                <IconBtn Icon={AiOutlineUser} onClick={() => setOpenMenu(!openMenu)} label="Account" />
              )}
              <AnimatePresence>
                {openMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#14141f] shadow-xl"
                  >
                    <DropDownBtn
                      Icon={AiOutlineUser}
                      label="Profile"
                      onClick={() => {
                        router.push('/profile')
                        setOpenMenu(false)
                      }}
                    />
                    <DropDownBtn
                      Icon={AiOutlineLogin}
                      label="Sign In"
                      onClick={() => {
                        goLogin()
                        setOpenMenu(false)
                      }}
                    />
                    <DropDownBtn
                      Icon={AiOutlineLogout}
                      label="Sign Out"
                      onClick={() => {
                        signOut()
                        setOpenMenu(false)
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {isCustomer && <CartBtn router={router} count={user?.cart?.length ?? 0} />}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          {isGuest ? (
            <button type="button" onClick={() => goLogin()} className="text-sm font-medium text-blue-400">
              Sign in
            </button>
          ) : (
            <IconBtn Icon={AiOutlinePhone} onClick={() => router.push('/support')} label="Support" />
          )}
          {isCustomer && <CartBtn router={router} count={user?.cart?.length ?? 0} />}
          {(isGuest || isCustomer) && (
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <AiOutlineMenu size={26} className="text-white" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (isGuest || isCustomer) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed top-0 right-0 z-50 flex h-full w-[min(85vw,320px)] flex-col border-l border-white/10 bg-[#0f0f16] p-5 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-semibold">Menu</span>
                <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <AiOutlineClose size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <SideBarBtn
                    key={link.path}
                    label={link.label}
                    Icon={link.icon}
                    active={pathname === link.path}
                    onClick={() => {
                      router.push(link.path)
                      setSidebarOpen(false)
                    }}
                  />
                ))}
                {isGuest ? (
                  <>
                    <SideBarBtn
                      label="Sign in"
                      Icon={AiOutlineLogin}
                      onClick={() => {
                        goLogin()
                        setSidebarOpen(false)
                      }}
                    />
                    <SideBarBtn
                      label="Register"
                      Icon={AiOutlineUser}
                      onClick={() => {
                        router.push('/register')
                        setSidebarOpen(false)
                      }}
                    />
                  </>
                ) : (
                  <>
                    <SideBarBtn
                      label="Profile"
                      Icon={AiOutlineUser}
                      active={pathname === '/profile'}
                      onClick={() => {
                        router.push('/profile')
                        setSidebarOpen(false)
                      }}
                    />
                    <SideBarBtn
                      label="Sign In"
                      Icon={AiOutlineLogin}
                      onClick={() => {
                        goLogin()
                        setSidebarOpen(false)
                      }}
                    />
                    <SideBarBtnforSignOut
                      label="Sign Out"
                      Icon={AiOutlineLogout}
                      onClick={() => {
                        signOut()
                        setSidebarOpen(false)
                      }}
                    />
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar

function NavItem({
  label,
  path,
  active,
  onClick,
}: {
  label: string
  path: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function IconBtn({
  Icon,
  onClick,
  label,
}: {
  Icon: React.ComponentType<{ size?: number }>
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg p-2 text-gray-300 transition hover:bg-white/5 hover:text-white"
    >
      <Icon size={22} />
    </button>
  )
}

function DropDownBtn({
  Icon,
  label,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/5"
      onClick={onClick}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function CartBtn({ router, count }: { router: ReturnType<typeof useRouter>; count?: number }) {
  return (
    <button
      type="button"
      onClick={() => router.push('/cart')}
      className="relative rounded-lg p-2 text-gray-300 transition hover:bg-white/5 hover:text-white"
      aria-label="Cart"
    >
      <AiOutlineShoppingCart size={22} />
      {(count ?? 0) > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  )
}

function SideBarBtn({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string
  Icon: React.ComponentType<{ size?: number }>
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
        active ? 'bg-blue-600/20 text-blue-300' : 'bg-white/5 text-gray-200 hover:bg-white/10'
      }`}
      onClick={onClick}
    >
      <Icon size={18} />
      {label}
    </button>
  )
}

function SideBarBtnforSignOut({
  label,
  Icon,
  onClick,
}: {
  label: string
  Icon: React.ComponentType<{ size?: number }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="mt-2 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-sm font-medium text-red-300"
      onClick={onClick}
    >
      <Icon size={18} />
      {label}
    </button>
  )
}

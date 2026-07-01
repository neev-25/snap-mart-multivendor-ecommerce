'use client'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import axios from 'axios'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import PageHeader from '@/component/ui/PageHeader'

interface Message {
  sender: string
  text: string
  createdAt: string
}

function SupportChats() {
  const { userData } = useSelector((state: RootState) => state.user)
  const myId = String(userData?._id)
  const [users, setUsers] = useState<IUser[]>()
  const [activeUser, setActiveUser] = useState<IUser>()
  const [text, setText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        const result = await axios.get('/api/support/active-users')
        setUsers(result.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchChatUsers()
  }, [])

  useEffect(() => {
    if (!activeUser?._id) return

    const fetchChatMessages = async () => {
      try {
        const result = await axios.post('/api/support/get', { withUserId: activeUser._id })
        setMessages(result.data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchChatMessages()
    const interval = setInterval(fetchChatMessages, 5000)
    return () => clearInterval(interval)
  }, [activeUser])

  const sendMessage = async () => {
    if (!text.trim() || !activeUser) return
    try {
      await axios.post('/api/support/send', { receiverId: activeUser._id, text })
      setMessages((prev) => [
        ...prev,
        { sender: myId, text, createdAt: new Date().toISOString() },
      ])
      setText('')
    } catch (error) {
      console.log(error)
    }
  }

  if (!myId) {
    return (
      <div className="app-container flex min-h-[50vh] items-center justify-center text-gray-400">
        Loading support...
      </div>
    )
  }

  return (
    <div className="app-container">
      <PageHeader title="Support" subtitle="Chat with vendors or admin support" />

      <div className="grid h-[calc(100vh-var(--nav-height)-12rem)] min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-3">
        <aside className="glass-card flex flex-col overflow-hidden p-4">
          {userData?.role !== 'admin' && (
            <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
              {userData?.role === 'user'
                ? 'Vendor replies may take 1–2 hours.'
                : 'Admin replies may take 1–2 hours.'}
            </p>
          )}

          {!users?.length ? (
            <p className="text-center text-sm text-gray-500">No active chats</p>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {users.map((u) => (
                <button
                  type="button"
                  key={String(u._id)}
                  onClick={() => setActiveUser(u)}
                  className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                    activeUser?._id === u._id
                      ? 'bg-blue-600/20 ring-1 ring-blue-500/40'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5">
                    {u.image ? (
                      <Image src={u.image} alt={u.name} width={44} height={44} className="object-cover" />
                    ) : (
                      <FaUserCircle className="h-11 w-11 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {u.role === 'admin' ? 'Admin Support' : u.shopName || u.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="glass-card flex flex-col overflow-hidden lg:col-span-2">
          {!activeUser ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              Select a conversation to start
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((msg, i) => {
                  const isMe = String(msg.sender) === myId
                  const avatarUser = isMe ? userData : activeUser
                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                          {avatarUser?.image ? (
                            <Image src={avatarUser.image} alt="" width={32} height={32} className="object-cover" />
                          ) : (
                            <FaUserCircle className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? 'rounded-br-md bg-blue-600 text-white'
                            : 'rounded-bl-md bg-white/10 text-gray-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 border-t border-white/10 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="input-field rounded-full"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0"
                  aria-label="Send message"
                >
                  <FaPaperPlane size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SupportChats

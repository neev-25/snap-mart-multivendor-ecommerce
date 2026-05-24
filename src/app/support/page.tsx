'use client'
import { IUser } from '@/model/user.model'
import { RootState } from '@/redux/store'
import axios from 'axios'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import { ClipLoader } from 'react-spinners'
interface Message{
  sender:string;
  text:string;
  createdAt:string;
}
function SupportChats() {
  const {userData}=useSelector((state:RootState)=>state.user)
  const myId=String(userData?._id)
  const [users,setUsers]=useState<IUser[]>()
  const [activeUser,setActiveUser]=useState<IUser>()
  const [text,setText]=useState("")
  const [messages,setMessages]=useState<Message[]>([])
  const [suggestions,setSuggestions]=useState<string[]>([]);
  const [loadingSuggestions,setLoadingSuggestions]=useState(false);
  if(!myId)
  {
    return(
      <div className='min-h-screen flex items-center bg-black justify-center text-white'>
        Loading support...
      </div>
    );
  }
  useEffect(()=>{
    const fetchChatUsers=async () => {
      try {
        const result=await axios.get("/api/support/active-users")
        console.log(result.data)
        setUsers(result.data)
      } catch (error) {
        console.log(error)
        // alert("failed to get active users")
      }
    }
    fetchChatUsers()
  },[])
  useEffect(()=>{
    const fetchChatMessages=async () => {
      try {
        const result=await axios.post("/api/support/get",{withUserId:activeUser?._id})
        console.log(result.data)
        setMessages(result.data)
      } catch (error) {
        console.log(error)
        // alert("failed to get messages")
      }
    }
    fetchChatMessages()
  },[activeUser])

  const sendMessage=async () => {
    if(!text.trim() || !activeUser)
      return;

    try {
      await axios.post("/api/support/send",{receiverId:activeUser._id,text})
      setMessages((prev)=>[
        ...prev,
        {
          sender:myId,
          text,
          createdAt:new Date().toISOString(),
        }
      ])
      setText("")
    } catch (error) {
      console.log(error)
    }
  }

  const getSuggestions=async ()=>{
    if(!messages.length || !activeUser || !userData?.role)
      return;

    const lastMessage=messages[messages.length-1];

    setLoadingSuggestions(true);
    try {
      const result=await axios.post("/api/support/aiSuggestions",{
        message:lastMessage.text,
        role:userData.role,
        targetRole:activeUser.role,
    })
    console.log(result.data.suggestions)
    setSuggestions(result.data.suggestions)
        setLoadingSuggestions(false);


    } catch (error) {
      console.log(error) 
          setLoadingSuggestions(false);

    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 p-3 sm:p-6'>
      <div className='max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 h-[90vh]'>
        <div className='bg-black/50 border border-white/10 rounded-2xl p-4 overflow-y-auto '>
        <h2 className='text-white font-semibold mb-4 text-lg'>Support Chats</h2>
        
        {userData?.role!=="admin" && <p className='text-xs text-yellow-600 mt-1 leading-relaxed mb-5'>
          {userData?.role==="user" && (
            <>
            Note: The vendors response may take 1-2 hours.
            In some cases, you may receive a replay sooner.
            </>
          )}
          {userData?.role==="vendor" && (
            <>
            Note: The admins response may take 1-2 hours.
            In some cases, you may receive a reply sooner.
            </>
          )}
        </p>}
        {
          users?.length===0?(
            <p className='text-gray-400 text-sm text-center'>
              No Active User Found
            </p>
          ):(
            <div className='space-y-3'>
              {users?.map((u,i)=>(
                <div key={i}
                onClick={()=>setActiveUser(u)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                  ${
                    activeUser?._id===u._id
                    ?"bg-blue-600/20 border border-blue-500/40 shadow-lg"
                    :"hover:bg-white/5 border border-gray-100/50"
                  }`}
                >
                  <div className='w-12 h-12 rounded-full overflow-hidden border border-white/20 flex items-center justify-center'>
                  {u.image ? (
                    <Image
                    src={u.image}
                    alt={u.name}
                    width={48}
                    height={48}
                    className='object-cover'
                    />
                  ):
                  (
                    <FaUserCircle className='text-gray-400 w-12 h-12'/>
                  )}
                  </div>
                  <div
                  className='min-w-0 flex-1'
                  >
                    <p className='text-white text-sm font-medium truncate'>
                      {u.name}
                    </p>
                    <p className='text-xs text-gray-400 truncate'>
                      {u.role==="admin"
                      ?"Admin Support"
                      : u.shopName||u.role
                      }
                    </p>

                  </div>
                </div>
              ))}
            </div>
          )
        }
        </div>

        <div className='md:col-span-2 bg-black/50 border border-white/10 rounded-2xl flex flex-col overflow-hidden'>
        {!activeUser ?
      (
        <div className='flex-1 flex items-center justify-center text-gray-400'>
          Select a chat to start conversation
        </div>
      )  
      :
      (
        <>
        <div className='flex-1 p-4 space-y-4 overflow-y-auto'>
          {messages.map((msg,i)=>{
            const isMe=msg.sender===myId;
            const avatarUser=isMe?userData:activeUser;
            return (
              <div
              key={i}
              className={`flex items-center gap-3 ${
                isMe?"justify-end":"justify-start"
              }`}
              >
                {!isMe && (
                  <div className='w-9 h-9 rounded-full overflow-hidden border-white/20'>
                    {avatarUser?.image ? (
                      <Image
                      src={avatarUser.image}
                      alt='user'
                      width={36}
                      height={36}
                      className='object-cover'
                      />
                    ):(
                      <FaUserCircle className='text-gray-400 w-9 h-9'/>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] px-4 py-2.5 text-sm rounded-2xl ${
                  isMe
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white/10 text-gray-200 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
                {isMe && (
                  <div className='w-9 h-9 rounded-full overflow-hidden border-white/20'>
                    {avatarUser?.image ? (
                      <Image
                      src={avatarUser.image}
                      alt='me'
                      width={36}
                      height={36}
                      className='object-cover'
                      />
                    ):(
                      <FaUserCircle className='text-gray-400 w-9 h-9'/>
                    )}
                  </div>
                )}
              </div>
            );
          })

          }
        </div>
        <div className='px-4 pb-2'>
          <button
          onClick={getSuggestions}
          disabled={loadingSuggestions}
          className='text-xs px-4 py-1.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 disabled:opacity-50 transition z-50'
          >
            {loadingSuggestions ? <ClipLoader size={20} color='white'/>: "Get AI Suggestions"}
          </button>
        </div>

        {suggestions.length >0 && 
        <div className='px-4 pb-2 flex gap-2 flex-wrap'>
          {suggestions.map((s,i)=>(
            <div 
            onClick={()=>setText(s)}
            key={i} className='text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition '>{s}</div>
          ))}

        </div>
        }        



        <div className='p-3 border-t border-white/10 bg-black/60 flex gap-2'>
        <input value={text}
        onChange={(e)=>setText(e.target.value)}
        placeholder='Type your message...'
        className='flex-1 bg-black/80 text-white border border-white/20 rounded-full px-5 py-2.5 outline-none focus:border-blue-500'
        />
        <button
        onClick={sendMessage}
        className='bg-blue-600 hover:bg-blue-700 w-11 h-11 rounded-full flex items-center justify-center'
        >
          <FaPaperPlane className='text-white text-sm'/>.
        </button>
        </div>
        </>
      )
      }

        </div>

        </div>
    </div>
  )
}

export default SupportChats

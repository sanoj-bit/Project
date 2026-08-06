import React, { useEffect } from 'react'
import Navbar from '../../components/hotelOwner/Navbar'
import Sidebar from '../../components/hotelOwner/Sidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const {isOwner, isOwnerLoading, navigate} = useAppContext()

  useEffect(()=>{
  // Wait until the owner-status check has actually finished before
  // deciding to redirect - otherwise this fires on the default `false`
  // value while fetchUser() is still loading, kicking owners back to
  // home before their real role comes back from the server.
  if(!isOwnerLoading && !isOwner){
    navigate('/')
  }
},[isOwner, isOwnerLoading])

  return (
    <div className='flex flex-col h-screen'>
      <Navbar/>
      <div className='flex h-full'>
    <Sidebar />
    <div className='flex-1 p-4 pt-10 md:px-10 h-full'>
    <Outlet />
    </div>
</div>

    </div>
  )
}

export default Layout
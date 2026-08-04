import React, { useState, useEffect } from 'react'
import Title from '../../components/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const ListRoom = () => {

    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)

    const {axios, getToken, user, currency, navigate} = useAppContext()

    // Fetch Rooms of the Hotel Owner
    const fetchRooms = async ()=>{
      try {
           const { data } = await axios.get('/api/rooms/owner', {headers: {Authorization: `Bearer ${await getToken()}`}})
           if (data.success){
                setRooms(data.rooms)
           }else{
                toast.error(data.message)
           }
      } catch (error) {
           toast.error(error.message)
      } finally {
           setLoading(false)
      }
    }

    // Toggle room availability
    const toggleAvailability = async (roomId) => {
      try {
        const { data } = await axios.post('/api/rooms/toggle-availability', { roomId }, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        });

        if (data.success) {
          toast.success(data.message);
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room._id === roomId ? { ...room, isAvailable: !room.isAvailable } : room
            )
          );
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }

    // Delete a room
    const deleteRoom = async (roomId) => {
      const confirmed = window.confirm("Are you sure you want to delete this room? This cannot be undone.");
      if (!confirmed) return;

      try {
        const { data } = await axios.post('/api/rooms/delete', { roomId }, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        });

        if (data.success) {
          toast.success(data.message);
          setRooms((prevRooms) => prevRooms.filter((room) => room._id !== roomId));
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message);
      }
    }
  
    useEffect(()=>{
      if(user){
        fetchRooms()
      }
    },[user])

  return (
    <div>
      <Title align='left' font='outfit' title='Room Listings' subTitle='View, edit, or manage all listed rooms. Keep the information up-to-date to provide the best experience for users.'/>
     <p className='text-gray-500 mt-8'>All Rooms</p>

    {loading ? (
      <div className='flex items-center gap-2 text-gray-500 mt-6'>
        <div className='w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin'></div>
        Loading rooms...
      </div>
    ) : rooms.length === 0 ? (
      <p className='text-gray-500 mt-6'>You haven't listed any rooms yet. Head to "Add Room" to get started.</p>
    ) : (
    <div className='w-full max-w-4xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll mt-3'>
     <table className='w-full'>
      <thead className='bg-gray-50'>
        <tr>
        <th className='py-3 px-4 text-gray-800 font-medium'>Name</th>
        <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Facility</th>
        <th className='py-3 px-4 text-gray-800 font-medium'>Price / night</th>
        <th className='py-3 px-4 text-gray-800 font-medium text-center'>Available</th>
        <th className='py-3 px-4 text-gray-800 font-medium text-center'>Edit</th>
        <th className='py-3 px-4 text-gray-800 font-medium text-center'>Delete</th>
       </tr>
    </thead>
    <tbody className='text-sm'>
   {
    rooms.map((item, index)=>(
  <tr key={index}>
    <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
       {item.roomType}
    </td>
    <td className='py-3 px-4 text-gray-700 border-t border-gray-300 max-sm:hidden'>
       {item.amenities.join(', ')}
    </td>
    <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
       {currency}{item.pricePerNight}
    </td>
    <td className='py-3 px-4 border-t border-gray-300 text-sm text-red-500 text-center'>
  <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
    <input type="checkbox" className='sr-only peer' checked={item.isAvailable} onChange={() => toggleAvailability(item._id)}/>
    <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
    <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
  </label>
</td>
    <td className='py-3 px-4 border-t border-gray-300 text-center'>
      <button
        onClick={() => navigate(`/owner/edit-room/${item._id}`)}
        className='text-blue-500 hover:text-blue-700 text-xs font-medium border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-50 transition-all cursor-pointer'
      >
        Edit
      </button>
    </td>
    <td className='py-3 px-4 border-t border-gray-300 text-center'>
      <button
        onClick={() => deleteRoom(item._id)}
        className='text-red-500 hover:text-red-700 text-xs font-medium border border-red-300 rounded px-3 py-1.5 hover:bg-red-50 transition-all cursor-pointer'
      >
        Delete
      </button>
    </td>
  </tr>
))
}
</tbody>

  </table>
</div>
    )}

    </div>
  )
}

export default ListRoom
import React, { useState, useEffect } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBookings = () => {

    const { axios, getToken, user, currency } = useAppContext()
    const [bookings, setBookings] = useState([])

    const fetchUserBookings = async ()=>{
    try {
    const { data } = await axios.get('/api/bookings/user', {headers: {
      Authorization: `Bearer ${await getToken()}` }})
    if (data.success){
      // Only show bookings for rooms that still exist
      const validBookings = data.bookings.filter(booking => booking.room && booking.hotel);
      setBookings(validBookings)
    }else{
      toast.error(data.message)
    }
  } catch (error) {
    toast.error(error.message)
  }
}

    const payWithEsewa = async (bookingId) => {
      try {
        const { data } = await axios.post('/api/payments/esewa/initiate', { bookingId }, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        });

        if (!data.success) {
          toast.error(data.message);
          return;
        }

        // Open a new tab and auto-submit the eSewa form there
        const paymentWindow = window.open('', '_blank');
        const form = paymentWindow.document.createElement('form');
        form.method = 'POST';
        form.action = data.formUrl;

        Object.entries(data.paymentData).forEach(([key, value]) => {
          const input = paymentWindow.document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        paymentWindow.document.body.appendChild(form);
        form.submit();
      } catch (error) {
        toast.error(error.message);
      }
    }

    const cancelBooking = async (bookingId) => {
      try {
        const { data } = await axios.post('/api/bookings/cancel', { bookingId }, {
          headers: { Authorization: `Bearer ${await getToken()}` }
        });
        if (data.success) {
          toast.success(data.message)
          fetchUserBookings()
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error(error.message)
      }
    }

    useEffect(()=>{
        if(user){
            fetchUserBookings()
        }
    },[user])

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

  <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place.
   Plan your trips seamlessly with just a few clicks' align='left' />

  <div className='max-w-6xl mt-8 w-full text-gray-800'>

    <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
        <div className="w-1/3">Hotels</div>
        <div className="w-1/3">Date & Timings</div>
        <div className="w-1/3">Payment</div>
    </div>

     {bookings.map((booking)=>(
    <div key={booking._id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>
        {/* ------ Hotel Details ---- */}
        <div className='flex flex-col md:flex-row'>
            <img src={booking.room.images[0]} alt="hotel-img" 
            className='min-md:w-44 rounded shadow object-cover'/>
            <div className='flex flex-col gap-1.5 max-md:mt-3 min-md:ml-4'>
                <p className='font-playfair text-2xl'>{booking.hotel?.name || 'Hotel no longer available'}
                     <span className="font-inter text-sm"> ({booking.room.roomType})</span>
                </p>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                 <img src={assets.locationIcon}
                  alt="location-icon"/> 
                  <span>{booking.hotel?.address}</span>
                </div>
                <div className='flex items-center gap-1 text-sm text-gray-500'>
                 <img src={assets.guestsIcon}
                  alt="guests-icon"/> 
                  <span>Guests: {booking.guests}</span>
                </div>
                <p className='text-base font-bold'>{currency} {booking.totalPrice.toFixed(2)}</p>
            </div>
        </div>
        
        {/* ------ Date & Timeings ---- */}
        <div className='flex flex-row md:items-center md:gap-12 mt-3 gap-8'>
    <div>
        <p>Check-In:</p>
        <p className='className="text-gray-500 text-sm"'>
            {new Date(booking.checkInDate).toDateString()}
        </p>
    </div>
    <div>
        <p>Check-Out:</p>
        <p className='className="text-gray-500 text-sm"'>
            {new Date(booking.checkOutDate).toDateString()}
        </p>
    </div>
</div>

        {/* ------ Payent Status ---- */}
        <div className='flex flex-col items-start justify-center pt-3'>
    <div className='flex items-center gap-2'>
        <div className={`h-3 w-3 rounded-full ${
          booking.status === 'cancelled' ? "bg-gray-400" :
          booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
        <p className={`text-sm ${
          booking.status === 'cancelled' ? "text-gray-400" :
          booking.isPaid ? "text-green-500" : "text-red-500"}`}>
            {booking.status === 'cancelled' ? "Cancelled" : booking.isPaid ? "Paid" : "Unpaid"}
        </p>
    </div>
    {booking.status !== 'cancelled' && !booking.isPaid && (
    <button onClick={() => payWithEsewa(booking._id)} className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer'>
        Pay Now
    </button>
)}
    {booking.status !== 'cancelled' && (
    <button onClick={() => cancelBooking(booking._id)} className='px-4 py-1.5 mt-2 text-xs border border-red-300 text-red-500 rounded-full hover:bg-red-50 transition-all cursor-pointer'>
        Cancel Booking
    </button>
)}

</div>

    </div>
))}


  </div>
</div>
  )
}

export default MyBookings
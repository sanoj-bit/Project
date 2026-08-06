import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { assets, facilityIcons, roomCommonData } from '../assets/assets'
import StarRating from '../components/StarRating'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const RoomDetails = () => {
  const {id} = useParams()
  const {rooms, getToken, axios, navigate, currency, user} = useAppContext()
  const [room, setRoom] = useState(null)
  const [mainImage, setMainImage] = useState(null)
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [guests, setGuests] = useState(1);

  const [isAvailable, setIsAvailable] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Check if the Room is Available
  const checkAvailability = async ()=>{
    try {
        // Check is Check-In Date is greater than Check-out Date
        if(checkInDate >= checkOutDate){
    toast.error('Check-In Date should be less than Check-Out Date')
    return;
}
const {data} = await axios.post('/api/bookings/check-availability',
{room: id, checkInDate, checkOutDate})
if(data.success){
    if(data.isAvailable){
        setIsAvailable(true)
        toast.success('Room is available')
    }else{
        setIsAvailable(false)
        toast.error('Room is not available')
    }
}else{
    toast.error(data.message)
}
    } catch (error) {
         toast.error(error.message)
    }
  }

  // onSubmitHandler function to check availability & book the room
  const onSubmitHandler = async (e)=>{
    try {
        e.preventDefault();
if(!isAvailable){
    return checkAvailability();
}else{
    const { data } = await axios.post('/api/bookings/book', {room: id, checkInDate, checkOutDate, guests, paymentMethod: "Pay At Hotel"}, {headers: { Authorization: `Bearer ${await getToken()}` }})
    if (data.success){
        toast.success(data.message)
        navigate('/my-bookings')
        scrollTo(0, 0)
    }else{
        toast.error(data.message)
    }
}
    } catch (error) {
        toast.error(error.message)
    }
  }

  // Fetch reviews for this room
  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${id}`)
      if (data.success) {
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  // Check if the logged-in user is allowed to leave a review
  const checkCanReview = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/can-review/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        setCanReview(data.canReview)
      }
    } catch (error) {
      console.log(error.message)
    }
  }

  // Submit a new review
  const submitReview = async (e) => {
    e.preventDefault()
    if (!reviewComment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setSubmittingReview(true)
    try {
      const { data } = await axios.post('/api/reviews', {
        roomId: id,
        rating: reviewRating,
        comment: reviewComment,
      }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        toast.success(data.message)
        setReviewComment('')
        setReviewRating(5)
        setCanReview(false)
        fetchReviews()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Delete a review (only visible/allowed for the reviewer's own review)
  const deleteReview = async (reviewId) => {
    const confirmed = window.confirm("Delete this review? This cannot be undone.")
    if (!confirmed) return

    try {
      const { data } = await axios.post('/api/reviews/delete', { reviewId }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        toast.success(data.message)
        fetchReviews()
        checkCanReview()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    const room = rooms.find(room => room._id === id)
    room && setRoom(room)
    room && setMainImage(room.images[0])
  },[rooms, id])

  useEffect(() => {
    fetchReviews()
  }, [id])

  useEffect(() => {
    if (user) {
      checkCanReview()
    }
  }, [user, id])

  // If the hotel this room belonged to was deleted, room.hotel will be
  // null - show a friendly message instead of crashing on room.hotel.name
  if (room && !room.hotel) {
    return (
      <div className='flex flex-col items-center justify-center py-40 text-center px-6'>
        <p className='text-xl font-playfair text-gray-700'>This room is no longer available.</p>
        <p className='text-gray-500 mt-2'>The hotel it belonged to has been removed.</p>
      </div>
    )
  }

  return room && (
    <div className='py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32'>
    {/* Room Details */}
    <div className='flex flex-col md:flex-row items-start md:items-center gap-2'>
        <h1 className='text-3xl md:text-4xl font-playfair'>
            {room.hotel.name} <span className='font-inter text-sm'>({room.roomType})</span>
        </h1>
        <p className='text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full'>20% OFF</p>
    </div>

    {/* Room Raiting */}
    <div className='flex items-center gap-1 mt-2'>
    <StarRating rating={Math.round(averageRating)} />
    <p className='ml-2'>{totalReviews > 0 ? `${totalReviews} review${totalReviews !== 1 ? 's' : ''}` : 'No reviews yet'}</p>
    </div>

    {/* Room Address */}
    <div className='flex items-center gap-1 text-gray-500 mt-2 text-sm'>
    <img src={assets.locationIcon} alt="location-icon" />
    <span>{room.hotel.address}</span>
    </div>

    {/* Room Images */}
    <div className='flex flex-col lg:flex-row mt-6 gap-6'>
    <div className='lg:w-1/2 w-full'>
        <img src={mainImage} alt="Room Image" className='w-full rounded-xl shadow-lg object-cover'/>
    </div>
    <div className='grid grid-cols-2 gap-4 lg:w-1/2 w-full'>
        {room?.images.length > 1 && room.images.map((image, index)=>(
         <img onClick={()=> setMainImage(image)} key={index} src={image} alt="Room Image" className={`w-full rounded-xl shadow-md object-cover cursor-pointer
          ${mainImage === image &&
          'outline-3 outline-orange-500'}`}/>
        ))}
    </div>
    </div>

    {/* Room Highlights */}
    <div className='flex flex-col md:flex-row md:justify-between mt-10'>
    <div className='flex flex-col'>
        <h1 className='text-3xl md:text-4xl font-playfair'>Experience Luxury Like Never Before</h1>
        <div className='flex flex-wrap items-center mt-3 mb-6 gap-4'>
            {room.amenities.map((item, index)=>(
                <div key={index} className='flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100'>
                    <img src={facilityIcons[item]} alt={item} className='w-5 h-5'/>
                    <p className='text-xs'>{item}</p>
                </div>
            ))}
        </div>
    </div>
    {/* Room Price */}
    <p className ='text-2xl font-meduim'>{currency}{room.pricePerNight}/Night</p>
</div>

   {/* CheckIn CheckOut Form */}
   <form onSubmit={onSubmitHandler} className='flex flex-col md:flex-row items-start md:items-center
    justify-between bg-white shadow-[0px_0px_20px_rgba(0,0,0,0.15)] p-6 rounded-xl
    mx-auto mt-16 max-w-6xl'>

    <div className='flex flex-col flex-wrap md:flex-row items-start
     md:items-center gap-4 md:gap-10 text-gray-500'>
        
        <div className='flex flex-col'>
            <label htmlFor="checkInDate" className='font-medium'>Check-In</label>
            <input onChange={(e)=>setCheckInDate(e.target.value)} 
            min={new Date().toISOString().split('T')[0]} 
            type="date" id='checkInDate' placeholder='Check-In'
             className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5
             outline-none' required/>
        </div>
        <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>
        <div className='flex flex-col'>
            <label htmlFor="checkOutDate" className='font-medium'>Check-Out</label>
            <input onChange={(e)=>setCheckOutDate(e.target.value)} 
            min={checkInDate} disabled={!checkInDate}
             type="date" id='checkOutDate' placeholder='Check-Out'
             className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5
             outline-none' required/>
        </div>
        <div className='w-px h-15 bg-gray-300/70 max-md:hidden'></div>
        <div className='flex flex-col'>
            <label htmlFor="guests" className='font-medium'>Guests</label>
            <input onChange={(e)=>setGuests(e.target.value)} value={guests} type="number" id='guests' placeholder='0'
             className='max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none' required/>
        </div>
        
    </div>

    <button type='submit' className='bg-primary hover:bg-primary-dull
     active:scale-95 transition-all text-white rounded-md max-md:w-full
     max-md:mt-6 md:px-25 py-3 md:py-4 text-base cursor-pointer'>
       {isAvailable ? "Book Now" : "Check Availability"}
    </button>
</form>

       {/* Common Specifications */}

<div className='mt-25 space-y-4'>
         {roomCommonData.map((spec, index)=>(
        <div key={index} className='flex items-start gap-2'>
            <img src={spec.icon} alt={`${spec.title}-icon`} className='w-6.5'/>
            <div>
                <p className='text-base'>{spec.title}</p>
                <p className='text-gray-500'>{spec.description}</p>
            </div>
        </div>
    ))}
</div>

<div className='max-w-3xl border-y border-gray-300 my-16 py-10 text-gray-500'>
    <p>Guests will be allocated on the ground floor according to availability. 
    You get a comfortable Two bedroom apartment has a true city feeling. The 
    price quoted is for two guest, at the guest slot please mark the number of 
    guests to get the exact price for groups. The Guests will be allocated 
    ground floor according to availability. You get the comfortable two bedroom 
    apartment that has a true city feeling.</p>
</div>

   {/* Hosted by */}
   <div className='flex flex-col items-start gap-4'>
    <div className='flex gap-4'>
        <img src={room.hotel.owner?.image} alt="Host" className='h-14 w-14 md:h-18 md:w-18 rounded-full' />
        <div>
            <p className='text-lg md:text-xl'>Hosted by {room.hotel.name}</p>
            <div className='flex items-center mt-1'>
                <StarRating rating={Math.round(averageRating)} />
                <p className='ml-2'>{totalReviews > 0 ? `${totalReviews} review${totalReviews !== 1 ? 's' : ''}` : 'No reviews yet'}</p>
            </div>
        </div>
    </div>
    <button className='px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer'>Contact Now</button>
</div>

    {/* Reviews Section */}
    <div className='max-w-3xl mt-16 border-t border-gray-300 pt-10'>
      <h2 className='text-2xl font-playfair mb-6'>Guest Reviews</h2>

      {canReview && (
        <form onSubmit={submitReview} className='mb-10 p-5 border border-gray-300 rounded-xl'>
          <p className='font-medium text-gray-800 mb-2'>Leave a review</p>

          <div className='flex items-center gap-1 mb-3'>
            {[1, 2, 3, 4, 5].map((star) => (
              <img
                key={star}
                onClick={() => setReviewRating(star)}
                src={reviewRating >= star ? assets.starIconFilled : assets.starIconOutlined}
                alt="star"
                className='w-6 h-6 cursor-pointer'
              />
            ))}
          </div>

          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder='Share your experience with this room...'
            rows={3}
            className='w-full border border-gray-300 rounded p-3 outline-none text-sm'
          />

          <button
            type='submit'
            disabled={submittingReview}
            className='mt-3 bg-primary hover:bg-primary-dull text-white px-6 py-2 rounded transition-all cursor-pointer'
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className='text-gray-500'>No reviews yet. Be the first to share your experience after your stay.</p>
      ) : (
        <div className='space-y-6'>
          {reviews.map((review) => (
            <div key={review._id} className='flex gap-4 pb-6 border-b border-gray-200 last:border-0'>
              <img
                src={review.user?.image || assets.uploadArea}
                alt={review.user?.username}
                className='w-10 h-10 rounded-full object-cover'
              />
              <div className='flex-1'>
                <div className='flex items-center justify-between'>
                  <p className='font-medium text-gray-800'>{review.user?.username || 'Anonymous'}</p>
                  {user && review.user?._id === user.id && (
                    <button
                      onClick={() => deleteReview(review._id)}
                      className='text-red-500 hover:text-red-700 text-xs font-medium border border-red-300 rounded px-3 py-1 hover:bg-red-50 transition-all cursor-pointer'
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className='flex items-center gap-1 mt-1'>
                  <StarRating rating={review.rating} />
                </div>
                <p className='text-gray-500 mt-2 text-sm'>{review.comment}</p>
                <p className='text-gray-400 text-xs mt-1'>{new Date(review.createdAt).toDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    </div>
  )
}

export default RoomDetails
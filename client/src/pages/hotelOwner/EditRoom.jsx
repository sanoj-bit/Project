import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import Title from '../../components/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const EditRoom = () => {
  const { roomId } = useParams()
  const { axios, getToken, navigate } = useAppContext()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [images, setImages] = useState({
    1: null,
    2: null,
    3: null,
    4: null
  })

  const [existingImages, setExistingImages] = useState([])

  const [inputs, setInputs] = useState({
    roomType: '',
    pricePerNight: 0,
    amenities: {
      'Free WiFi': false,
      'Free Breakfast': false,
      'Room Service': false,
      'Mountain View': false,
      'Pool Access': false
    }
  })

  const fetchRoom = async () => {
    try {
      const { data } = await axios.get(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        const room = data.room
        setInputs({
          roomType: room.roomType,
          pricePerNight: room.pricePerNight,
          amenities: {
            'Free WiFi': room.amenities.includes('Free WiFi'),
            'Free Breakfast': room.amenities.includes('Free Breakfast'),
            'Room Service': room.amenities.includes('Room Service'),
            'Mountain View': room.amenities.includes('Mountain View'),
            'Pool Access': room.amenities.includes('Pool Access'),
          }
        })
        setExistingImages(room.images)
      } else {
        toast.error(data.message)
        navigate('/owner/list-room')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (!inputs.roomType || !inputs.pricePerNight) {
      toast.error("Please fill in all the details")
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('roomId', roomId)
      formData.append('roomType', inputs.roomType)
      formData.append('pricePerNight', inputs.pricePerNight)

      const amenities = Object.keys(inputs.amenities).filter(key => inputs.amenities[key])
      formData.append('amenities', JSON.stringify(amenities))

      // Only attach new images if the owner actually selected replacements
      const hasNewImages = Object.values(images).some(image => image)
      if (hasNewImages) {
        Object.keys(images).forEach((key) => {
          images[key] && formData.append('images', images[key])
        })
      }

      const { data } = await axios.put(`/api/rooms/${roomId}`, formData, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })

      if (data.success) {
        toast.success(data.message)
        navigate('/owner/list-room')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchRoom()
  }, [roomId])

  if (loading) {
    return <p className='text-gray-500 mt-10'>Loading room details...</p>
  }

  return (
    <form onSubmit={onSubmitHandler}>
      <Title align='left' font='outfit' title='Edit Room' subTitle='Update the room details, pricing, and amenities. Leave the image slots empty to keep the current photos.' />

      {/* Current Images */}
      <p className='text-gray-800 mt-10'>Current Images</p>
      <div className='grid grid-cols-2 sm:flex gap-4 my-2 flex-wrap'>
        {existingImages.map((img, index) => (
          <img key={index} className='max-h-13 rounded opacity-90' src={img} alt="" />
        ))}
      </div>

      {/* Upload Area For Replacement Images */}
      <p className='text-gray-800 mt-6'>Replace Images (optional)</p>
      <div className='grid grid-cols-2 sm:flex gap-4 my-2 flex-wrap'>
        {Object.keys(images).map((key) => (
          <label htmlFor={`roomImage${key}`} key={key}>
            <img className='max-h-13 cursor-pointer opacity-80' src={images[key] ? URL.createObjectURL(images[key]) : assets.uploadArea} alt="" />
            <input type="file" accept='image/*' id={`roomImage${key}`} hidden onChange={e => setImages({ ...images, [key]: e.target.files[0] })} />
          </label>
        ))}
      </div>

      <div className='w-full flex max-sm:flex-col sm:gap-4 mt-4'>
        <div className='flex-1 max-w-48'>
          <p className='text-gray-800 mt-4'>Room Type</p>
          <select value={inputs.roomType} onChange={e => setInputs({ ...inputs, roomType: e.target.value })} className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full'>
            <option value="">Select Room Type</option>
            <option value="Single Bed">Single Bed</option>
            <option value="Double Bed">Double Bed</option>
            <option value="Luxury Room">Luxury Room</option>
            <option value="Family Suite">Family Suite</option>
          </select>
        </div>
        <div>
          <p className='mt-4 text-gray-800'>
            Price <span className='text-xs'>/night</span>
          </p>
          <input type="number" placeholder='0' className='border border-gray-300 mt-1 rounded p-2 w-24'
            value={inputs.pricePerNight} onChange={e => setInputs({ ...inputs, pricePerNight: e.target.value })} />
        </div>
      </div>

      <p className='text-gray-800 mt-4'>Amenities</p>
      <div className='flex flex-col flex-wrap mt-1 text-gray-400 max-w-sm'>
        {Object.keys(inputs.amenities).map((amenity, index) => (
          <div key={index}>
            <input type="checkbox" id={`amenities${index + 1}`} checked={inputs.amenities[amenity]} onChange={() => setInputs({ ...inputs, amenities: { ...inputs.amenities, [amenity]: !inputs.amenities[amenity] } })} />
            <label htmlFor={`amenities${index + 1}`}> {amenity}</label>
          </div>
        ))}
      </div>

      <div className='flex gap-4 mt-8'>
        <button type='submit' className='bg-primary text-white px-8 py-2 rounded cursor-pointer' disabled={saving}>
          {saving ? 'Saving...' : "Save Changes"}
        </button>
        <button type='button' onClick={() => navigate('/owner/list-room')} className='border border-gray-300 text-gray-600 px-8 py-2 rounded cursor-pointer hover:bg-gray-50 transition-all'>
          Cancel
        </button>
      </div>

    </form>
  )
}

export default EditRoom
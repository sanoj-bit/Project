import React from 'react'
import { Link } from 'react-router-dom'

const PaymentSuccess = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-[70vh] px-4 text-center'>
      <div className='w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6'>
        <svg xmlns="http://www.w3.org/2000/svg" className='h-10 w-10 text-green-600' fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className='text-3xl font-playfair font-semibold mb-2'>Payment Successful</h1>
      <p className='text-gray-500 mb-8'>Your payment has been confirmed. Thank you for booking with us!</p>
      <Link to='/my-bookings' className='px-6 py-2.5 rounded bg-primary text-white hover:bg-primary-dull transition-all'>
        View My Bookings
      </Link>
    </div>
  )
}

export default PaymentSuccess
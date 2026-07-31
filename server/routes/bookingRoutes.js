import express from 'express';
import {
    checkRoomAvailability,
    createBooking,
    getHotelBookings,
    getUserBookings,
    cancelBooking,
    deleteBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkRoomAvailability);
bookingRouter.post('/book', protect, createBooking);
bookingRouter.get('/user', protect, getUserBookings);
bookingRouter.get('/hotel', protect, getHotelBookings);
bookingRouter.post('/cancel', protect, cancelBooking);
bookingRouter.post('/delete', protect, deleteBooking);

export default bookingRouter;
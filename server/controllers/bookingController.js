import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// Function to check Availability of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.error(error.message);
  }
};

// API to check availability of a room
// POST /api/bookings/check-availability
export const checkRoomAvailability = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    // Before Booking Check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice *= nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    // Respond immediately so the user isn't kept waiting on the email
    res.json({ success: true, message: "Booking created successfully" });

    // Send confirmation email in the background (doesn't block the response)
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: 'Hotel Booking Details',
      html: `
          <h2>Your Booking Details</h2>
          <p>Dear ${req.user.username},</p>
          <p>Thank you for your booking! Here are your details:</p>
          <ul>
              <li><strong>Booking ID:</strong> ${booking._id}</li>
              <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
              <li><strong>Location:</strong> ${roomData.hotel.address}</li>
              <li><strong>Date:</strong> ${booking.checkInDate.toDateString()}</li>
              <li><strong>Booking Amount:</strong> ${process.env.CURRENCY || '$'} ${booking.totalPrice} /night</li>
          </ul>
          <p>We look forward to welcoming you!</p>
          <p>If you need to make any changes, feel free to contact us.</p>
          `
    };

    transporter.sendMail(mailOptions).catch((error) => {
      console.log("Failed to send booking confirmation email:", error.message);
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

// API to get all bookings for a hotel (owner dashboard)
export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });

    // Exclude cancelled bookings from stats
    const activeBookings = bookings.filter(booking => booking.status !== 'cancelled');

    // Total Bookings (active only)
    const totalBookings = activeBookings.length;

    // Total Revenue (active only)
    const totalRevenue = activeBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({ success: true, dashboardData: { totalBookings, totalRevenue, bookings } });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
}

// API to cancel a booking
// POST /api/bookings/cancel
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Verify the logged-in user actually owns the hotel this booking belongs to
    const hotel = await Hotel.findOne({ owner: req.auth().userId });
    if (!hotel || booking.hotel.toString() !== hotel._id.toString()) {
      return res.json({ success: false, message: "Not authorized to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to permanently delete a cancelled booking
// POST /api/bookings/delete
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Verify the logged-in user actually owns the hotel this booking belongs to
    const hotel = await Hotel.findOne({ owner: req.auth().userId });
    if (!hotel || booking.hotel.toString() !== hotel._id.toString()) {
      return res.json({ success: false, message: "Not authorized to delete this booking" });
    }

    // Only allow deleting bookings that are already cancelled
    if (booking.status !== "cancelled") {
      return res.json({ success: false, message: "Only cancelled bookings can be deleted" });
    }

    await Booking.findByIdAndDelete(bookingId);

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
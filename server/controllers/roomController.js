import Hotel from "../models/Hotel.js";  
import { v2 as cloudinary } from "cloudinary";
import Room from "../models/Room.js";  
import Review from "../models/Review.js";

const VALID_ROOM_TYPES = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];

// API to create a new room for a hotel
export const createRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, amenities, hotelId } = req.body;

    if (!hotelId) return res.json({ success: false, message: "Please select a hotel" });

    // Verify the caller actually owns this specific hotel
    const hotel = await Hotel.findOne({ _id: hotelId, owner: req.auth().userId });
    if (!hotel) return res.json({ success: false, message: "No Hotel found" });

    // Validate inputs
    if (!roomType || !VALID_ROOM_TYPES.includes(roomType)) {
      return res.json({ success: false, message: "Please select a valid room type" });
    }

    const price = +pricePerNight;
    if (!pricePerNight || isNaN(price) || price <= 0) {
      return res.json({ success: false, message: "Price must be a positive number" });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: "Please upload at least one image" });
    }

    // upload images to cloudinary
    const uploadImages = req.files.map(async (file) => {
      const response = await cloudinary.uploader.upload(file.path);
      return response.secure_url;
    });

    // Wait for all uploads to complete
    const images = await Promise.all(uploadImages);

    await Room.create({
      hotel: hotel._id,
      roomType,
      pricePerNight: price,
      amenities: JSON.parse(amenities),
      images,
    });

    res.json({ success: true, message: "Room created successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all rooms
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true })
      .populate({
        path: 'hotel',
        populate: {
          path: 'owner',
          select: 'image'
        }
      })
      .sort({ createdAt: -1 });

    // Attach average rating + review count to each room
    const roomIds = rooms.map(room => room._id.toString());
    const ratingStats = await Review.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: "$room", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } }
    ]);

    const ratingMap = {};
    ratingStats.forEach(stat => {
      ratingMap[stat._id] = {
        averageRating: Math.round(stat.averageRating * 10) / 10,
        totalReviews: stat.totalReviews,
      };
    });

    const roomsWithRatings = rooms.map(room => {
      const stats = ratingMap[room._id.toString()] || { averageRating: 0, totalReviews: 0 };
      return { ...room.toObject(), ...stats };
    });

    res.json({ success: true, rooms: roomsWithRatings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get a single room by ID (for the owner's Edit Room page)
export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;

    const roomData = await Room.findById(roomId).populate("hotel");
    if (!roomData) return res.json({ success: false, message: "Room not found" });

    // Verify the logged-in user owns the hotel this room belongs to
    const hotel = await Hotel.findOne({ _id: roomData.hotel._id, owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "Not authorized to view this room" });
    }

    res.json({ success: true, room: roomData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to get all rooms for the logged-in owner (across all their hotels)
export const getRoomsByHotel = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.auth().userId });
    const hotelIds = hotels.map(h => h._id.toString());
    const rooms = await Room.find({ hotel: { $in: hotelIds } }).populate("hotel").sort({ createdAt: -1 });

    res.json({ success: true, rooms });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to toggle availability of a room
export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;
    const roomData = await Room.findById(roomId);
    if (!roomData) return res.json({ success: false, message: "Room not found" });

    // Verify the logged-in user owns the hotel this room belongs to
    const hotel = await Hotel.findOne({ _id: roomData.hotel, owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "Not authorized to update this room" });
    }

    roomData.isAvailable = !roomData.isAvailable;
    await roomData.save();

    res.json({ success: true, message: "Room availability Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to update a room's details (and optionally replace images)
export const updateRoom = async (req, res) => {
  try {
    const { roomId, roomType, pricePerNight, amenities } = req.body;

    const roomData = await Room.findById(roomId);
    if (!roomData) return res.json({ success: false, message: "Room not found" });

    // Verify the logged-in user owns the hotel this room belongs to
    const hotel = await Hotel.findOne({ _id: roomData.hotel, owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "Not authorized to update this room" });
    }

    if (roomType) {
      if (!VALID_ROOM_TYPES.includes(roomType)) {
        return res.json({ success: false, message: "Please select a valid room type" });
      }
      roomData.roomType = roomType;
    }

    if (pricePerNight) {
      const price = +pricePerNight;
      if (isNaN(price) || price <= 0) {
        return res.json({ success: false, message: "Price must be a positive number" });
      }
      roomData.pricePerNight = price;
    }

    if (amenities) roomData.amenities = JSON.parse(amenities);

    // If new images were uploaded, replace the existing ones
    if (req.files && req.files.length > 0) {
      const uploadImages = req.files.map(async (file) => {
        const response = await cloudinary.uploader.upload(file.path);
        return response.secure_url;
      });
      roomData.images = await Promise.all(uploadImages);
    }

    await roomData.save();

    res.json({ success: true, message: "Room updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to delete a room
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const roomData = await Room.findById(roomId);
    if (!roomData) return res.json({ success: false, message: "Room not found" });

    // Verify the logged-in user owns the hotel this room belongs to
    const hotel = await Hotel.findOne({ _id: roomData.hotel, owner: req.auth().userId });
    if (!hotel) {
      return res.json({ success: false, message: "Not authorized to delete this room" });
    }

    await Room.findByIdAndDelete(roomId);

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
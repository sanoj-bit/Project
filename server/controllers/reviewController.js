import Review from "../models/Review.js";
import Booking from "../models/Booking.js";

// API to submit a review for a room (only allowed if the user has a completed booking for it)
// POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { roomId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.json({ success: false, message: "Please write a comment" });
    }

    // Find a completed (paid) booking by this user for this room
    const booking = await Booking.findOne({
      user: userId,
      room: roomId,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    if (!booking) {
      return res.json({ success: false, message: "You can only review rooms you've booked" });
    }

    // Prevent duplicate review for the same booking
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.json({ success: false, message: "You've already reviewed this booking" });
    }

    const review = await Review.create({
      room: roomId,
      user: userId,
      booking: booking._id,
      rating,
      comment: comment.trim(),
    });

    res.json({ success: true, message: "Review submitted successfully", review });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ success: false, message: "You've already reviewed this booking" });
    }
    res.json({ success: false, message: error.message });
  }
};

// API to get all reviews for a specific room
// GET /api/reviews/:roomId
export const getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;

    const reviews = await Review.find({ room: roomId })
      .populate("user", "username image")
      .sort({ createdAt: -1 });

    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to check if the logged-in user can review a given room
// GET /api/reviews/can-review/:roomId
export const canReviewRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findOne({
      user: userId,
      room: roomId,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 });

    if (!booking) {
      return res.json({ success: true, canReview: false });
    }

    const existingReview = await Review.findOne({ booking: booking._id });

    res.json({ success: true, canReview: !existingReview });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to delete a review (only the original reviewer can delete their own review)
// POST /api/reviews/delete
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    if (review.user !== userId) {
      return res.json({ success: false, message: "You can only delete your own review" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    room: { type: String, ref: "Room", required: true },
    user: { type: String, ref: "User", required: true },
    booking: { type: String, ref: "Booking", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
}, { timestamps: true }
);

// Prevent the same booking from being reviewed more than once
reviewSchema.index({ booking: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
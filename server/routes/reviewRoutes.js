import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createReview, getRoomReviews, canReviewRoom, deleteReview } from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post('/', protect, createReview);
reviewRouter.get('/:roomId', getRoomReviews);
reviewRouter.get('/can-review/:roomId', protect, canReviewRoom);
reviewRouter.post('/delete', protect, deleteReview);

export default reviewRouter;
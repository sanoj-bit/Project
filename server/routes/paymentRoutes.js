import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { initiateEsewaPayment, esewaSuccess, esewaFailure } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post('/esewa/initiate', protect, initiateEsewaPayment);
paymentRouter.get('/esewa/success', esewaSuccess);
paymentRouter.get('/esewa/failure', esewaFailure);

export default paymentRouter;
import express from "express";
import { subscribeNewsletter } from "../controllers/subscriberController.js";

const newsletterRouter = express.Router();

newsletterRouter.post('/subscribe', subscribeNewsletter);

export default newsletterRouter;
import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import dns from "dns";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

dns.setServers(['8.8.8.8', '1.1.1.1']);

connectDB()
connectCloudinary();

const app = express()
app.use(cors()) // Enable Cross-Origin Resource Sharing

 // Middleware
 app.use(express.json())
 app.use(clerkMiddleware())

 // API to listen to Clerk Webhooks
 app.use("/api/clerk", clerkWebhooks)

app.get('/', (req, res)=> res.send("API is working"))
app.use('/api/user', userRouter)
app.use('/api/hotels', hotelRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/payments', paymentRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
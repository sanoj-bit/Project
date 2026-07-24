import express from "express"
import "dotenv/config";
import cors from "cors";
import connectDB from "./configs/db.js";
import dns from "dns";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js";

dns.setServers(['8.8.8.8', '1.1.1.1']);

connectDB()

const app = express()
app.use(cors()) // Enable Cross-Origin Resource Sharing

 // Middleware
 app.use(express.json())
 app.use(clerkMiddleware())

 // API to listen to Clerk Webhooks
 app.use("/api/clerk", clerkWebhooks)

app.get('/', (req, res)=> res.send("API is working"))

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

// Middleware to check if user is authenticated
export const protect = async (req, res, next)=>{
    const {userId} = req.auth();
    if(!userId){
         return res.json({success: false, message: "not authenticated"})
    }

    try {
        let user = await User.findById(userId);

        // If the user isn't in our DB yet (e.g. the Clerk webhook hasn't
        // reached this server, which happens a lot in local dev), create
        // it here from Clerk's own data instead of failing.
        if(!user){
            const clerkUser = await clerkClient.users.getUser(userId);
            user = await User.create({
                _id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress || "",
                username: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
                image: clerkUser.imageUrl,
                role: "user",
            });
        }

        req.user = user;
        next()
    } catch (error) {
        console.error("Auth middleware error:", error);
        res.json({success: false, message: error.message})
    }
}
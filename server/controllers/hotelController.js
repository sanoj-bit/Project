import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
    try {
        const {name, address, contact, city} = req.body;
        const owner = req.user._id
        const isAdmin = owner === process.env.OWNER_ACCOUNT_ID

        // Non-admin accounts can only ever register one hotel each.
        // The admin account can register as many hotels (locations) as needed.
        if (!isAdmin) {
            const hotel = await Hotel.findOne({owner})
            if(hotel){
             return res.json({ success: false, message: "Hotel Already Registered" })
    }
        }

    await Hotel.create({name, address, contact, city, owner});

    // Only one specific account is allowed to actually become a hotel
    // owner (i.e. get Dashboard access). Everyone else's registration
    // still succeeds, but their role stays "user".
    // Set OWNER_ACCOUNT_ID in your .env to that account's Clerk user ID
    // (the "_id" shown in MongoDB's users collection, e.g. "user_3Gw...").
    if (isAdmin) {
        await User.findByIdAndUpdate(owner, {role: "hotelOwner"});
    }

   res.json({success: true, message: "Hotel Registered Successfully"})

} catch (error) {
     console.error("registerHotel error:", error);
     res.json({success: false, message: error.message})
}

}

// API to list every hotel the logged-in admin owns (used to populate the
// "which hotel is this room in" selector on the Add Room page).
export const getMyHotels = async (req, res) => {
    try {
        const hotels = await Hotel.find({ owner: req.auth().userId }).sort({ createdAt: -1 });
        res.json({ success: true, hotels });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
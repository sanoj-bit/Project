import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
    try {
        const {name, address, contact, city} = req.body;
        const owner = req.user._id

        // Check if User Alreday Registred 
        const hotel = await Hotel.findOne({owner})
        if(hotel){
         return res.json({ success: false, message: "Hotel Already Registered" })
}

    await Hotel.create({name, address, contact, city, owner});

    // Only the exact configured owner account gets dashboard access.
    // Every other account must stay as a regular user, even after hotel
    // registration is successful.
    const isOwnerAccount = owner === process.env.OWNER_ACCOUNT_ID;
    await User.findByIdAndUpdate(owner, {
        role: isOwnerAccount ? "hotelOwner" : "user"
    });

   res.json({success: true, message: "Hotel Registered Successfully"})

} catch (error) {
     console.error("registerHotel error:", error);
     res.json({success: false, message: error.message})
}

}
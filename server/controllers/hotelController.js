import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
    try {
        const {name, address, contact, city} = req.body;
        const owner = req.user._id

        // Validate required fields aren't empty/whitespace
        if (!name || !name.trim()) {
            return res.json({ success: false, message: "Hotel name is required" });
        }
        if (!address || !address.trim()) {
            return res.json({ success: false, message: "Address is required" });
        }
        if (!contact || !contact.trim()) {
            return res.json({ success: false, message: "Phone number is required" });
        }
        if (!city || !city.trim()) {
            return res.json({ success: false, message: "City is required" });
        }

        // Basic phone format check (digits, spaces, +, -, at least 7 characters)
        if (!/^[\d\s+\-()]{7,}$/.test(contact.trim())) {
            return res.json({ success: false, message: "Please enter a valid phone number" });
        }

        if (name.trim().length > 100) {
            return res.json({ success: false, message: "Hotel name is too long" });
        }

        // Check if User Alreday Registred 
        const hotel = await Hotel.findOne({owner})
        if(hotel){
         return res.json({ success: false, message: "Hotel Already Registered" })
}

    await Hotel.create({
        name: name.trim(),
        address: address.trim(),
        contact: contact.trim(),
        city: city.trim(),
        owner
    });

    await User.findByIdAndUpdate(owner, {role: "hotelOwner"});

   res.json({success: true, message: "Hotel Registered Successfully"})

} catch (error) {
     res.json({success: false, message: error.message})
}

}
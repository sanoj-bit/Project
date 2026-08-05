import mongoose from "mongoose";
import "dotenv/config";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

const cities = ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Chitwan", "Biratnagar"];

const run = async () => {
  await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
  console.log("Connected to database");

  // Grab your existing hotel to reuse its owner/address/contact
  const existingHotel = await Hotel.findOne({});
  if (!existingHotel) {
    console.log("No existing hotel found — nothing to base new ones on.");
    process.exit(1);
  }

  // Create (or reuse) one hotel per city
  const hotelsByCity = {};
  for (const city of cities) {
    let hotel = await Hotel.findOne({ owner: existingHotel.owner, city });
    if (!hotel) {
      hotel = await Hotel.create({
        name: existingHotel.name,
        address: existingHotel.address,
        contact: existingHotel.contact,
        owner: existingHotel.owner,
        city,
      });
      console.log(`Created hotel in ${city}`);
    } else {
      console.log(`Hotel already exists in ${city}`);
    }
    hotelsByCity[city] = hotel._id;
  }

  // Spread all existing rooms across these city-specific hotels, round-robin
  const rooms = await Room.find({});
  console.log(`Found ${rooms.length} rooms to redistribute`);

  for (let i = 0; i < rooms.length; i++) {
    const city = cities[i % cities.length];
    rooms[i].hotel = hotelsByCity[city];
    await rooms[i].save();
    console.log(`Room "${rooms[i].roomType}" (${rooms[i].pricePerNight}) -> ${city}`);
  }

  console.log("Done!");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
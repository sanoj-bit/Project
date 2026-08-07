import mongoose from "mongoose";
import "dotenv/config";
import Hotel from "../models/Hotel.js";

// A plausible local address for each city, so cards don't all show "kapan"
const addressByCity = {
  "Kathmandu": "Thamel, Kathmandu",
  "Pokhara": "Lakeside, Pokhara",
  "Lalitpur": "Patan Durbar Square, Lalitpur",
  "Bhaktapur": "Suryabinayak, Bhaktapur",
  "Chitwan": "Bharatpur, Chitwan",
  "Biratnagar": "Traffic Chowk, Biratnagar",
};

const run = async () => {
  await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
  console.log("Connected to database");

  const hotels = await Hotel.find({});
  console.log(`Found ${hotels.length} hotels`);

  for (const hotel of hotels) {
    const newAddress = addressByCity[hotel.city];
    if (newAddress) {
      hotel.address = newAddress;
      await hotel.save();
      console.log(`"${hotel.name}" (${hotel.city}) -> address: ${newAddress}`);
    } else {
      console.log(`"${hotel.name}" has unrecognized city "${hotel.city}", skipped`);
    }
  }

  console.log("Done!");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
import mongoose from "mongoose";
import dotenv from "dotenv";
// Load the real production values pulled via `vercel env pull`, so this
// script always talks to the same database your live site uses -
// instead of relying on a possibly-different local .env file.
dotenv.config({ path: ".env.production.local" });
import Hotel from "../models/Hotel.js";

const cities = ["Kathmandu", "Pokhara", "Lalitpur", "Bhaktapur", "Chitwan", "Biratnagar"];

const run = async () => {
  await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
  console.log("Connected to database");

  // Grab every hotel, oldest first, so the spread is predictable
  const hotels = await Hotel.find({}).sort({ createdAt: 1 });
  console.log(`Found ${hotels.length} hotels to spread across ${cities.length} cities`);

  for (let i = 0; i < hotels.length; i++) {
    const city = cities[i % cities.length];
    hotels[i].city = city;
    await hotels[i].save();
    console.log(`"${hotels[i].name}" -> ${city}`);
  }

  console.log("Done!");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
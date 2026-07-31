import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        return;
    }

    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"));

        await mongoose.connect(`${process.env.MONGODB_URI}/hotel-booking`);
        isConnected = true;
    } catch (error) {
        console.log(error.message);
    }
}

export default connectDB;
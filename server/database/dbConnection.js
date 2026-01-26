import mongoose from 'mongoose';

export const connectDB =async ()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI,{
            dbName:process.env.DB_NAME,
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed")
    }
}
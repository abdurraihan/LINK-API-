import mongoose from "mongoose";
import dotenv from "dotenv";
import server from "./app.js";
import { initializeFirebase } from "./utils/firebase.config.js";
dotenv.config();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/youtube-clone";
// Connect MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ MongoDB connected");
    }
    catch (error) {
        console.error("MongoDB error:", error);
        process.exit(1);
    }
};
// Start server
const startServer = async () => {
    await connectDB();
    initializeFirebase();
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Socket.IO initialized`);
        console.log(`🔥 Firebase initialized`);
    });
};
startServer();

import mongoose from "mongoose";
import dotenv from "dotenv";
import server from "./app.js";
import { MONGO_URI } from "./config/config.js";
import { PORT } from "./config/config.js";
import { initializeFirebase } from "./utils/firebase.config.js";
dotenv.config();
const CONNECTION_PORT = PORT || 5000;
const MONGODB_URI = MONGO_URI;
// Connect MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ MongoDB connected - connected from ${MONGODB_URI}`);
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
        console.log(`🚀 Server running on port ${CONNECTION_PORT}`);
        console.log(`📡 Socket.IO initialized`);
        console.log(`🔥 Firebase initialized`);
    });
};
startServer();

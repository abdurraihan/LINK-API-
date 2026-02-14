import { Server } from "socket.io";
let io = null;
const userSocketMap = new Map();
export const socketService = {
    initialize(httpServer) {
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });
        io.on("connection", (socket) => {
            console.log(`⚡ Socket connected: ${socket.id}`);
            socket.on("register", (userId) => {
                if (userId) {
                    userSocketMap.set(userId, socket.id);
                    socket.data.userId = userId;
                    console.log(`✅ User registered: ${userId}`);
                    socket.emit("registered", {
                        success: true,
                        userId,
                        socketId: socket.id
                    });
                }
            });
            socket.on("disconnect", () => {
                const userId = socket.data.userId;
                if (userId) {
                    userSocketMap.delete(userId);
                    console.log(`❌ User disconnected: ${userId}`);
                }
            });
            socket.on("ping", () => {
                socket.emit("pong");
            });
        });
        console.log("🚀 Socket.IO initialized");
    },
    emitToUser(userId, event, data) {
        const userIdStr = userId.toString();
        const socketId = userSocketMap.get(userIdStr);
        if (socketId && io) {
            io.to(socketId).emit(event, data);
            console.log(`📤 Sent '${event}' to user ${userIdStr}`);
            return true;
        }
        console.log(`⚠️ User ${userIdStr} not online`);
        return false;
    },
    isUserOnline(userId) {
        return userSocketMap.has(userId.toString());
    }
};

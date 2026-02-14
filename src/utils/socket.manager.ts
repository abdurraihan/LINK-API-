import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "./jwt.utils.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketManager {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(server: HttpServer): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupConnectionHandlers();
    console.log("✅ Socket.IO initialized successfully");
  }

  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      socket.on("authenticate", (token: string) => {
        try {
          const decoded = verifyAccessToken(token);
          socket.userId = decoded.id;
          
          if (!this.userSockets.has(socket.userId)) {
            this.userSockets.set(socket.userId, new Set());
          }
          this.userSockets.get(socket.userId)!.add(socket.id);

          console.log(`✅ User ${socket.userId} authenticated`);
          socket.emit("authenticated", { userId: socket.userId });
          
          this.emitUserStatus(socket.userId, "online");
        } catch (error) {
          console.error("❌ Socket authentication failed:", error);
          socket.emit("authentication_error", { message: "Invalid token" });
          socket.disconnect();
        }
      });

      socket.on("disconnect", () => {
        if (socket.userId) {
          const userSocketSet = this.userSockets.get(socket.userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            
            if (userSocketSet.size === 0) {
              this.userSockets.delete(socket.userId);
              this.emitUserStatus(socket.userId, "offline");
              console.log(`👤 User ${socket.userId} is now offline`);
            }
          }
        }
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });

      socket.on("logout", () => {
        if (socket.userId) {
          this.removeUserSocket(socket.userId, socket.id);
        }
      });
    });
  }

  private emitUserStatus(userId: string, status: "online" | "offline"): void {
    if (!this.io) return;
    this.io.emit("user_status", { userId, status, timestamp: new Date() });
  }

  private removeUserSocket(userId: string, socketId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socketId);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
        this.emitUserStatus(userId, "offline");
      }
    }
  }

  emitToUser(userId: string, event: string, data: any): boolean {
    if (!this.io) {
      console.error("❌ Socket.IO not initialized");
      return false;
    }

    const userSocketSet = this.userSockets.get(userId);
    if (!userSocketSet || userSocketSet.size === 0) {
      console.log(`📴 User ${userId} is offline`);
      return false;
    }

    userSocketSet.forEach((socketId) => {
      this.io!.to(socketId).emit(event, data);
    });

    console.log(`📨 Emitted "${event}" to user ${userId}`);
    return true;
  }

  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.error("❌ Socket.IO not initialized");
      return;
    }
    this.io.emit(event, data);
    console.log(`📢 Broadcasted "${event}"`);
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  getIO(): SocketServer | null {
    return this.io;
  }
}

export const socketManager = new SocketManager();
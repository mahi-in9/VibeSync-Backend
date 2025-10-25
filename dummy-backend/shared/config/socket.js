// socket.js
import { Server } from "socket.io";

let io; // to hold our socket instance globally

/**
 * Initializes the Socket.io server
 * @param {http.Server} server - The HTTP server instance from Express
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // change to your frontend domain in production
      methods: ["GET", "POST"],
    },
  });

  console.log("✅ Socket.io initialized");

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Example: join group-specific room
    socket.on("joinGroupRoom", (groupId) => {
      socket.join(groupId);
      console.log(`📢 ${socket.id} joined group room: ${groupId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the initialized io instance for controllers
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Optional default export
export { io };

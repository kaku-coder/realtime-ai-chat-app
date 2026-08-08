import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 3000;

// Connect to MongoDB Database
connectDB();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});
io.on("connection", (socket) => {
    console.log("A user id is ", socket.id);
    socket.on("send-message", async (msg) => {
        console.log("Message is :", msg);

    })
})
httpServer.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
});
import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { generateContent } from "./src/services/ai.service.js";

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
    socket.on("send-message", async (userMessage) => {
        try {
            console.log("user prompt" + "" + userMessage)
            const response = await generateContent(userMessage);
            console.log(response.data)
            socket.emit("receive-message", response)
            // save the data in mongodb 
            await Chat.create({
                userMessage: userMessage,
                aiResponse: response,
                modelUsed: "gemini-2.0-flash",
            })
        } catch (error) {
            console.error("Error in AI Service:", error.message);
            socket.emit("receive-message","some thing went wrong")
        }

    })
})
httpServer.listen(PORT, () => {
    console.log(`Server is running on port: http://localhost:${PORT}`);
});
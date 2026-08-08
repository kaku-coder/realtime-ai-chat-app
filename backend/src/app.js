import express from "express";
import cors from "cors";
import morgan from "morgan";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(morgan("dev"));

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "AI Chat API is running smoothly",
    });
});

// API Routes
app.use("/api/chat", chatRoutes);

export default app;
import express from "express";
import {
    sendMessageController,
    getChatHistoryController,
} from "../controller/chat.controller.js";

const router = express.Router();

// Route to send message to AI
router.post("/send", sendMessageController);

// Route to get all previous chat history
router.get("/history", getChatHistoryController);

export default router;

import express from "express";
import {
    sendMessageController,
    getChatHistoryController,
    updateChatTitleController,
    deleteChatController,
} from "../controller/chat.controller.js";

const router = express.Router();

// Route to send message to AI
router.post("/send", sendMessageController);

// Route to get all previous chat history
router.get("/history", getChatHistoryController);

// Route to rename conversation title
router.put("/:id/title", updateChatTitleController);

// Route to delete conversation session
router.delete("/:id", deleteChatController);

export default router;

import Chat from "../model/chat.model.js";
import { generateContent } from "../services/ai.service.js";

// Controller to send prompt to AI, save chat in DB & return response
export const sendMessageController = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Message/prompt is required",
            });
        }

        // Generate response from AI Service
        const aiResponse = await generateContent(message);

        // Save conversation to Database
        const chat = await Chat.create({
            userMessage: message,
            aiResponse: aiResponse,
        });

        return res.status(201).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        console.error("SendMessage Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process chat message",
        });
    }
};

// Controller to get all chat history
export const getChatHistoryController = async (req, res) => {
    try {
        const chats = await Chat.find().sort({ createdAt: 1 });
        return res.status(200).json({
            success: true,
            count: chats.length,
            data: chats,
        });
    } catch (error) {
        console.error("GetChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch chat history",
        });
    }
};

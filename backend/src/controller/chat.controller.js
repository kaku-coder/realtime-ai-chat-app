import Chat from "../model/chat.model.js";
import { generateContent } from "../services/ai.service.js";

// Controller to send prompt to AI, update or create conversation session object in DB
export const sendMessageController = async (req, res) => {
    try {
        const { message, chatId } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Message/prompt is required",
            });
        }

        // Generate AI response
        const aiResponse = await generateContent(message);
        const newMessage = { userMessage: message.trim(), aiResponse };

        let chatDoc;

        // If existing chatId is provided, append message to that conversation object
        if (chatId) {
            chatDoc = await Chat.findById(chatId);
        }

        if (chatDoc) {
            chatDoc.messages.push(newMessage);
            await chatDoc.save();
        } else {
            // Title will be the first prompt sent by the user
            const autoTitle = message.trim().length > 30 
                ? message.trim().substring(0, 30) + "..." 
                : message.trim();

            chatDoc = await Chat.create({
                title: autoTitle,
                messages: [newMessage],
            });
        }

        return res.status(201).json({
            success: true,
            data: chatDoc,
        });
    } catch (error) {
        console.error("SendMessage Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process chat message",
        });
    }
};

// Controller to get all chat conversation session objects with valid messages
export const getChatHistoryController = async (req, res) => {
    try {
        // Fetch non-empty chat documents sorted by latest updated
        const chats = await Chat.find({ "messages.0": { $exists: true } }).sort({ updatedAt: -1 });
        
        // Clean up titles for display
        const formattedChats = chats.map((chat) => {
            const chatObj = chat.toObject();
            if (!chatObj.title || chatObj.title === "New Conversation" || chatObj.title === "Untitled Conversation") {
                const firstUserMsg = chatObj.messages[0]?.userMessage || "Chat Session";
                chatObj.title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + "..." : firstUserMsg;
            }
            return chatObj;
        });

        return res.status(200).json({
            success: true,
            count: formattedChats.length,
            data: formattedChats,
        });
    } catch (error) {
        console.error("GetChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch chat history",
        });
    }
};

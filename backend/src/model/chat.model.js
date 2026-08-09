import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    userMessage: {
        type: String,
        required: [true, "User message is required"],
        trim: true,
    },
    aiResponse: {
        type: String,
        required: [true, "AI response is required"],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const chatSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "New Conversation",
        },
        messages: [messageSchema],
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;

import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        userMessage: {
            type: String,
            required: [true, "User message is required"],
            trim: true,
        },
        aiResponse: {
            type: String,
            required: [true, "AI response is required"],
        },
        modelUsed: {
            type: String,
            default: "gemini-2.0-flash",
        },
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;

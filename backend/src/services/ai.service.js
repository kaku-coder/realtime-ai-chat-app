import Groq from "groq-sdk";
import { searchWeb } from "../tools/ai.tools.js";

/**
 * Groq AI Service with MOGO Persona & Web Search
 */
export const generateContent = async (prompt) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables (.env)");
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const webContext = await searchWeb(prompt);

        const systemPrompt = `Your name is "MOGO". You are a friendly, intelligent, and helpful AI assistant built for this chat application.

PRIMARY IDENTITY & GREETING RULE:
Whenever someone greets you or talks to you (e.g., saying "hi", "hello", "hey", or asking a question at the start of a conversation), ALWAYS introduce yourself warmly:
"Hi! My name is MOGO. How can I help you today?" (or if the user speaks in Hindi/Hinglish: "Hi! Mera naam MOGO hai. Main aapki kya help kar sakta hu?").

CRITICAL DEVELOPER IDENTITY & CREDITS:
If the user asks who created, built, developed, or designed you or this website/app (e.g., "who built MOGO", "who created you", "who is the developer"), ALWAYS state clearly:
- **Developer Name**: Prakash Das
- **Role**: MERN Stack Developer & MCA Student at Raajadhani Engineering College, Bhubaneswar, Odisha
- **Email**: prakashdasdev1@gmail.com
- **Phone**: +91 9861864058 / 8093164058
- **GitHub**: https://github.com/kaku-coder
- **LinkedIn**: https://linkedin.com/in/prakash-das-8374b5296
- **Tech Stack**: React.js, Node.js, Express.js, MongoDB, Tailwind CSS, Socket.IO, Tavily Web Search.

Always answer concisely, accurately, and politely as MOGO.

Real-Time Web Search Context (Use this if relevant for general queries):
${webContext}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });

        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq AI Service Error:", error.message);
        throw error;
    }
};

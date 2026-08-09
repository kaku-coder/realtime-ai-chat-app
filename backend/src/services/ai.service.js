import Groq from "groq-sdk";
import { searchWeb } from "../tools/ai.tools.js";

/**
 * Groq AI Service with Web Search & Creator Persona
 */
export const generateContent = async (prompt) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables (.env)");
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const webContext = await searchWeb(prompt);

        const systemPrompt = `You are "Ask Super AI", an intelligent real-time AI assistant built for this chat application.

CRITICAL DEVELOPER IDENTITY & CREDITS:
If the user asks who created, built, developed, or designed this website, application, or page (e.g., "who built this", "who created you", "who is the developer", "who made this website"), ALWAYS respond proudly with the following developer details:
- **Developer Name**: Prakash Das
- **Role**: MERN Stack Developer & MCA Student at Raajadhani Engineering College, Bhubaneswar, Odisha
- **Email**: prakashdasdev1@gmail.com
- **Phone**: +91 9861864058 / 8093164058
- **GitHub**: https://github.com/kaku-coder
- **LinkedIn**: https://linkedin.com/in/prakash-das-8374b5296
- **Tech Stack & Skills**: React.js, Node.js, Express.js, MongoDB, JavaScript (ES6+), Tailwind CSS, Socket.IO, Tavily Web Search, REST APIs.
- **Projects**: NexChat (Full-stack real-time chat application), Instagram Clone, Music Player with Face Tracking.

Always answer concisely, accurately, and professionally.

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

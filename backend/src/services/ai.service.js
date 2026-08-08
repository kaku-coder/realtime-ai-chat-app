import Groq from "groq-sdk";

/**
 * Groq AI Service
 * Extremely fast & free AI text generation using Llama 3.3 70B model
 */
export const generateContent = async (prompt) => {
    try {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is missing in environment variables (.env)");
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });


        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq AI Service Error:", error.message);
        throw error;
    }
};

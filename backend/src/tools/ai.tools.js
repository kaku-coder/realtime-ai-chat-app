import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export const searchWeb = async (query) => {
    try {
        const response = await tvly.search(query, {
            searchDepth: "basic",
            maxResults: 3,
        });

        // Search results se context extract karo
        const searchContext = response.results
            .map((item) => `Title: ${item.title}\nInfo: ${item.content}`)
            .join("\n\n");

        return searchContext;
    } catch (error) {
        console.error("Tavily Search Error:", error.message);
        return "";
    }
};

import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY || "";

/**
 * Initialize Groq Client
 */
export const groq = new Groq({
    apiKey,
});

/**
 * Professional Translation with Groq (Primary Engine)
 * Model: llama-3.3-70b-versatile or similar
 */
export const translateWithGroq = async (text: string, targetLanguage: string) => {
    if (!apiKey) {
        throw new Error("GROQ_API_KEY no configurada.");
    }

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are an expert technical translator. 
                Task: Translate Markdown content to ${targetLanguage}.
                Constraints:
                - Preserve all Markdown structural elements.
                - Return ONLY the translated Markdown.
                - High performance, low latency.`
            },
            {
                role: "user",
                content: text,
            },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 4096,
        top_p: 1,
        stream: false, // Initial implementation, streaming to be optimized later if needed
    });

    return completion.choices[0]?.message?.content || "";
};

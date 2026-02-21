/**
 * Client-Side Groq Integration
 * Note: In production, API keys should be handled via a proxy or server action.
 */
export async function translateWithGroqClient(text: string, targetLanguage: string, apiKey: string) {
    if (!apiKey) {
        throw new Error("GROQ_API_KEY no detectada.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error en la API de Groq");
    }

    const data = await response.json();
    let translatedText = data.choices[0]?.message?.content || "";

    // Sanitización (Pandoc Logic)
    const codeBlockRegex = /```(?:markdown|md)?\s*([\s\S]*?)\s*```/i;
    const match = translatedText.match(codeBlockRegex);
    return match ? match[1].trim() : translatedText.trim();
}

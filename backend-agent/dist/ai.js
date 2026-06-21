import OpenAI from "openai";
import "dotenv/config";
export const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export async function ask(system, user) {
    const completion = await ai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
    });
    return completion.choices[0].message.content ?? "";
}
export async function askJSON(system, user) {
    const raw = await ask(system, user);
    const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(json);
}
//# sourceMappingURL=ai.js.map
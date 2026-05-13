const { GoogleGenerativeAI } = require("@google/generative-ai");

let cachedAi = null;

function getAi() {
  const key = process.env.AI_API_KEY;
  if (!key) {
    throw new Error("AI_API_KEY is not set");
  }
  if (!cachedAi) {
    cachedAi = new GoogleGenerativeAI(key);
  }
  return cachedAi;
}

async function generateReply(prompt) {
  const ai = getAi();
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: Number(process.env.CHAT_MAX_OUTPUT_TOKENS) || 2048,
    },
  });

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.();
  if (typeof text === "string") {
    return text;
  }
  return "";
}

module.exports = {
  generateReply,
};

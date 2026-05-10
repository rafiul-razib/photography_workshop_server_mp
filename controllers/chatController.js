const chatService = require("../services/chatService");

function readMessageText(message) {
  if (!message) return "";
  if (typeof message === "string") return message.trim();
  if (typeof message.content === "string") return message.content.trim();
  if (typeof message.text === "string") return message.text.trim();
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join(" ")
      .trim();
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join(" ")
      .trim();
  }
  return "";
}

function getLatestUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg) continue;
    if (msg.role && msg.role !== "user") continue;
    const text = readMessageText(msg);
    if (text) return text;
  }
  return "";
}

async function chat(req, res) {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const query = (req.body?.message || getLatestUserMessage(messages) || "").trim();
    const sessionId = req.body?.sessionId;

    if (!query) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("User query:", query);

    const result = await chatService.getSessionReply(sessionId, query);
    res.send(result);
  } catch (error) {
    console.error("Gemini chat error →", error);
    res.status(500).json({
      reply:
        "Our event assistant is currently unavailable. Please visit the help desk near the main entrance.",
    });
  }
}

module.exports = { chat };

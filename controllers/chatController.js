const chatService = require("../services/chatService");
const { extractUserQuery, normalizeSessionId } = require("../utils/chatMessageUtils");

async function chat(req, res) {
  try {
    const query = extractUserQuery(req.body);
    const sessionId = normalizeSessionId(req.body?.sessionId);

    if (!query) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await chatService.getSessionReply(sessionId, query);
    return res.json(result);
  } catch (error) {
    console.error("Chat Error →", error);
    return res.status(500).json({
      reply:
        "Our event assistant is currently unavailable. Please visit the help desk near the main entrance.",
    });
  }
}

module.exports = { chat };

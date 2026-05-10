const chatService = require("../services/chatService");

async function chat(req, res) {
  try {
    const query = req.body?.messages?.[0]?.content;

    if (!query) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("User query:", query);

    const reply = await chatService.getEventAssistantReply(query);
    res.send({ reply });
  } catch (error) {
    console.error("Gemini chat error →", error);
    res.status(500).json({
      reply:
        "Our event assistant is currently unavailable. Please visit the help desk near the main entrance.",
    });
  }
}

module.exports = { chat };

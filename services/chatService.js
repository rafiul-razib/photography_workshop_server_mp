const { randomUUID } = require("crypto");
const { getChatSessionsCollection } = require("../config/db");
const buildPrompt = require("../utils/buildPrompt");
const { generateReply } = require("../services/geminiServices");
const { normalizeSessionId } = require("../utils/chatMessageUtils");

// How many past messages (user + assistant entries) to include in the prompt
const MAX_CONTEXT_MESSAGES =
  Number(process.env.CHAT_MAX_CONTEXT_MESSAGES) || 48;
// Total messages kept per session in MongoDB (oldest trimmed first)
const MAX_STORED_MESSAGES =
  Number(process.env.CHAT_MAX_STORED_MESSAGES) || 200;
const MAX_USER_CHARS = Number(process.env.CHAT_MAX_USER_CHARS) || 8000;

function formatHistory(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    return "(No prior messages)";
  }
  return messages
    .map((m) => {
      const role = m?.role === "assistant" ? "Assistant" : "User";
      const content = m?.content != null ? String(m.content).trim() : "";
      return `${role}: ${content || "(empty)"}`;
    })
    .join("\n");
}

function clipQuery(text) {
  if (text.length <= MAX_USER_CHARS) return text;
  return `${text.slice(0, MAX_USER_CHARS)}\n…(truncated)`;
}

async function runAssistant(contextText, query) {
  const safeQuery = clipQuery(String(query || "").trim());
  const prompt = buildPrompt(contextText, safeQuery);
  try {
    const text = await generateReply(prompt);
    if (typeof text === "string" && text.trim()) {
      return text.trim();
    }
  } catch (e) {
    console.error("Gemini generateReply error:", e.message || e);
  }
  return "Sorry, I could not generate a reply right now. Please try again in a moment.";
}

async function ensureSession(sessionId) {
  const col = getChatSessionsCollection();
  const id = normalizeSessionId(sessionId) || randomUUID();

  await col.updateOne(
    { _id: id },
    {
      $setOnInsert: {
        _id: id,
        createdAt: new Date(),
        messages: [],
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true },
  );

  return id;
}

async function getSessionMessages(sessionId) {
  const col = getChatSessionsCollection();
  const session = await col.findOne(
    { _id: sessionId },
    { projection: { messages: 1 } },
  );
  const raw = session?.messages;
  return Array.isArray(raw) ? raw : [];
}

async function appendConversation(sessionId, userText, assistantText) {
  const col = getChatSessionsCollection();
  const now = new Date();
  await col.updateOne(
    { _id: sessionId },
    {
      $push: {
        messages: {
          $each: [
            { role: "user", content: userText, at: now },
            { role: "assistant", content: assistantText, at: now },
          ],
          $slice: -MAX_STORED_MESSAGES,
        },
      },
      $set: { updatedAt: now },
    },
  );
}

async function getSessionReply(sessionId, userText) {
  const normalizedId = normalizeSessionId(sessionId);

  try {
    const resolvedSessionId = await ensureSession(normalizedId);
    const allMessages = await getSessionMessages(resolvedSessionId);
    const history = allMessages.slice(-MAX_CONTEXT_MESSAGES);
    const contextText = formatHistory(history);
    const reply = await runAssistant(contextText, userText);
    await appendConversation(resolvedSessionId, userText, reply);
    return { sessionId: resolvedSessionId, reply };
  } catch (error) {
    console.error("Chat session storage error:", error.message || error);
    const reply = await runAssistant("(No prior messages)", userText);
    const fallbackSessionId = normalizedId || randomUUID();
    return { sessionId: fallbackSessionId, reply };
  }
}

module.exports = { getSessionReply };

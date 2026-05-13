/**
 * Normalize inbound chat payloads from various client shapes (OpenAI-style, etc.).
 */

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
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg) continue;
    if (msg.role && msg.role !== "user") continue;
    const text = readMessageText(msg);
    if (text) return text;
  }
  return "";
}

function extractUserQuery(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const fromField =
    typeof body?.message === "string" ? body.message.trim() : "";
  const fromMessages = getLatestUserMessage(messages);
  return (fromField || fromMessages || "").trim();
}

function normalizeSessionId(sessionId) {
  if (sessionId == null) return null;
  const s = String(sessionId).trim();
  return s.length ? s : null;
}

module.exports = {
  readMessageText,
  getLatestUserMessage,
  extractUserQuery,
  normalizeSessionId,
};

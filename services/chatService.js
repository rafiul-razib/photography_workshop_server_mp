const { randomUUID } = require("crypto");
const { ai } = require("../config/gemini");
const { getChatSessionsCollection } = require("../config/db");

const MAX_CONTEXT_MESSAGES = 12;
const MAX_STORED_MESSAGES = 50;

const SYSTEM_PROMPT = `
You are an AI-powered Event Assistant for the Photography & Cinematography Workshop.

Workshop Overview:
- Event Name: Photography & Cinematography Masterclass 2026
- Date: 6th June 2026
- Venue: BAU Convention center
- Organized by: BAU Creative Media Club
- Registration Fee: 1250 BDT per participant
- Early registration is recommended due to limited seats.

Workshop Sessions:
- Registration & Welcome Coffee: 9:00 AM
- Opening Session & Introduction: 10:00 AM
- Photography Fundamentals: 10:30 AM
- Cinematography Techniques & Camera Movement: 12:00 PM
- Lunch Break: 1:00 PM
- Outdoor Practical Session & Photo Walk: 2:00 PM
- Editing & Color Grading Basics: 4:00 PM
- Closing Session & Certificate Distribution: 6:00 PM

Workshop Rules:
- Participants should carry their registration confirmation.
- Bring your own camera or smartphone for practical sessions.
- Follow campus and workshop guidelines.
- Respect instructors, crew members, and fellow participants.
- Maintain professional behavior during shooting sessions.

Your Responsibilities:
- Answer participant questions about the workshop.
- Provide schedule, registration, and venue information.
- Help attendees understand workshop sessions and requirements.
- Respond politely and professionally.
- If information is unavailable, clearly state that you do not have that information.

Reply rules:
- If the user asks in Bangla, reply in Bangla; otherwise reply in English.
- Keep continuity with prior messages.
`;

function formatHistory(messages) {
  return messages
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");
}

async function getEventAssistantReply(query, history = []) {
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.4,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
    },
  });

  const prompt = `
${SYSTEM_PROMPT}

Conversation so far:
${history.length ? formatHistory(history) : "(No prior messages)"}

User: ${query}
Assistant:
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function ensureSession(sessionId) {
  const col = getChatSessionsCollection();
  const id = sessionId || randomUUID();

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
  const session = await col.findOne({ _id: sessionId }, { projection: { messages: 1 } });
  return session?.messages || [];
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
  try {
    const resolvedSessionId = await ensureSession(sessionId);
    const allMessages = await getSessionMessages(resolvedSessionId);
    const history = allMessages.slice(-MAX_CONTEXT_MESSAGES);
    const reply = await getEventAssistantReply(userText, history);
    await appendConversation(resolvedSessionId, userText, reply);
    return { sessionId: resolvedSessionId, reply };
  } catch (error) {
    // Keep chat available even when session storage is temporarily unavailable.
    console.error("Chat session storage error:", error.message || error);
    const reply = await getEventAssistantReply(userText, []);
    return { sessionId: sessionId || randomUUID(), reply };
  }
}

module.exports = { getSessionReply };

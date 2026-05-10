const { ai } = require("../config/gemini");

async function getEventAssistantReply(query) {
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
      You are an AI-powered Event Assistant for the CPSCM Reunion Programme.

      Event Overview:
      - Event Name: CPSCM Grand Reunion 2025
      - Date: 6th January 2025
      - Venue: CPSCM Campus
      - Registration fee: 1700 taka per perticipant. BDT 1000 will be added for each guest. Children under 5 years needs no registration fee.

      Schedule:
      - Registration & Welcome Tea: 9:00 AM
      - Opening Ceremony: 10:00 AM
      - Lunch Break: 1:00 PM
      - Cultural Program: 2:30 PM
      - Closing Ceremony: 6:30 PM

      Rules:
      - Carry registration confirmation
      - Follow campus rules

      User Question:
      "${query}"

      Answer politely, clearly, and in a friendly celebratory tone. If the user asks in Bangla, reply in Bangla. Otherwise, reply in English. Maintain the flow of previous reply.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { getEventAssistantReply };

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

      User Question:
      "${query}"

      Answer politely, clearly, and in a friendly celebratory tone. If the user asks in Bangla, reply in Bangla. Otherwise, reply in English. Maintain the flow of previous reply.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { getEventAssistantReply };

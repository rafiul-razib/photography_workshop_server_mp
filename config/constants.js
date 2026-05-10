const port = process.env.PORT || 5000;

const SERVER_BASE_URL =
  process.env.SERVER_BASE_URL || "http://localhost:5000";
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "http://localhost:3000";

const REGISTRATION_AMOUNT = Number(process.env.REGISTRATION_AMOUNT) || 1250;

const CORS_ORIGINS = [
  "http://localhost:3000",
  "https://reunion-cpscm.vercel.app",
];

module.exports = {
  port,
  SERVER_BASE_URL,
  FRONTEND_BASE_URL,
  REGISTRATION_AMOUNT,
  CORS_ORIGINS,
};

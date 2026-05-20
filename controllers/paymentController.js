const { REGISTRATION_AMOUNT } = require("../config/constants");
const memberService = require("../services/memberService");
const {
  interestToPrefix,
  issueNextParticipantId,
} = require("../services/participantIdService");

const REQUIRED_FIELDS = [
  "fullName",
  "phone",
  "email",
  "photo",
  "bkashTransactionId",
  "interest",
];

function validateRegistrationPayload(payload) {
  const missing = REQUIRED_FIELDS.filter(
    (field) => !String(payload?.[field] || "").trim(),
  );

  if (missing.length) {
    return {
      ok: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    };
  }

  return { ok: true };
}

async function register(req, res) {
  const payload = req.body;

  try {
    const validation = validateRegistrationPayload(payload);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const bkashTransactionId = String(payload.bkashTransactionId).trim();
    const alreadyExists =
      await memberService.hasBkashTransactionId(bkashTransactionId);
    if (alreadyExists) {
      return res
        .status(409)
        .json({ message: "bkashTransactionId already registered" });
    }

    const prefix = interestToPrefix(payload);
    const participantId = await issueNextParticipantId(prefix);

    const member = {
      fullName: String(payload.fullName).trim(),
      phone: String(payload.phone).trim(),
      email: String(payload.email).trim(),
      photo: String(payload.photo).trim(),
      bkashTransactionId,
      interest: String(payload.interest).trim(),
      totalAmount: REGISTRATION_AMOUNT,
      paymentMethod: String(payload.paymentMethod || "bkash").trim(),
      paymentStatus: false,
      participantId,
    };

    await memberService.insertRegistrationMember(member);

    return res.status(201).json({
      message: "Registration saved successfully",
      participantId,
      fullName: member.fullName,
    });
  } catch (error) {
    console.error("Register error →", error);

    if (error?.code === 11000) {
      if (error?.keyPattern?.bkashTransactionId) {
        return res
          .status(409)
          .json({ message: "bkashTransactionId already registered" });
      }
      if (error?.keyPattern?.participantId) {
        return res.status(409).json({
          message: "participantId conflict, please try again",
        });
      }
    }

    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { register };

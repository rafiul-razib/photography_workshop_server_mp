const { getMembersCollection, getParticipantCountersCollection } = require("../config/db");

const MAX_SERIAL = 999999;

function normalizeInterestRaw(member) {
  const v =
    member?.interest ??
    member?.fieldOfInterest ??
    member?.track ??
    member?.focus ??
    "";
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? x : x?.label || x?.name || "")).join(" ");
  }
  if (typeof v === "object" && v !== null) {
    return String(v.label || v.name || v.value || "");
  }
  return String(v);
}

function interestToPrefix(member) {
  const s = normalizeInterestRaw(member).toLowerCase();
  if (
    s.includes("cinematography") ||
    s.includes("cinema") ||
    s.includes("cine") ||
    /\bcg\b/.test(s) ||
    s === "c"
  ) {
    return "CG";
  }
  if (
    s.includes("photography") ||
    s.includes("photo") ||
    /\bpg\b/.test(s) ||
    s === "p"
  ) {
    return "PG";
  }
  return "PG";
}

async function issueNextParticipantId(prefix) {
  const col = getParticipantCountersCollection();
  const result = await col.findOneAndUpdate(
    { _id: prefix },
    { $inc: { seq: 1 }, $set: { updatedAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );

  const doc = result?.value ?? result;
  const seq = doc?.seq;
  if (!Number.isFinite(seq) || seq < 1 || seq > MAX_SERIAL) {
    throw new Error("participant serial out of range");
  }
  return `${prefix}${String(seq).padStart(6, "0")}`;
}

/**
 * Idempotent: returns existing participantId or allocates a new one (PG/CG + 6-digit serial).
 */
async function ensureParticipantIdForTransaction(tranId) {
  const col = getMembersCollection();
  let user = await col.findOne({ transactionId: tranId });
  if (!user) {
    return { user: null, participantId: null };
  }
  if (user.participantId) {
    return { user, participantId: user.participantId };
  }

  const prefix = interestToPrefix(user);
  const participantId = await issueNextParticipantId(prefix);

  const upd = await col.updateOne(
    { transactionId: tranId, participantId: { $exists: false } },
    { $set: { participantId } },
  );

  if (upd.modifiedCount === 0) {
    user = await col.findOne({ transactionId: tranId });
    return { user, participantId: user?.participantId || null };
  }

  return { user: { ...user, participantId }, participantId };
}

module.exports = {
  interestToPrefix,
  issueNextParticipantId,
  ensureParticipantIdForTransaction,
};

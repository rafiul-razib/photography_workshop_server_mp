const { getMembersCollection } = require("../config/db");

async function findAllMembers() {
  const col = getMembersCollection();
  return col.find().toArray();
}

async function insertPendingMember(payload, amount, extra = {}) {
  const col = getMembersCollection();
  const finalOrder = {
    ...payload,
    totalAmount: amount,
    paymentStatus: false,
    ...extra,
  };
  const result = await col.insertOne(finalOrder);
  console.log("Inserted →", result.insertedId);
  return result;
}

async function insertRegistrationMember(member) {
  const col = getMembersCollection();
  const result = await col.insertOne(member);
  console.log("Inserted →", result.insertedId);
  return result;
}

async function hasBkashTransactionId(bkashTransactionId) {
  if (!bkashTransactionId) return false;
  const col = getMembersCollection();
  const count = await col.countDocuments(
    { bkashTransactionId },
    { limit: 1 },
  );
  return count > 0;
}

async function markPaymentSuccess(tranId, extraFields = {}) {
  const col = getMembersCollection();
  return col.updateOne(
    { transactionId: tranId },
    { $set: { paymentStatus: true, ...extraFields } },
  );
}

async function findMemberByTransactionId(tranId) {
  const col = getMembersCollection();
  return col.findOne({ transactionId: tranId });
}

async function hasTransactionId(tranId) {
  if (!tranId) return false;
  const col = getMembersCollection();
  const count = await col.countDocuments({ transactionId: tranId }, { limit: 1 });
  return count > 0;
}

async function findMemberByUserId(userId) {
  const col = getMembersCollection();
  return col.findOne({
    $or: [{ userId }, { participantId: userId }],
  });
}

async function findMemberByIdentifier(identifier) {
  const col = getMembersCollection();
  return col.findOne({
    $or: [
      { transactionId: identifier },
      { bkashTransactionId: identifier },
      { userId: identifier },
      { participantId: identifier },
    ],
  });
}

async function deleteMemberByTransactionId(tranId) {
  const col = getMembersCollection();
  return col.deleteOne({ transactionId: tranId });
}

async function markPaymentSuccessByUserId(userId, extraFields = {}) {
  const col = getMembersCollection();
  return col.updateOne(
    {
      $or: [{ userId }, { participantId: userId }],
    },
    { $set: { paymentStatus: true, ...extraFields } },
  );
}

async function markPaymentSuccessByIdentifier(identifier, extraFields = {}) {
  const col = getMembersCollection();
  return col.updateOne(
    {
      $or: [
        { transactionId: identifier },
        { bkashTransactionId: identifier },
        { userId: identifier },
        { participantId: identifier },
      ],
    },
    { $set: { paymentStatus: true, ...extraFields } },
  );
}

module.exports = {
  findAllMembers,
  insertPendingMember,
  insertRegistrationMember,
  markPaymentSuccess,
  markPaymentSuccessByUserId,
  markPaymentSuccessByIdentifier,
  findMemberByTransactionId,
  hasTransactionId,
  hasBkashTransactionId,
  findMemberByUserId,
  findMemberByIdentifier,
  deleteMemberByTransactionId,
};

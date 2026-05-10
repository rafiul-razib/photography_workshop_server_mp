const { getMembersCollection } = require("../config/db");

async function findAllMembers() {
  const col = getMembersCollection();
  return col.find().toArray();
}

async function insertPendingMember(payload, tranId, amount, extra = {}) {
  const col = getMembersCollection();
  const finalOrder = {
    ...payload,
    totalAmount: amount,
    paymentStatus: false,
    transactionId: tranId,
    ...extra,
  };
  const result = await col.insertOne(finalOrder);
  console.log("Inserted →", result.insertedId);
  return result;
}

async function markPaymentSuccess(tranId, extraFields = {}) {
  const col = getMembersCollection();
  return col.updateOne(
    { transactionId: tranId },
    { $set: { paymentStatus: true, ...extraFields } },
  );
}

async function setBkashPaymentPending(tranId, paymentID) {
  const col = getMembersCollection();
  return col.updateOne(
    { transactionId: tranId },
    { $set: { bkashPaymentID: paymentID } },
  );
}

async function findMemberByTransactionId(tranId) {
  const col = getMembersCollection();
  return col.findOne({ transactionId: tranId });
}

async function deleteMemberByTransactionId(tranId) {
  const col = getMembersCollection();
  return col.deleteOne({ transactionId: tranId });
}

module.exports = {
  findAllMembers,
  insertPendingMember,
  markPaymentSuccess,
  setBkashPaymentPending,
  findMemberByTransactionId,
  deleteMemberByTransactionId,
};

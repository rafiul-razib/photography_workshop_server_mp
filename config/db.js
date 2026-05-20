const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

function getMembersCollection() {
  return client.db("protikWorkshopDB").collection("allMembers");
}

function getChatSessionsCollection() {
  return client.db("protikWorkshopDB").collection("chatSessions");
}

function getParticipantCountersCollection() {
  return client.db("protikWorkshopDB").collection("participantCounters");
}

async function ensureDbIndexes() {
  const members = getMembersCollection();
  await members.createIndex(
    { transactionId: 1 },
    {
      unique: true,
      // Atlas/MongoDB partial indexes do not support $ne (maps to unsupported $not).
      partialFilterExpression: {
        transactionId: { $exists: true, $type: "string" },
      },
      name: "uniq_transaction_id",
    },
  );
  await members.createIndex(
    { bkashTransactionId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        bkashTransactionId: { $exists: true, $type: "string" },
      },
      name: "uniq_bkash_transaction_id",
    },
  );
  await members.createIndex(
    { participantId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        participantId: { $exists: true, $type: "string" },
      },
      name: "uniq_participant_id",
    },
  );
}

module.exports = {
  client,
  getMembersCollection,
  getChatSessionsCollection,
  getParticipantCountersCollection,
  ensureDbIndexes,
};

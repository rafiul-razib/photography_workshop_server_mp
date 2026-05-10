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
  return client.db("photographyWorkshopDB").collection("allMembers");
}

function getBkashTokenCollection() {
  return client.db("photographyWorkshopDB").collection("bkashTokens");
}

function getChatSessionsCollection() {
  return client.db("photographyWorkshopDB").collection("chatSessions");
}

function getParticipantCountersCollection() {
  return client.db("photographyWorkshopDB").collection("participantCounters");
}

module.exports = {
  client,
  getMembersCollection,
  getBkashTokenCollection,
  getChatSessionsCollection,
  getParticipantCountersCollection,
};

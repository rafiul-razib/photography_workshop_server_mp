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

module.exports = { client, getMembersCollection, getBkashTokenCollection };

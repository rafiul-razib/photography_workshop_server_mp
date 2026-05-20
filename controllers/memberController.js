const memberService = require("../services/memberService");

async function getAllMembers(req, res) {
  try {
    const result = await memberService.findAllMembers();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error fetching members" });
  }
}

async function verifyUser(req, res) {
  const identifier = req.params.identifier || req.params.transactionId;
  const result = await memberService.findMemberByIdentifier(identifier);
  res.send(result);
}

module.exports = { getAllMembers, verifyUser };

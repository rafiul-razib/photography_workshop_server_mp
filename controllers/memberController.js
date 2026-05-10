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
  const transId = req.params.transactionId;
  const result = await memberService.findMemberByTransactionId(transId);
  res.send(result);
}

module.exports = { getAllMembers, verifyUser };

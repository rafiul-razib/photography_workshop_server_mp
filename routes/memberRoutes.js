const express = require("express");
const memberController = require("../controllers/memberController");

const router = express.Router();

router.get("/allRegisteredMembers", memberController.getAllMembers);
router.get("/verifyUser/:transactionId", memberController.verifyUser);

module.exports = router;

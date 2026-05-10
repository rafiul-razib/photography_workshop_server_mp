const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/register", paymentController.register);

module.exports = router;

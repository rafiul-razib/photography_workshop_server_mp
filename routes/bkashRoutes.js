const express = require("express");
const {
  createBkashPayment,
  executeBkashPayment,
  bkashPaymentCallback,
} = require("../controllers/bkashController");

const router = express.Router();

router.get("/callback", bkashPaymentCallback);
router.post("/callback", bkashPaymentCallback);
router.post("/create", createBkashPayment);
router.get("/execute", executeBkashPayment);

module.exports = router;

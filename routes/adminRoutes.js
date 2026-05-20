const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.post(
  "/confirm-payment",
  requireAdmin,
  adminController.confirmPayment,
);

module.exports = router;

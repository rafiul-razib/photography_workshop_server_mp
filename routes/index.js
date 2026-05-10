const express = require("express");
const memberRoutes = require("./memberRoutes");
const chatRoutes = require("./chatRoutes");
const paymentRoutes = require("./paymentRoutes");
const bkashRoutes = require("./bkashRoutes");

const router = express.Router();

router.use(memberRoutes);
router.use(chatRoutes);
router.use(paymentRoutes);
router.use("/api/bkash", bkashRoutes);

module.exports = router;

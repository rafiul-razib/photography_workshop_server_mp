const express = require("express");
const memberRoutes = require("./memberRoutes");
const chatRoutes = require("./chatRoutes");
const paymentRoutes = require("./paymentRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use(memberRoutes);
router.use(chatRoutes);
router.use(paymentRoutes);
router.use("/admin", adminRoutes);

module.exports = router;

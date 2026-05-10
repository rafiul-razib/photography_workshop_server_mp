const { ObjectId } = require("mongodb");
const {
  REGISTRATION_AMOUNT,
  SERVER_BASE_URL,
} = require("../config/constants");
const memberService = require("../services/memberService");
const bkashConfig = require("../config/bkashConfig");
const {
  createPayment,
  isCreatePaymentSuccess,
} = require("../services/bkashServices");

async function register(req, res) {
  const tranId = new ObjectId().toString();
  const payload = req.body;

  try {
    await memberService.insertPendingMember(payload, tranId, REGISTRATION_AMOUNT);

    const callbackURL = `${SERVER_BASE_URL}/api/bkash/callback?orderId=${encodeURIComponent(tranId)}`;
    const reference = String(payload.phone || payload.email || "1").replace(
      /[<>&]/g,
      "",
    );

    const bkashRes = await createPayment(bkashConfig, {
      amount: REGISTRATION_AMOUNT,
      callbackURL,
      orderID: tranId,
      reference,
    });

    if (!isCreatePaymentSuccess(bkashRes)) {
      await memberService.deleteMemberByTransactionId(tranId);
      return res.status(502).json({
        message: "bKash payment session could not be created",
        details: bkashRes,
      });
    }

    if (bkashRes.paymentID) {
      await memberService.setBkashPaymentPending(tranId, bkashRes.paymentID);
    }

    return res.send({ url: bkashRes.bkashURL });
  } catch (error) {
    console.error("Register error →", error);
    await memberService.deleteMemberByTransactionId(tranId).catch(() => {});
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { register };

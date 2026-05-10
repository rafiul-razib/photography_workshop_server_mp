const {
  createPayment,
  executePayment,
  isExecutePaymentSuccess,
} = require("../services/bkashServices");
const bkashConfig = require("../config/bkashConfig");
const { FRONTEND_BASE_URL } = require("../config/constants");
const memberService = require("../services/memberService");
const paymentService = require("../services/paymentService");
const { sendConfirmationEmail } = require("../services/emailService");

async function createBkashPayment(req, res) {
  try {
    const response = await createPayment(bkashConfig, req.body);
    if (response?.statusCode === "2065" || response?.statusCode === 2065) {
      return res.status(400).json(response);
    }
    return res.json(response);
  } catch (error) {
    console.error("bKash create error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Payment creation failed",
      details: error.response?.data || error.message,
    });
  }
}

async function executeBkashPayment(req, res) {
  try {
    const { paymentID } = req.query;
    if (!paymentID) {
      return res.status(400).json({ message: "paymentID query required" });
    }

    const response = await executePayment(bkashConfig, paymentID);
    return res.json(response);
  } catch (error) {
    console.error("bKash execute error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Payment execution failed",
      details: error.response?.data || error.message,
    });
  }
}

/**
 * Browser redirect from bKash after checkout (success / failure / cancel).
 * Query: orderId (our registration id), paymentID, status (success | failure | cancel), …
 */
async function bkashPaymentCallback(req, res) {
  const orderId = req.query.orderId || req.body?.orderId;
  const paymentID = req.query.paymentID || req.body?.paymentID;
  const status = String(req.query.status || req.body?.status || "").toLowerCase();

  if (!orderId) {
    return res.status(400).send("Missing orderId");
  }

  const failRedirect = () =>
    res.redirect(
      `${FRONTEND_BASE_URL}/paymentConfirmation/fail/${encodeURIComponent(orderId)}`,
    );
  const successRedirect = () =>
    res.redirect(
      `${FRONTEND_BASE_URL}/paymentConfirmation/success/${encodeURIComponent(orderId)}`,
    );

  try {
    const existing = await memberService.findMemberByTransactionId(orderId);
    if (existing?.paymentStatus) {
      return successRedirect();
    }

    if (status === "failure" || status === "cancel") {
      await memberService.deleteMemberByTransactionId(orderId);
      return failRedirect();
    }

    if (status !== "success") {
      await memberService.deleteMemberByTransactionId(orderId);
      return failRedirect();
    }

    if (!paymentID) {
      return res.status(400).send("Missing paymentID");
    }

    const exec = await executePayment(bkashConfig, paymentID);

    if (!isExecutePaymentSuccess(exec)) {
      console.error("bKash execute did not complete:", exec);
      return res.redirect(
        `${FRONTEND_BASE_URL}/paymentConfirmation/fail/${encodeURIComponent(orderId)}?reason=payment_incomplete`,
      );
    }

    const updateResult = await memberService.markPaymentSuccess(orderId, {
      bkashTrxID: exec.trxID,
      bkashPaymentID: paymentID,
      paymentProvider: "bkash",
    });

    if (updateResult.modifiedCount === 0) {
      const user = await memberService.findMemberByTransactionId(orderId);
      if (user?.paymentStatus) {
        return successRedirect();
      }
      return failRedirect();
    }

    const user = await memberService.findMemberByTransactionId(orderId);
    const qrImageURL = await paymentService.createVerifyQrDataUrl(
      FRONTEND_BASE_URL,
      orderId,
    );
    if (user) {
      await sendConfirmationEmail(
        user.email,
        user.fullName,
        orderId,
        qrImageURL,
      );
    }

    return successRedirect();
  } catch (error) {
    console.error("bKash callback error:", error.response?.data || error.message);
    return res.redirect(
      `${FRONTEND_BASE_URL}/paymentConfirmation/fail/${encodeURIComponent(orderId)}?reason=server_error`,
    );
  }
}

module.exports = {
  createBkashPayment,
  executeBkashPayment,
  bkashPaymentCallback,
};

const { FRONTEND_BASE_URL } = require("../config/constants");
const memberService = require("../services/memberService");
const paymentService = require("../services/paymentService");
const { sendConfirmationEmail } = require("../services/emailService");

async function confirmPayment(req, res) {
  const transactionId = req.body?.transactionId || req.params?.transactionId;
  const bkashTransactionId = req.body?.bkashTransactionId;
  const userId =
    req.body?.userId || req.params?.userId || req.body?.participantId;
  const identifier =
    transactionId || bkashTransactionId || userId || req.body?.participantId;

  if (!identifier) {
    return res.status(400).json({
      message:
        "participantId, bkashTransactionId, transactionId, or userId is required",
    });
  }

  try {
    const existing = await memberService.findMemberByIdentifier(identifier);
    if (!existing) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (existing.paymentStatus) {
      return res.json({
        message: "Payment already confirmed",
        transactionId: existing.transactionId || null,
        userId: existing.userId || existing.participantId || null,
        participantId: existing.participantId || null,
        paymentStatus: true,
      });
    }

    const updateResult = await memberService.markPaymentSuccessByIdentifier(
      identifier,
      {
        paymentProvider: "manual",
        confirmedAt: new Date(),
      },
    );

    if (updateResult.modifiedCount === 0) {
      const user = await memberService.findMemberByIdentifier(identifier);
      if (user?.paymentStatus) {
        return res.json({
          message: "Payment already confirmed",
          transactionId: user.transactionId || null,
          userId: user.userId || user.participantId || null,
          participantId: user.participantId || null,
          paymentStatus: true,
        });
      }
      return res.status(500).json({ message: "Could not confirm payment" });
    }

    const user = await memberService.findMemberByIdentifier(identifier);
    const participantId = user?.participantId || user?.userId || null;

    if (!user?.email) {
      return res.status(422).json({
        message: "Payment confirmed but user email is missing",
        transactionId: user?.bkashTransactionId || user?.transactionId || null,
        userId: user?.userId || user?.participantId || null,
        participantId,
        paymentStatus: true,
        emailSent: false,
      });
    }

    try {
      const verifyPathId =
        user.participantId ||
        user.userId ||
        user.bkashTransactionId ||
        user.transactionId;
      const qrImageURL = await paymentService.createVerifyQrDataUrl(
        FRONTEND_BASE_URL,
        verifyPathId,
      );
      await sendConfirmationEmail(
        user.email,
        user.fullName,
        user,
        qrImageURL,
        participantId,
      );
    } catch (emailError) {
      console.error("Confirmation email error →", emailError);
      return res.status(502).json({
        message: "Payment confirmed but confirmation email failed to send",
        transactionId: user?.bkashTransactionId || user?.transactionId || null,
        userId: user?.userId || user?.participantId || null,
        participantId,
        paymentStatus: true,
        emailSent: false,
      });
    }

    return res.json({
      message: "Payment confirmed",
      transactionId: user?.bkashTransactionId || user?.transactionId || null,
      userId: user?.userId || user?.participantId || null,
      participantId,
      paymentStatus: true,
      emailSent: true,
    });
  } catch (error) {
    console.error("Confirm payment error →", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = { confirmPayment };

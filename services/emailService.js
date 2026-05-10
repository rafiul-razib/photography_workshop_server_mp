const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendConfirmationEmail(
  toEmail,
  name,
  tranId,
  qrImageURL,
  participantId,
) {
  const participantLine = participantId
    ? `<p style="margin: 8px 0 0; color: #222;"><strong>Participant ID:</strong> ${participantId}</p>`
    : "";

  return transporter.sendMail({
    from: `FrameX Workshop <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject:
      "Registration Confirmed – Photography & Cinematography Workshop 🎬📸",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">

        <h2 style="color: #111;">
          Hello ${name},
        </h2>

        <p style="color: #444; line-height: 1.7;">
          Your registration for the <strong>Photography & Cinematography Workshop</strong> has been successfully confirmed.
        </p>

        <p style="color: #444; line-height: 1.7;">
          Get ready to explore storytelling through lenses, lighting, composition, and cinematic creativity with fellow creators and industry professionals.
        </p>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #222;">
            <strong>Transaction ID:</strong> ${tranId}
          </p>
          ${participantLine}
        </div>

        <p style="color: #444; line-height: 1.7;">
          Please keep the following QR code with you. It will be required for workshop entry and check-in.
        </p>

        <div style="text-align: center; margin: 20px 0;">
          <img 
            src="cid:qrImage" 
            style="width:220px; height:auto; border-radius: 10px;" 
          />
        </div>

        <p style="color: #444; line-height: 1.7;">
          We’re excited to have you join us and can’t wait to see the stories you capture.
        </p>

        <p style="margin-top: 30px; color: #444; line-height: 1.6;">
          Best regards,<br/>
          <strong>FrameX Workshop Team</strong>
        </p>

      </div>
    `,
    attachments: [
      {
        filename: "qr.png",
        content: qrImageURL.split("base64,")[1],
        encoding: "base64",
        cid: "qrImage",
      },
    ],
  });
}

module.exports = { sendConfirmationEmail };

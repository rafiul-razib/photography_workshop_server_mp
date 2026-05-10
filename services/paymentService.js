const QRCode = require("qrcode");

async function createVerifyQrDataUrl(frontendBaseUrl, tranId) {
  const verifyURL = `${frontendBaseUrl}/verifyUser/${tranId}`;
  return QRCode.toDataURL(verifyURL);
}

module.exports = {
  createVerifyQrDataUrl,
};

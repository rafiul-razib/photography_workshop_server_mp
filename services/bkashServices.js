const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { getBkashTokenCollection } = require("../config/db");

const TOKEN_DOC_ID = "bkash_grant_token";
const TOKEN_TTL_MS = 50 * 60 * 1000;

/**
 * @param {object} bkashConfig
 * @param {object} paymentDetails
 * @param {number} paymentDetails.amount
 * @param {string} paymentDetails.callbackURL
 * @param {string} [paymentDetails.orderID]
 * @param {string} [paymentDetails.reference]
 */
async function createPayment(bkashConfig, paymentDetails) {
  const { amount, callbackURL, orderID, reference } = paymentDetails;

  if (amount == null || amount === "") {
    return { statusCode: "2065", statusMessage: "amount required" };
  }
  if (Number(amount) < 1) {
    return { statusCode: "2065", statusMessage: "minimum amount 1" };
  }

  if (!callbackURL) {
    return { statusCode: "2065", statusMessage: "callbackURL required" };
  }

  try {
    const response = await axios.post(
      `${bkashConfig.base_url}/tokenized/checkout/create`,
      {
        mode: "0011",
        currency: "BDT",
        intent: "sale",
        amount: String(amount),
        callbackURL,
        payerReference: reference || "1",
        merchantInvoiceNumber: orderID || `Inv_${uuidv4().substring(0, 6)}`,
      },
      { headers: await authHeaders(bkashConfig) },
    );
    return response.data;
  } catch (e) {
    console.error("Create Bkash Payment Error:", e.response?.data || e.message);
    throw e;
  }
}

async function executePayment(bkashConfig, paymentID) {
  if (!paymentID) {
    throw new Error("paymentID is required");
  }
  try {
    const response = await axios.post(
      `${bkashConfig.base_url}/tokenized/checkout/execute`,
      { paymentID },
      { headers: await authHeaders(bkashConfig) },
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error from bkash executePayment:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

async function authHeaders(bkashConfig) {
  const token = await grantToken(bkashConfig);
  if (!token) {
    throw new Error("bKash grant token failed");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    authorization: token,
    "x-app-key": bkashConfig.app_key,
  };
}

function isTokenStale(doc) {
  if (!doc || !doc.updatedAt) return true;
  return doc.updatedAt.getTime() < Date.now() - TOKEN_TTL_MS;
}

async function grantToken(bkashConfig) {
  const col = getBkashTokenCollection();
  const findToken = await col.findOne({ _id: TOKEN_DOC_ID });

  if (!findToken || isTokenStale(findToken)) {
    return setToken(bkashConfig);
  }

  return findToken.auth_token;
}

async function setToken(bkashConfig) {
  const response = await axios.post(
    `${bkashConfig.base_url}/tokenized/checkout/token/grant`,
    tokenParameters(bkashConfig),
    { headers: tokenHeaders(bkashConfig) },
  );

  const id_token = response?.data?.id_token;
  if (!id_token) {
    throw new Error(
      `bKash token grant failed: ${JSON.stringify(response?.data)}`,
    );
  }

  const col = getBkashTokenCollection();
  await col.updateOne(
    { _id: TOKEN_DOC_ID },
    { $set: { auth_token: id_token, updatedAt: new Date() } },
    { upsert: true },
  );

  return id_token;
}

function tokenParameters(bkashConfig) {
  return {
    app_key: bkashConfig.app_key,
    app_secret: bkashConfig.app_secret,
  };
}

function tokenHeaders(bkashConfig) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    username: bkashConfig.username,
    password: bkashConfig.password,
  };
}

function isCreatePaymentSuccess(data) {
  if (!data || String(data.statusCode) !== "0000") return false;
  return Boolean(data.bkashURL);
}

function isExecutePaymentSuccess(data) {
  if (!data || String(data.statusCode) !== "0000") return false;
  return data.transactionStatus === "Completed";
}

module.exports = {
  createPayment,
  executePayment,
  isCreatePaymentSuccess,
  isExecutePaymentSuccess,
};

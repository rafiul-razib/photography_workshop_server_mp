/**
 * bKash tokenized checkout.
 * Env vars override defaults. If unset, public SANDBOX test credentials are used
 * (safe for local/dev only). For production, set BKASH_* in .env to live values.
 */
const SANDBOX_BASE_URL = "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
const SANDBOX_USERNAME = "sandboxTokenizedUser02";
const SANDBOX_PASSWORD = "sandboxTokenizedUser02@12345";
const SANDBOX_APP_KEY = "4f6o0cjiki2rfm34kfdadl1eqq";
const SANDBOX_APP_SECRET =
  "2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b";

module.exports = {
  base_url: process.env.BKASH_BASE_URL || SANDBOX_BASE_URL,
  username: process.env.BKASH_USERNAME || SANDBOX_USERNAME,
  password: process.env.BKASH_PASSWORD || SANDBOX_PASSWORD,
  app_key: process.env.BKASH_APP_KEY || SANDBOX_APP_KEY,
  app_secret: process.env.BKASH_APP_SECRET || SANDBOX_APP_SECRET,
};

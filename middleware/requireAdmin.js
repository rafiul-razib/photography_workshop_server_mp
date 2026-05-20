const crypto = require("crypto");
const { ADMIN_API_KEY } = require("../config/constants");

function extractAdminKey(req) {
  const headerKey = req.headers["x-admin-key"];
  if (headerKey) {
    return String(headerKey);
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }

  return null;
}

function requireAdmin(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({
      message: "Admin API is not configured (set ADMIN_API_KEY)",
    });
  }

  const provided = extractAdminKey(req);
  if (!provided) {
    return res.status(401).json({
      message: "Admin key required (x-admin-key header or Bearer token)",
    });
  }

  const expectedBuf = Buffer.from(ADMIN_API_KEY);
  const providedBuf = Buffer.from(provided);
  if (
    expectedBuf.length !== providedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, providedBuf)
  ) {
    return res.status(401).json({ message: "Invalid admin key" });
  }

  return next();
}

module.exports = { requireAdmin };

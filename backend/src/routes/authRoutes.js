const express = require("express");
const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");
const { requireAuth } = require("../middleware/auth");
const { requestOtp, verifyOtp } = require("../services/authService");
const { asyncRoute, fail, ok } = require("../utils/api");
const { sessionCookieOptions } = require("../utils/sessionCookie");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/request-otp", authLimiter, asyncRoute(async (request, response) => {
  try {
    return ok(response, await requestOtp(request.body.phone));
  } catch (error) {
    console.error("WhatsApp OTP delivery failed:", error.message);
    return fail(response, 503, "OTP_DELIVERY_FAILED", "OTP delivery is temporarily unavailable.");
  }
}));

router.post("/verify-otp", authLimiter, asyncRoute(async (request, response) => {
  const result = await verifyOtp(request.body.phone, request.body.otp, request.get("user-agent"));
  if (result.error) return fail(response, ...result.error);

  response.cookie(env.cookieName, result.token, sessionCookieOptions(result.expiresAt));
  return ok(response, { member: result.member });
}));

router.get("/me", requireAuth, (request, response) => ok(response, { member: request.publicMember }));

router.post("/logout", requireAuth, asyncRoute(async (request, response) => {
  request.session.revokedAt = new Date();
  await request.session.save();
  response.clearCookie(env.cookieName, sessionCookieOptions());
  return ok(response, { message: "Signed out." });
}));

module.exports = router;

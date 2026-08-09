const crypto = require("node:crypto");
const Member = require("../models/Member"); const OtpChallenge = require("../models/OtpChallenge"); const Session = require("../models/Session");
const { env } = require("../config/env"); const { normalizePhone } = require("../utils/phone"); const { sendOtp } = require("./whatsappService");
const digest = value => crypto.createHash("sha256").update(String(value)).digest("hex");
const publicMember = member => ({ id: String(member._id), name: member.name, phone: member.phone, avatarUrl: member.avatarUrl, color: member.color, role: member.role });

async function requestOtp(rawPhone) {
  const phone = normalizePhone(rawPhone); const generic = { message: "If this number is approved, an OTP will arrive on WhatsApp." };
  if (!phone) return generic;
  const member = await Member.findOne({ phone, status: "active" }); if (!member) return generic;
  const latest = await OtpChallenge.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 });
  if (latest?.resendAfter > new Date()) return generic;
  const otp = String(crypto.randomInt(100000, 1000000)); const now = Date.now();
  const challenge = await OtpChallenge.create({ phone, member: member._id, otpHash: digest(otp), expiresAt: new Date(now + env.otpTtlMinutes * 60000), resendAfter: new Date(now + env.otpResendSeconds * 1000) });
  try { await sendOtp(phone, otp); } catch (error) { await challenge.deleteOne(); throw error; }
  return generic;
}

async function verifyOtp(rawPhone, otp, userAgent) {
  const phone = normalizePhone(rawPhone); if (!phone || !/^\d{6}$/.test(String(otp || ""))) return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] };
  const challenge = await OtpChallenge.findOne({ phone, consumedAt: null }).sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= env.otpMaxAttempts) return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] };
  challenge.attempts += 1;
  if (!crypto.timingSafeEqual(Buffer.from(challenge.otpHash), Buffer.from(digest(otp)))) { await challenge.save(); return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] }; }
  const member = await Member.findOne({ _id: challenge.member, status: "active" }); if (!member) return { error: [403, "ACCESS_DENIED", "Access is not available."] };
  challenge.consumedAt = new Date(); await challenge.save();
  const token = crypto.randomBytes(32).toString("hex"); const expiresAt = new Date(Date.now() + env.sessionTtlDays * 86400000);
  await Session.create({ member: member._id, tokenHash: digest(token), expiresAt, userAgent: String(userAgent || "").slice(0, 300) });
  member.lastLoginAt = new Date(); await member.save(); return { token, expiresAt, member: publicMember(member) };
}
module.exports = { digest, publicMember, requestOtp, verifyOtp };

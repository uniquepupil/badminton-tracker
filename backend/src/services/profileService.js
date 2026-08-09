const crypto = require("node:crypto");
const { env } = require("../config/env");
const Member = require("../models/Member");
const OtpChallenge = require("../models/OtpChallenge");
const { digest } = require("./authService");
const { sendOtp } = require("./whatsappService");
const { normalizePhone } = require("../utils/phone");

async function updateProfile(member, payload = {}) {
  const name = String(payload.name || "").trim();
  const color = String(payload.color || "").trim();
  if (name.length < 2 || name.length > 60) return { error: [400, "INVALID_NAME", "Name must be between 2 and 60 characters."] };
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: [400, "INVALID_COLOR", "Choose a valid profile color."] };
  member.name = name;
  member.color = color;
  await member.save();
  return { member };
}

async function requestPhoneChange(member, rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { error: [400, "INVALID_PHONE", "Enter a valid mobile number."] };
  if (phone === member.phone) return { error: [400, "PHONE_UNCHANGED", "Enter a different mobile number."] };
  if (await Member.exists({ phone, _id: { $ne: member._id } })) return { error: [409, "PHONE_IN_USE", "This mobile number is already assigned to a member."] };

  const latest = await OtpChallenge.findOne({ member: member._id, phone, purpose: "phone_change", consumedAt: null }).sort({ createdAt: -1 });
  if (latest?.resendAfter > new Date()) return { error: [429, "OTP_COOLDOWN", "Please wait before requesting another OTP."] };

  const otp = String(crypto.randomInt(100000, 1000000));
  const now = Date.now();
  const challenge = await OtpChallenge.create({
    member: member._id,
    phone,
    purpose: "phone_change",
    otpHash: digest(otp),
    expiresAt: new Date(now + env.otpTtlMinutes * 60000),
    resendAfter: new Date(now + env.otpResendSeconds * 1000),
  });
  try {
    await sendOtp(phone, otp);
  } catch (error) {
    await challenge.deleteOne();
    throw error;
  }
  return { phone, message: "Verification OTP sent to the new WhatsApp number." };
}

async function verifyPhoneChange(member, rawPhone, otp) {
  const phone = normalizePhone(rawPhone);
  if (!phone || !/^\d{6}$/.test(String(otp || ""))) return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] };
  const challenge = await OtpChallenge.findOne({ member: member._id, phone, purpose: "phone_change", consumedAt: null }).sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= env.otpMaxAttempts) return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] };

  challenge.attempts += 1;
  const expected = Buffer.from(challenge.otpHash);
  const provided = Buffer.from(digest(otp));
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    await challenge.save();
    return { error: [400, "INVALID_OTP", "The OTP is invalid or expired."] };
  }
  if (await Member.exists({ phone, _id: { $ne: member._id } })) return { error: [409, "PHONE_IN_USE", "This mobile number is already assigned to a member."] };

  challenge.consumedAt = new Date();
  member.phone = phone;
  await Promise.all([challenge.save(), member.save()]);
  return { member, message: "Mobile number verified and updated." };
}

module.exports = { requestPhoneChange, updateProfile, verifyPhoneChange };

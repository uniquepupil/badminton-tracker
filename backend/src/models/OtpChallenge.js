const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  phone: { type: String, required: true, index: true }, member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
  otpHash: { type: String, required: true }, purpose: { type: String, default: "login" },
  attempts: { type: Number, default: 0 }, expiresAt: { type: Date, required: true, index: { expires: 0 } },
  resendAfter: { type: Date, required: true }, consumedAt: Date,
}, { timestamps: true });
module.exports = mongoose.model("OtpChallenge", schema);

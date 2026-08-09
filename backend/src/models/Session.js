const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date, userAgent: String,
}, { timestamps: true });
module.exports = mongoose.model("Session", schema);

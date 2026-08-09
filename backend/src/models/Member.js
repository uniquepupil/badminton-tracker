const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  phone: { type: String, required: true, unique: true, index: true },
  avatarUrl: { type: String, default: "" },
  avatarStorageKey: { type: String, default: "" },
  avatarContentType: { type: String, default: "" },
  color: { type: String, default: "#84cc16" },
  role: { type: String, enum: ["member", "admin"], default: "member" },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  lastLoginAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Member", schema);

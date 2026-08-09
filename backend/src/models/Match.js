const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  sideA: { type: Number, required: true },
  sideB: { type: Number, required: true },
}, { _id: false });

const editSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
  at: { type: Date, default: Date.now },
  action: { type: String, enum: ["created", "edited"] },
}, { _id: false });

const photoSchema = new mongoose.Schema({
  storageKey: { type: String, required: true },
  contentType: { type: String, required: true },
  fileName: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const schema = new mongoose.Schema({
  format: { type: String, enum: ["1v1", "2v2", "2v1"], required: true, index: true },
  sideA: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true }],
  sideB: [{ type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true }],
  games: { type: [gameSchema], required: true },
  winner: { type: String, enum: ["A", "B"], required: true },
  isCustom: { type: Boolean, default: false, index: true },
  note: { type: String, trim: true, maxlength: 300, default: "" },
  photos: { type: [photoSchema], default: [] },
  playedAt: { type: Date, required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
  editHistory: [editSchema],
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
}, { timestamps: true });

module.exports = mongoose.model("Match", schema);

const express = require("express");
const mongoose = require("mongoose");
const Match = require("../models/Match");
const Member = require("../models/Member");
const { requireAuth } = require("../middleware/auth");
const { deleteImage, putImage, streamImage } = require("../services/imageStorageService");
const { matchQuery } = require("../services/statisticsService");
const { asyncRoute, fail, ok } = require("../utils/api");
const { safeFileName, storageKey, validateImagePayload } = require("../utils/imageUpload");
const { evaluateMatch } = require("../utils/scoring");

const router = express.Router();
router.use(requireAuth);
const populate = (query) => query.populate("sideA sideB createdBy", "name color avatarUrl avatarStorageKey role");

function inputPayload(body) {
  return { format: body.format, sideA: body.sideA, sideB: body.sideB, games: body.games, isCustom: Boolean(body.isCustom) };
}

function matchView(value) {
  const match = typeof value.toObject === "function" ? value.toObject() : value;
  match.photos = (match.photos || []).map(({ storageKey: omitted, ...photo }) => ({
    ...photo,
    url: `/api/matches/${match._id}/photos/${photo._id}`,
  }));
  return match;
}

async function validateMembers(ids) {
  if (ids.some((id) => !mongoose.isValidObjectId(id))) return false;
  return await Member.countDocuments({ _id: { $in: ids }, status: "active" }) === ids.length;
}

function canManage(match, member) {
  return String(match.createdBy?._id || match.createdBy) === String(member._id) || member.role === "admin";
}

router.get("/", asyncRoute(async (request, response) => {
  const query = matchQuery(request.query);
  if (request.query.date) {
    query.playedAt = { $gte: new Date(`${request.query.date}T00:00:00`), $lte: new Date(`${request.query.date}T23:59:59.999`) };
  }
  const matches = await populate(Match.find(query)).sort({ playedAt: -1 }).limit(Math.min(Number(request.query.limit) || 100, 200)).lean();
  return ok(response, { matches: matches.map(matchView) });
}));

router.get("/:id", asyncRoute(async (request, response) => {
  const match = await populate(Match.findOne({ _id: request.params.id, deletedAt: null })).lean();
  return match ? ok(response, { match: matchView(match) }) : fail(response, 404, "MATCH_NOT_FOUND", "Match not found.");
}));

router.post("/", asyncRoute(async (request, response) => {
  const evaluated = evaluateMatch(inputPayload(request.body));
  if (evaluated.error) return fail(response, 400, "INVALID_SCORE", evaluated.error);
  if (!await validateMembers([...evaluated.sideA, ...evaluated.sideB])) return fail(response, 400, "INVALID_PLAYERS", "Choose active players.");
  const match = await Match.create({ ...evaluated, format: request.body.format, isCustom: Boolean(request.body.isCustom), note: request.body.note || "", playedAt: request.body.playedAt ? new Date(request.body.playedAt) : new Date(), createdBy: request.member._id, editHistory: [{ member: request.member._id, action: "created" }] });
  await populate(match);
  return ok(response, { match: matchView(match) }, 201);
}));

router.patch("/:id", asyncRoute(async (request, response) => {
  const match = await Match.findOne({ _id: request.params.id, deletedAt: null });
  if (!match) return fail(response, 404, "MATCH_NOT_FOUND", "Match not found.");
  if (!canManage(match, request.member)) return fail(response, 403, "FORBIDDEN", "Only the creator or admin may edit this match.");
  const evaluated = evaluateMatch(inputPayload(request.body));
  if (evaluated.error) return fail(response, 400, "INVALID_SCORE", evaluated.error);
  if (!await validateMembers([...evaluated.sideA, ...evaluated.sideB])) return fail(response, 400, "INVALID_PLAYERS", "Choose active players.");
  Object.assign(match, evaluated, { format: request.body.format, isCustom: Boolean(request.body.isCustom), note: request.body.note || "", playedAt: request.body.playedAt ? new Date(request.body.playedAt) : match.playedAt });
  match.editHistory.push({ member: request.member._id, action: "edited" });
  await match.save();
  await populate(match);
  return ok(response, { match: matchView(match) });
}));

router.post("/:id/photos", asyncRoute(async (request, response) => {
  const match = await Match.findOne({ _id: request.params.id, deletedAt: null });
  if (!match) return fail(response, 404, "MATCH_NOT_FOUND", "Match not found.");
  if (!canManage(match, request.member)) return fail(response, 403, "FORBIDDEN", "Only the match creator or admin may add photos.");
  if (match.photos.length >= 5) return fail(response, 400, "PHOTO_LIMIT", "A match can have up to 5 photos.");
  const validation = validateImagePayload(request.body || {});
  if (validation.error) return fail(response, 400, "INVALID_IMAGE", validation.error);
  const fileName = safeFileName(request.body.fileName, validation.contentType);
  const key = storageKey("matches", match._id, validation.contentType);
  await putImage({ key, buffer: validation.buffer, contentType: validation.contentType, metadata: { matchid: match._id, uploadedby: request.member._id, originalfilename: fileName } });
  match.photos.push({ storageKey: key, contentType: validation.contentType, fileName, size: validation.buffer.length, uploadedBy: request.member._id });
  await match.save();
  return ok(response, { match: matchView(match) }, 201);
}));

router.get("/:id/photos/:photoId", asyncRoute(async (request, response) => {
  const match = await Match.findOne({ _id: request.params.id, deletedAt: null });
  const photo = match?.photos.id(request.params.photoId);
  if (!photo) return fail(response, 404, "PHOTO_NOT_FOUND", "Match photo not found.");
  return streamImage(response, photo.storageKey, photo.contentType);
}));

router.delete("/:id/photos/:photoId", asyncRoute(async (request, response) => {
  const match = await Match.findOne({ _id: request.params.id, deletedAt: null });
  if (!match) return fail(response, 404, "MATCH_NOT_FOUND", "Match not found.");
  if (!canManage(match, request.member)) return fail(response, 403, "FORBIDDEN", "Only the match creator or admin may remove photos.");
  const photo = match.photos.id(request.params.photoId);
  if (!photo) return fail(response, 404, "PHOTO_NOT_FOUND", "Match photo not found.");
  const key = photo.storageKey;
  photo.deleteOne();
  await match.save();
  await deleteImage(key).catch((error) => console.error("Match photo cleanup failed:", error.message));
  return ok(response, { match: matchView(match) });
}));

router.delete("/:id", asyncRoute(async (request, response) => {
  if (request.member.role !== "admin") return fail(response, 403, "ADMIN_REQUIRED", "Only an admin may delete matches.");
  const match = await Match.findOne({ _id: request.params.id, deletedAt: null });
  if (!match) return fail(response, 404, "MATCH_NOT_FOUND", "Match not found.");
  match.deletedAt = new Date();
  match.deletedBy = request.member._id;
  await match.save();
  return ok(response, { message: "Match deleted." });
}));

module.exports = router;

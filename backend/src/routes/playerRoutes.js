const express = require("express");
const Member = require("../models/Member");
const { requireAuth } = require("../middleware/auth");
const { deleteImage, putImage, streamImage } = require("../services/imageStorageService");
const { playerProfile } = require("../services/statisticsService");
const { asyncRoute, fail, ok } = require("../utils/api");
const { safeFileName, storageKey, validateImagePayload } = require("../utils/imageUpload");

const router = express.Router();
router.use(requireAuth);

function playerView(member) {
  const id = String(member._id);
  return {
    id,
    name: member.name,
    color: member.color,
    role: member.role,
    avatarUrl: member.avatarStorageKey ? `/api/players/${id}/photo` : member.avatarUrl,
  };
}

router.get("/", asyncRoute(async (request, response) => {
  const members = await Member.find({ status: "active" }).sort({ name: 1 }).lean();
  return ok(response, { players: members.map(playerView) });
}));

router.post("/me/photo", asyncRoute(async (request, response) => {
  const validation = validateImagePayload(request.body || {});
  if (validation.error) return fail(response, 400, "INVALID_IMAGE", validation.error);

  const fileName = safeFileName(request.body.fileName, validation.contentType);
  const key = storageKey("profiles", request.member._id, validation.contentType);
  await putImage({
    key,
    buffer: validation.buffer,
    contentType: validation.contentType,
    metadata: { memberid: request.member._id, originalfilename: fileName },
  });

  const previousKey = request.member.avatarStorageKey;
  request.member.avatarStorageKey = key;
  request.member.avatarContentType = validation.contentType;
  request.member.avatarUrl = "";
  await request.member.save();
  if (previousKey) await deleteImage(previousKey).catch((error) => console.error("Old avatar cleanup failed:", error.message));

  return ok(response, { member: playerView(request.member), message: "Profile photo updated." });
}));

router.delete("/me/photo", asyncRoute(async (request, response) => {
  const previousKey = request.member.avatarStorageKey;
  request.member.avatarStorageKey = "";
  request.member.avatarContentType = "";
  request.member.avatarUrl = "";
  await request.member.save();
  if (previousKey) await deleteImage(previousKey).catch((error) => console.error("Avatar cleanup failed:", error.message));
  return ok(response, { member: playerView(request.member), message: "Profile photo removed." });
}));

router.get("/:id/photo", asyncRoute(async (request, response) => {
  const member = await Member.findOne({ _id: request.params.id, status: "active" });
  if (!member?.avatarStorageKey) return fail(response, 404, "PHOTO_NOT_FOUND", "Profile photo not found.");
  return streamImage(response, member.avatarStorageKey, member.avatarContentType);
}));

router.get("/:id", asyncRoute(async (request, response) => {
  const profile = await playerProfile(request.params.id);
  return profile ? ok(response, { profile }) : fail(response, 404, "PLAYER_NOT_FOUND", "Player not found.");
}));

module.exports = router;

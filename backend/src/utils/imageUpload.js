const crypto = require("node:crypto");
const path = require("node:path");
const { env } = require("../config/env");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

function parseBase64Image(value) {
  const base64 = String(value || "").includes(",") ? String(value).split(",").pop() : value;
  return base64 ? Buffer.from(base64, "base64") : null;
}

function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return "";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "";
}

function validateImagePayload({ dataBase64, contentType }) {
  const normalizedType = String(contentType || "").toLowerCase();
  const buffer = parseBase64Image(dataBase64);
  if (!ALLOWED_IMAGE_TYPES.has(normalizedType) || !buffer?.length) return { error: "Choose a valid JPG, PNG, or WEBP image." };
  if (detectImageType(buffer) !== normalizedType) return { error: "The uploaded image content does not match its file type." };
  if (buffer.length > env.imageUploadMaxBytes) return { error: `Image is too large. Maximum size is ${Math.round(env.imageUploadMaxBytes / 1048576)} MB.` };
  return { buffer, contentType: normalizedType };
}

function storageKey(scope, ownerId, contentType) {
  const safeScope = String(scope).replace(/[^a-z0-9-]/gi, "-");
  const safeOwner = String(ownerId).replace(/[^a-z0-9-]/gi, "-");
  return `${env.s3BadmintonPrefix}/${safeScope}/${safeOwner}/${crypto.randomUUID()}${EXTENSIONS[contentType]}`;
}

function safeFileName(value, contentType) {
  const base = path.basename(String(value || "photo")).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
  return base || `photo${EXTENSIONS[contentType]}`;
}

module.exports = { safeFileName, storageKey, validateImagePayload };

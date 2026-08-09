const { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { env } = require("../config/env");

let client;

function getClient() {
  if (!env.s3Region || !env.s3Bucket) throw new Error("S3 image storage is not configured.");
  if (!client) client = new S3Client({ region: env.s3Region });
  return client;
}

async function putImage({ key, buffer, contentType, metadata = {} }) {
  await getClient().send(new PutObjectCommand({
    Bucket: env.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "private, max-age=86400",
    Metadata: Object.fromEntries(Object.entries(metadata).map(([name, value]) => [name, String(value || "").replace(/[^\x20-\x7E]/g, "-").slice(0, 200)])),
  }));
}

function getImage(key) {
  return getClient().send(new GetObjectCommand({ Bucket: env.s3Bucket, Key: key }));
}

function deleteImage(key) {
  if (!key) return Promise.resolve();
  return getClient().send(new DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
}

async function streamImage(response, key, fallbackContentType) {
  const object = await getImage(key);
  response.set({
    "Content-Type": object.ContentType || fallbackContentType || "application/octet-stream",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  object.Body.pipe(response);
}

module.exports = { deleteImage, putImage, streamImage };

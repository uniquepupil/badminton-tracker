const test = require("node:test");
const assert = require("node:assert/strict");
const { validateImagePayload } = require("../src/utils/imageUpload");

test("accepts an image when its declared type matches its magic bytes", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const result = validateImagePayload({ contentType: "image/jpeg", dataBase64: jpeg.toString("base64") });
  assert.equal(result.contentType, "image/jpeg");
  assert.deepEqual(result.buffer, jpeg);
});

test("rejects disguised and unsupported uploads", () => {
  const text = Buffer.from("this is not an image");
  assert.ok(validateImagePayload({ contentType: "image/jpeg", dataBase64: text.toString("base64") }).error);
  assert.ok(validateImagePayload({ contentType: "image/svg+xml", dataBase64: text.toString("base64") }).error);
});

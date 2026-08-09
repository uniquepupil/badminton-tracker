const test = require("node:test");
const assert = require("node:assert/strict");

test("production sessions use cookies that work across frontend and API domains", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSameSite = process.env.SESSION_SAME_SITE;
  const previousSecure = process.env.SESSION_SECURE;

  process.env.NODE_ENV = "production";
  delete process.env.SESSION_SAME_SITE;
  delete process.env.SESSION_SECURE;

  delete require.cache[require.resolve("../src/config/env")];
  delete require.cache[require.resolve("../src/utils/sessionCookie")];
  const { sessionCookieOptions } = require("../src/utils/sessionCookie");
  const options = sessionCookieOptions(new Date("2030-01-01T00:00:00.000Z"));

  assert.equal(options.sameSite, "none");
  assert.equal(options.secure, true);
  assert.equal(options.httpOnly, true);

  if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  if (previousSameSite === undefined) delete process.env.SESSION_SAME_SITE; else process.env.SESSION_SAME_SITE = previousSameSite;
  if (previousSecure === undefined) delete process.env.SESSION_SECURE; else process.env.SESSION_SECURE = previousSecure;
});

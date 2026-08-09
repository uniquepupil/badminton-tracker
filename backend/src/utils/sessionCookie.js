const { env } = require("../config/env");

function sessionCookieOptions(expiresAt) {
  const sameSite = ["lax", "strict", "none"].includes(env.sessionSameSite)
    ? env.sessionSameSite
    : "lax";

  return {
    httpOnly: true,
    secure: sameSite === "none" ? true : env.sessionSecure,
    sameSite,
    path: "/",
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}

module.exports = { sessionCookieOptions };

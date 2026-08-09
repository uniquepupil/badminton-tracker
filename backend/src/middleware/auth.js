const Session = require("../models/Session"); const { env } = require("../config/env"); const { digest, publicMember } = require("../services/authService"); const { fail } = require("../utils/api");
async function requireAuth(request, response, next) {
  try {
    const token = request.cookies[env.cookieName]; if (!token) return fail(response, 401, "AUTH_REQUIRED", "Please sign in.");
    const session = await Session.findOne({ tokenHash: digest(token), revokedAt: null, expiresAt: { $gt: new Date() } }).populate("member");
    if (!session?.member || session.member.status !== "active") return fail(response, 401, "SESSION_INVALID", "Your session has expired.");
    request.session = session; request.member = session.member; request.publicMember = publicMember(session.member); next();
  } catch (error) { next(error); }
}
module.exports = { requireAuth };

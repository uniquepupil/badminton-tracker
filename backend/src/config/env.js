require("dotenv").config();

function number(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: number("PORT", 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI || "",
  mongoDbName: process.env.MONGODB_DB_NAME || "badminton_tracker",
  cookieName: process.env.SESSION_COOKIE_NAME || "badminton_session",
  sessionTtlDays: number("SESSION_TTL_DAYS", 14),
  sessionSameSite: process.env.SESSION_SAME_SITE || (process.env.NODE_ENV === "production" ? "none" : "lax"),
  sessionSecure: process.env.SESSION_SECURE === "true" || process.env.NODE_ENV === "production",
  otpTtlMinutes: number("OTP_TTL_MINUTES", 5),
  otpResendSeconds: number("OTP_RESEND_SECONDS", 60),
  otpMaxAttempts: number("OTP_MAX_ATTEMPTS", 5),
  // Missing means enabled for compatibility with tracker deployments created before this flag existed.
  whatsappOtpEnabled: String(process.env.WHATSAPP_OTP_ENABLED || "true").toLowerCase() === "true",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || "v25.0",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME || process.env.WHATSAPP_AUTH_TEMPLATE || "",
  whatsappLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en",
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91",
};

module.exports = { env };

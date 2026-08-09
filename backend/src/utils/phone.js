const { env } = require("../config/env");
function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `${env.defaultCountryCode}${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}
module.exports = { normalizePhone };

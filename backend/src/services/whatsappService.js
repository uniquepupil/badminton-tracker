const { env } = require("../config/env");

async function sendOtp(phone, otp) {
  if (!env.whatsappPhoneNumberId || !env.whatsappAccessToken || !env.whatsappAuthTemplate) throw new Error("WhatsApp OTP configuration is incomplete.");
  const response = await fetch(`https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${env.whatsappAccessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: phone.replace("+", ""), type: "template", template: {
      name: env.whatsappAuthTemplate, language: { code: env.whatsappLanguage },
      components: [
        { type: "body", parameters: [{ type: "text", text: otp }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: otp }] },
      ],
    } }),
  });
  if (!response.ok) throw new Error(`WhatsApp rejected OTP delivery (${response.status}).`);
  return response.json();
}
module.exports = { sendOtp };

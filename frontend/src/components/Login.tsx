"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Player } from "@/lib/types";

const OTP_LENGTH = 6;

export function Login({ onLogin }: { onLogin: (player: Player) => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const digitInputs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = digits.join("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (step === "phone") {
        const result = await api<{ message: string }>("/auth/request-otp", {
          method: "POST",
          body: JSON.stringify({ phone }),
        });
        setMessage(result.message);
        setDigits(Array(OTP_LENGTH).fill(""));
        setStep("otp");
        window.setTimeout(() => digitInputs.current[0]?.focus(), 100);
        return;
      }
      if (otp.length !== OTP_LENGTH) {
        setError("Enter the complete 6-digit OTP.");
        return;
      }
      const result = await api<{ member: Player }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });
      onLogin(result.member);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < OTP_LENGTH - 1) digitInputs.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) digitInputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) digitInputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) digitInputs.current[index + 1]?.focus();
  }

  function handleOtpPaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] || ""));
    digitInputs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  }

  function changeNumber() {
    setStep("phone");
    setDigits(Array(OTP_LENGTH).fill(""));
    setMessage("");
    setError("");
  }

  return (
    <main className="center-page">
      <form className="login" onSubmit={submit}>
        <div className={`login-shuttle ${busy ? "is-verifying" : ""}`} aria-hidden="true"><span>🏸</span></div>
        <h1>{step === "phone" ? "Ready to rally?" : "Check WhatsApp"}</h1>
        <p>{step === "phone" ? "Enter mobile no." : `Enter the 6-digit OTP sent to ${phone}.`}</p>
        {message && step === "otp" && <div className="notice">OTP sent on WhatsApp.</div>}
        {error && <div className="notice error">{error}</div>}

        {step === "phone" ? (
          <div className="field">
            <label htmlFor="mobile-number">MOBILE NUMBER</label>
            <input id="mobile-number" autoFocus inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          </div>
        ) : (
          <div className="field">
            <label>6-DIGIT OTP</label>
            <div className="otp-digits" onPaste={handleOtpPaste}>
              {digits.map((digit, index) => (
                <input key={index} ref={(element) => { digitInputs.current[index] = element; }} aria-label={`OTP digit ${index + 1}`} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => handleDigitKeyDown(index, event)} disabled={busy} />
              ))}
            </div>
          </div>
        )}

        <button className="btn" disabled={busy || (step === "otp" && otp.length !== OTP_LENGTH)}>
          {busy ? <span className="verifying-label"><i />{step === "phone" ? "Sending OTP…" : "Verifying…"}</span> : step === "phone" ? "Send OTP" : "Verify OTP"}
        </button>
        {step === "otp" && <button type="button" className="link change-number" onClick={changeNumber} disabled={busy}>Change mobile number</button>}
      </form>
    </main>
  );
}

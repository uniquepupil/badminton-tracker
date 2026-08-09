"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { imagePayload } from "@/lib/imageUpload";
import type { Player } from "@/lib/types";

export function ProfileEditor({ player, onClose, onUpdated }: {
  player: Player;
  onClose: () => void;
  onUpdated: (player: Player) => Promise<void> | void;
}) {
  const [name, setName] = useState(player.name);
  const [color, setColor] = useState(player.color);
  const [phone, setPhone] = useState(player.phone || "");
  const [otp, setOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"edit" | "verify">("edit");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: () => Promise<Player | null>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await action();
      if (updated) await onUpdated(updated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update profile.");
    } finally {
      setBusy(false);
    }
  }

  function saveDetails() {
    return run(async () => {
      const result = await api<{ member: Player; message: string }>("/players/me", {
        method: "PATCH",
        body: JSON.stringify({ name, color }),
      });
      setMessage(result.message);
      return result.member;
    });
  }

  function uploadPhoto(file: File) {
    return run(async () => {
      const result = await api<{ member: Player; message: string }>("/players/me/photo", {
        method: "POST",
        body: JSON.stringify(await imagePayload(file)),
      });
      setMessage(result.message);
      return result.member;
    });
  }

  function requestPhoneOtp() {
    return run(async () => {
      const result = await api<{ message: string }>("/players/me/phone/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setMessage(result.message);
      setPhoneStep("verify");
      return null;
    });
  }

  function verifyPhoneOtp() {
    return run(async () => {
      const result = await api<{ member: Player; message: string }>("/players/me/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });
      setMessage(result.message);
      setPhoneStep("edit");
      setOtp("");
      return result.member;
    });
  }

  return <div className="modal-bg"><div className="modal profile-modal">
    <div className="modal-head"><div><div className="eyebrow">Account</div><h2>Edit profile</h2></div><button className="icon-btn" onClick={onClose}>✕</button></div>
    <div className="profile-editor-hero">
      <span className="profile-photo profile-photo-large" style={{ background: player.color }}>
        {player.avatarUrl ? <img src={player.avatarUrl} alt={player.name} /> : player.name[0]}
      </span>
      <div><strong>{player.name}</strong><small>{player.role === "admin" ? "Administrator" : "Player"}</small></div>
      <label className="btn secondary"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])} />Change photo</label>
    </div>
    <div className="profile-form-section"><h3>Personal details</h3><div className="field"><label>DISPLAY NAME</label><input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></div><div className="field"><label>PLAYER COLOR</label><div className="color-field"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /><span>{color.toUpperCase()}</span></div></div><button className="btn" disabled={busy} onClick={saveDetails}>Save details</button></div>
    <div className="profile-form-section"><h3>Mobile number</h3><p className="subtle">A new number must be verified using a WhatsApp OTP before it replaces your login number.</p><div className="field"><label>NEW MOBILE NUMBER</label><input inputMode="tel" value={phone} disabled={phoneStep === "verify"} onChange={(event) => setPhone(event.target.value)} /></div>{phoneStep === "verify" ? <><div className="field"><label>6-DIGIT OTP</label><input className="profile-otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /></div><div className="actions"><button className="btn ghost" onClick={() => { setPhoneStep("edit"); setOtp(""); }}>Change number</button><button className="btn" disabled={busy || otp.length !== 6} onClick={verifyPhoneOtp}>Verify & update</button></div></> : <button className="btn secondary" disabled={busy || phone === player.phone} onClick={requestPhoneOtp}>Send WhatsApp OTP</button>}</div>
    {message && <div className="notice">{message}</div>}{error && <div className="notice error">{error}</div>}
  </div></div>;
}

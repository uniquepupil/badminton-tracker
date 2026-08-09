"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { imagePayload } from "@/lib/imageUpload";
import type { Game, Match, Player } from "@/lib/types";

const sizes = { "1v1": [1, 1], "2v2": [2, 2], "2v1": [2, 1] } as const;

export function MatchForm({ players, match, onClose, onSaved }: {
  players: Player[];
  match?: Match | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [format, setFormat] = useState<keyof typeof sizes>(match?.format || "1v1");
  const [sideA, setA] = useState<string[]>(match?.sideA.map((player) => player.id) || [""]);
  const [sideB, setB] = useState<string[]>(match?.sideB.map((player) => player.id) || [""]);
  const [games, setGames] = useState<Game[]>(match?.games || [{ sideA: 21, sideB: 0 }, { sideA: 21, sideB: 0 }]);
  const [custom, setCustom] = useState(match?.isCustom || false);
  const [note, setNote] = useState(match?.note || "");
  const [playedAt, setPlayedAt] = useState((match?.playedAt ? new Date(match.playedAt) : new Date()).toISOString().slice(0, 16));
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const [a, b] = sizes[format];
    setA((current) => Array.from({ length: a }, (_, index) => current[index] || ""));
    setB((current) => Array.from({ length: b }, (_, index) => current[index] || ""));
  }, [format]);

  const winner = useMemo(() => {
    let a = 0;
    let b = 0;
    games.forEach((game) => game.sideA > game.sideB ? a++ : b++);
    return a === b ? "Draw" : a > b ? "Side A" : "Side B";
  }, [games]);

  function select(side: "A" | "B", index: number, value: string) {
    (side === "A" ? setA : setB)((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ match: Match }>(match ? `/matches/${match._id}` : "/matches", {
        method: match ? "PATCH" : "POST",
        body: JSON.stringify({ format, sideA, sideB, games, isCustom: custom, note, playedAt: new Date(playedAt).toISOString() }),
      });
      if (photo) {
        await api(`/matches/${result.match._id}/photos`, {
          method: "POST",
          body: JSON.stringify(await imagePayload(photo)),
        });
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save match.");
    } finally {
      setBusy(false);
    }
  }

  const picker = (side: "A" | "B", ids: string[]) => ids.map((id, index) => (
    <select key={index} value={id} onChange={(event) => select(side, index, event.target.value)}>
      <option value="">Choose player</option>
      {players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
    </select>
  ));

  return <div className="modal-bg"><div className="modal">
    <div className="modal-head"><div><div className="eyebrow">Match result</div><h2>{match ? "Edit match" : "Record a rally"}</h2></div><button className="icon-btn" onClick={onClose}>✕</button></div>
    <div className="field"><label>FORMAT</label><div className="segment">{(["1v1", "2v2", "2v1"] as const).map((item) => <button key={item} className={format === item ? "active" : ""} onClick={() => setFormat(item)}>{item}</button>)}</div></div>
    <div className="teams"><div className="field"><label>SIDE A</label>{picker("A", sideA)}</div><div className="versus">vs</div><div className="field"><label>SIDE B</label>{picker("B", sideB)}</div></div>
    <div className="switch"><div><strong>Casual custom score</strong><div className="meta">Allows non-standard finished games</div></div><input type="checkbox" checked={custom} onChange={(event) => setCustom(event.target.checked)} /></div>
    <div className="field"><label>GAMES · {winner} leads</label>{games.map((game, index) => <div className="game-row" key={index}><strong>Game {index + 1}</strong><input type="number" min="0" value={game.sideA} onChange={(event) => setGames((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sideA: Number(event.target.value) } : item))} /><b>–</b><input type="number" min="0" value={game.sideB} onChange={(event) => setGames((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sideB: Number(event.target.value) } : item))} /></div>)}{games.length < 3 && <button className="link" onClick={() => setGames((current) => [...current, { sideA: 0, sideB: 0 }])}>+ Add game</button>}{games.length > 1 && <button className="link" onClick={() => setGames((current) => current.slice(0, -1))}>Remove last</button>}</div>
    <div className="field"><label>PLAYED AT</label><input type="datetime-local" value={playedAt} onChange={(event) => setPlayedAt(event.target.value)} /></div>
    <div className="field"><label>NOTE (OPTIONAL)</label><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Epic comeback, windy court…" /></div>
    <div className="field"><label>MATCH PHOTO (OPTIONAL)</label><label className="photo-picker"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /><span>📷</span><strong>{photo ? photo.name : "Choose a court photo"}</strong><small>JPG, PNG or WEBP · max 5 MB</small></label></div>
    {match?.photos?.length ? <div className="existing-photos">{match.photos.map((item) => <img key={item._id} src={item.url} alt={item.fileName} />)}</div> : null}
    {error && <div className="notice error">{error}</div>}
    <div className="actions"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={busy} onClick={save}>{busy ? photo ? "Saving & uploading…" : "Saving…" : "Save match"}</button></div>
  </div></div>;
}

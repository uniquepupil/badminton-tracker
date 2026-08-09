"use client";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, History, Home, LogOut, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { Match, Player, Standing } from "@/lib/types";
import { MatchForm } from "./MatchForm";
type Tab = "home" | "matches" | "standings" | "players";
const names = (p: Player[]) => p.map((x) => x.name.split(" ")[0]).join(" + ");
const score = (m: Match) =>
  m.games.map((g) => `${g.sideA}–${g.sideB}`).join("  ");
export function Tracker({
  member,
  onLogout,
}: {
  member: Player;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Match | null | false>(false);
  const [format, setFormat] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = format ? `?format=${format}` : "";
      const [m, p, s] = await Promise.all([
        api<{ matches: Match[] }>(`/matches/${query}`),
        api<{ players: Player[] }>("/players"),
        api<{ standings: Standing[] }>(`/standings/${query}`),
      ]);
      setMatches(m.matches);
      setPlayers(p.players);
      setStandings(s.standings);
    } finally {
      setLoading(false);
    }
  }, [format]);
  useEffect(() => {
    load();
  }, [load]);
  async function showPlayer(id: string) {
    const x = await api<{ profile: any }>(`/players/${id}`);
    setProfile(x.profile);
    setTab("players");
  }
  const mine = standings.find((x) => x.member.id === member.id);
  const today = new Date().toDateString();
  const todays = matches.filter(
    (m) => new Date(m.playedAt).toDateString() === today,
  );
  function MatchList({ items = matches }: { items?: Match[] }) {
    return (
      <>
        {items.length ? (
          items.map((m) => (
            <div
              className="match"
              key={m._id}
              onClick={() =>
                (m.createdBy.id === member.id || member.role === "admin") &&
                setForm(m)
              }
            >
              <div className="team">
                <strong>{names(m.sideA)}</strong>
                <span>{m.winner === "A" ? "Winner" : "Side A"}</span>
              </div>
              <div className="score">{score(m)}</div>
              <div className="team">
                <strong>{names(m.sideB)}</strong>
                <span>{m.winner === "B" ? "Winner" : "Side B"}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty">
            <p>No matches here yet. Time for the first rally.</p>
          </div>
        )}
      </>
    );
  }
  function Ranks({ limit }: { limit?: number }) {
    return (
      <>
        {standings.slice(0, limit).map((r, i) => (
          <button
            className="rank link standings-row"
            key={r.member.id}
            onClick={() => showPlayer(r.member.id)}
          >
            <span className="rank-no">{i + 1}</span>
            <span className="rank-name">
              <i className="dot" style={{ background: r.member.color }} />
              {r.member.name}
            </span>
            <strong>
              {r.wins} W
              <small>
                {r.winRate}% · {r.played} played
              </small>
            </strong>
          </button>
        ))}
      </>
    );
  }
  return (
    <>
      <main className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="logo">🏸</span>
            <span className="brand-copy">
              <small>NO LOVERS</small>
              <strong>Badminton Club</strong>
            </span>
          </div>
          <button
            className="profile-chip"
            title="Sign out"
            onClick={onLogout}
          >
            <span className="profile-copy">
              <strong>{member.name}</strong>
              <small>{member.role === "admin" ? "Admin" : "Player"}</small>
            </span>
            <span className="avatar" style={{ background: member.color }}>
              {member.name[0]}
            </span>
          </button>
        </header>
        {loading ? (
          <div className="loading">Fetching today&apos;s rallies…</div>
        ) : (
          <>
            {tab === "home" && (
              <>
                <section className="hero">
                  <div>
                    <div className="eyebrow">
                      {new Date().toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                    <h1>Keep the rally alive.</h1>
                    <p>
                      {todays.length} match{todays.length === 1 ? "" : "es"}{" "}
                      recorded today · {players.length} squad members
                    </p>
                  </div>
                  <button className="btn" onClick={() => setForm(null)}>
                    <Plus size={18} />
                    Add match
                  </button>
                </section>
                <section className="grid">
                  <div>
                    <div className="card">
                      <div className="card-head">
                        <h2>Your season</h2>
                        <button
                          className="link"
                          onClick={() => showPlayer(member.id)}
                        >
                          View profile
                        </button>
                      </div>
                      <div className="stat-grid">
                        <div className="stat">
                          <strong>{mine?.wins || 0}</strong>
                          <span>WINS</span>
                        </div>
                        <div className="stat">
                          <strong>{mine?.winRate || 0}%</strong>
                          <span>WIN RATE</span>
                        </div>
                        <div className="stat">
                          <strong>
                            {mine?.pointDifference && mine.pointDifference > 0
                              ? "+"
                              : ""}
                            {mine?.pointDifference || 0}
                          </strong>
                          <span>POINT DIFF</span>
                        </div>
                      </div>
                    </div>
                    <div className="card" style={{ marginTop: 18 }}>
                      <div className="card-head">
                        <h2>Recent matches</h2>
                        <button
                          className="link"
                          onClick={() => setTab("matches")}
                        >
                          See all
                        </button>
                      </div>
                      <MatchList items={matches.slice(0, 4)} />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-head">
                      <h2>Top standings</h2>
                      <button
                        className="link"
                        onClick={() => setTab("standings")}
                      >
                        Full table
                      </button>
                    </div>
                    <Ranks limit={5} />
                  </div>
                </section>
              </>
            )}
            {tab === "matches" && (
              <>
                <h1 className="page-title">Match history</h1>
                <p className="subtle">
                  Every game, every comeback, all in one place.
                </p>
                <div className="toolbar">
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="">All formats</option>
                    <option>1v1</option>
                    <option>2v2</option>
                    <option>2v1</option>
                  </select>
                </div>
                <div className="card">
                  <MatchList />
                </div>
              </>
            )}
            {tab === "standings" && (
              <>
                <h1 className="page-title">Standings</h1>
                <p className="subtle">
                  Ranked by wins, win rate, then game and point difference.
                </p>
                <div className="toolbar">
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="">All formats</option>
                    <option>1v1</option>
                    <option>2v2</option>
                    <option>2v1</option>
                  </select>
                </div>
                <div className="card">
                  <Ranks />
                </div>
              </>
            )}
            {tab === "players" && (
              <>
                <h1 className="page-title">
                  {profile ? profile.member.name : "Squad"}
                </h1>
                <p className="subtle">
                  {profile
                    ? "Form, partners and rivalries."
                    : "Tap a player for their full record."}
                </p>
                {profile ? (
                  <>
                    <button className="link" onClick={() => setProfile(null)}>
                      ← All players
                    </button>
                    <div className="grid">
                      <div className="card">
                        <div className="stat-grid">
                          <div className="stat">
                            <strong>{profile.stats?.wins || 0}</strong>
                            <span>WINS</span>
                          </div>
                          <div className="stat">
                            <strong>{profile.stats?.winRate || 0}%</strong>
                            <span>WIN RATE</span>
                          </div>
                          <div className="stat">
                            <strong>{profile.stats?.played || 0}</strong>
                            <span>PLAYED</span>
                          </div>
                        </div>
                        <h3 style={{ marginTop: 22 }}>Recent form</h3>
                        <p className="detail-score">
                          {profile.recentForm.join(" · ") || "No matches"}
                        </p>
                      </div>
                      <div className="card">
                        <h3>Head to head</h3>
                        {profile.headToHead.map((x: any) => (
                          <div className="rank" key={x.member.id}>
                            <span
                              className="dot"
                              style={{ background: x.member.color }}
                            />
                            <span>{x.member.name}</span>
                            <strong>
                              {x.wins}/{x.played}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="card">
                    {players.map((p) => (
                      <button
                        className="rank link player-row"
                        key={p.id}
                        onClick={() => showPlayer(p.id)}
                      >
                        <span
                          className="avatar"
                          style={{ background: p.color }}
                        >
                          {p.name[0]}
                        </span>
                        <span className="rank-name">{p.name}</span>
                        <span>›</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <nav className="bottom-nav">
        {(
          [
            { id: "home", icon: Home, label: "Home" },
            { id: "matches", icon: History, label: "Matches" },
            { id: "standings", icon: BarChart3, label: "Standings" },
            { id: "players", icon: Users, label: "Players" },
          ] as const
        ).map((n) => (
          <button
            key={n.id}
            className={`nav-item ${tab === n.id ? "active" : ""}`}
            onClick={() => {
              setTab(n.id);
              setProfile(null);
            }}
          >
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
        <button className="nav-item" onClick={onLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </nav>
      {tab !== "home" && (
        <button className="fab" onClick={() => setForm(null)}>
          +
        </button>
      )}
      {form !== false && (
        <MatchForm
          players={players}
          match={form}
          onClose={() => setForm(false)}
          onSaved={() => {
            setForm(false);
            load();
          }}
        />
      )}
    </>
  );
}

const Match = require("../models/Match"); const Member = require("../models/Member");

function matchQuery(filters = {}) {
  const query = { deletedAt: null };
  if (filters.format && ["1v1", "2v2", "2v1"].includes(filters.format)) query.format = filters.format;
  if (filters.player) query.$or = [{ sideA: filters.player }, { sideB: filters.player }];
  if (filters.custom === "true") query.isCustom = true; if (filters.custom === "false") query.isCustom = false;
  if (filters.from || filters.to) { query.playedAt = {}; if (filters.from) query.playedAt.$gte = new Date(filters.from); if (filters.to) query.playedAt.$lte = new Date(filters.to); }
  return query;
}

async function standings(filters = {}) {
  const [members, matches] = await Promise.all([Member.find({ status: "active" }).lean(), Match.find(matchQuery(filters)).lean()]);
  const rows = new Map(members.map(m => [String(m._id), { member: { id: String(m._id), name: m.name, color: m.color, avatarUrl: m.avatarStorageKey ? `/api/players/${m._id}/photo` : m.avatarUrl }, played: 0, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, pointsFor: 0, pointsAgainst: 0 }]));
  for (const match of matches) {
    const aIds = match.sideA.map(String); const bIds = match.sideB.map(String); const ga = match.games.filter(g => g.sideA > g.sideB).length; const gb = match.games.length - ga;
    const pa = match.games.reduce((sum, g) => sum + g.sideA, 0); const pb = match.games.reduce((sum, g) => sum + g.sideB, 0);
    for (const [ids, side] of [[aIds, "A"], [bIds, "B"]]) for (const id of ids) { const row = rows.get(id); if (!row) continue; row.played++; match.winner === side ? row.wins++ : row.losses++; row.gamesWon += side === "A" ? ga : gb; row.gamesLost += side === "A" ? gb : ga; row.pointsFor += side === "A" ? pa : pb; row.pointsAgainst += side === "A" ? pb : pa; }
  }
  return [...rows.values()].map(r => ({ ...r, winRate: r.played ? Math.round(r.wins / r.played * 1000) / 10 : 0, gameDifference: r.gamesWon - r.gamesLost, pointDifference: r.pointsFor - r.pointsAgainst })).sort((a,b) => b.wins-a.wins || b.winRate-a.winRate || b.gameDifference-a.gameDifference || b.pointDifference-a.pointDifference || a.member.name.localeCompare(b.member.name));
}

async function playerProfile(id) {
  const member = await Member.findById(id).lean(); if (!member || member.status !== "active") return null;
  const matches = await Match.find({ deletedAt: null, $or: [{ sideA: id }, { sideB: id }] }).populate("sideA sideB", "name color avatarUrl avatarStorageKey").sort({ playedAt: -1 }).lean();
  const base = (await standings({ player: id })).find(r => r.member.id === String(id)); const teammates = {}; const opponents = {};
  for (const m of matches) { const inA = m.sideA.some(x => String(x._id) === String(id)); const won = m.winner === (inA ? "A" : "B");
    for (const p of (inA ? m.sideA : m.sideB)) if (String(p._id) !== String(id)) { const key=String(p._id); teammates[key] ||= { member:{id:key,name:p.name,color:p.color},played:0,wins:0 }; teammates[key].played++; if(won) teammates[key].wins++; }
    for (const p of (inA ? m.sideB : m.sideA)) { const key=String(p._id); opponents[key] ||= { member:{id:key,name:p.name,color:p.color},played:0,wins:0 }; opponents[key].played++; if(won) opponents[key].wins++; }
  }
  return { member: { id:String(member._id), name:member.name, color:member.color, avatarUrl:member.avatarStorageKey ? `/api/players/${member._id}/photo` : member.avatarUrl }, stats:base, recentForm:matches.slice(0,10).map(m => m.winner === (m.sideA.some(x=>String(x._id)===String(id)) ? "A":"B") ? "W":"L"), teammates:Object.values(teammates), headToHead:Object.values(opponents) };
}
module.exports = { matchQuery, standings, playerProfile };

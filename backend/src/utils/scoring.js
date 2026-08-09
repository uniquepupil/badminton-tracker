const FORMATS = { "1v1": [1, 1], "2v2": [2, 2], "2v1": [2, 1] };

function validateGame(game, custom) {
  const a = Number(game?.sideA); const b = Number(game?.sideB);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a === b) return "Each game needs different non-negative whole-number scores.";
  if (custom) return null;
  const high = Math.max(a, b); const low = Math.min(a, b);
  if (high > 30 || high < 21) return "Standard games finish between 21 and 30 points.";
  if (high === 30) return low >= 28 && low <= 29 ? null : "A 30-point game must finish 30–28 or 30–29.";
  if (high === 21) return low <= 19 ? null : "At 20-all, a side must win by two.";
  return high - low === 2 && low >= 20 ? null : "After 20-all, a side must win by two.";
}

function evaluateMatch(input) {
  const sizes = FORMATS[input.format];
  if (!sizes) return { error: "Unsupported match format." };
  const sideA = [...new Set(input.sideA || [])]; const sideB = [...new Set(input.sideB || [])];
  if (sideA.length !== sizes[0] || sideB.length !== sizes[1] || new Set([...sideA, ...sideB]).size !== sideA.length + sideB.length) return { error: `Format ${input.format} requires ${sizes[0]} vs ${sizes[1]} unique players.` };
  const games = input.games || [];
  if (!games.length || games.length > 3) return { error: "A match requires one to three games." };
  let winsA = 0; let winsB = 0;
  for (let index = 0; index < games.length; index += 1) {
    const error = validateGame(games[index], Boolean(input.isCustom));
    if (error) return { error: `Game ${index + 1}: ${error}` };
    if (winsA === 2 || winsB === 2) return { error: "No games are allowed after a side wins twice." };
    Number(games[index].sideA) > Number(games[index].sideB) ? winsA++ : winsB++;
  }
  if (!input.isCustom && Math.max(winsA, winsB) !== 2) return { error: "A standard match ends when one side wins two games." };
  if (winsA === winsB) return { error: "The match must have a winner." };
  return { sideA, sideB, games: games.map(g => ({ sideA: Number(g.sideA), sideB: Number(g.sideB) })), winner: winsA > winsB ? "A" : "B", gamesWon: { sideA: winsA, sideB: winsB } };
}
module.exports = { FORMATS, validateGame, evaluateMatch };

export type Player = {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  role?: "member" | "admin";
};

export type Game = { sideA: number; sideB: number };

export type MatchPhoto = {
  _id: string;
  url: string;
  contentType: string;
  fileName: string;
  size: number;
  uploadedAt: string;
};

export type Match = {
  _id: string;
  format: "1v1" | "2v2" | "2v1";
  sideA: Player[];
  sideB: Player[];
  games: Game[];
  winner: "A" | "B";
  isCustom: boolean;
  note: string;
  photos: MatchPhoto[];
  playedAt: string;
  createdBy: Player;
};

export type Standing = {
  member: Player;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
};

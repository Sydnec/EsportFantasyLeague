export type Game = 'LEAGUE_OF_LEGENDS' | 'COUNTER_STRIKE' | 'ROCKET_LEAGUE' | 'VALORANT';

export type MatchDayStatus = 'OPEN' | 'LOCKED' | 'SCORED';

export type RosterStatus = 'PENDING' | 'LOCKED' | 'SCORED';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
  hasPassword?: boolean;
  isGoogleLinked?: boolean;
}

export interface League {
  id: string;
  name: string;
  games: Game[];
  tournaments: string[];
  rosterSize: number;
  cooldownDays: number;
  inviteCode: string;
  maxMembers: number;
  onlyCreatorInvites: boolean;
  createdById: string;
  createdAt: string;
  members: LeagueMember[];
  _count?: { members: number };
}

export interface LeagueMember {
  id: string;
  totalScore: number;
  joinedAt?: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export interface ProPlayer {
  id: string;
  name: string;
  team: Team | null;
  game: Game;
  role: string;
  imageUrl?: string;
  isActive: boolean;
  performances?: { id: string; score: number | null }[];
}

export interface Team {
  id: string;
  name: string;
  acronym?: string | null;
  imageUrl?: string | null;
  game: Game;
}

export interface Match {
  id: string;
  matchDayId: string;
  teamAId: string;
  teamBId: string;
  winnerId?: string | null;
  scheduledAt: string;
  status: string;
  teamA: Team;
  teamB: Team;
  teamAScore?: number | null;
  teamBScore?: number | null;
  tournamentName?: string | null;
  games?: any[] | null;
  winner?: Team | null;
}

export interface MatchDay {
  id: string;
  date: string;
  game: Game;
  lockTime: string;
  status: MatchDayStatus;
  _count?: {
    performances: number;
    rosters: number;
  };
  matches?: Match[];
}

export interface DayPerformance {
  id: string;
  rawStats: Record<string, unknown>;
  score: number | null;
  proPlayer: Pick<ProPlayer, 'id' | 'name' | 'team' | 'role'>;
}

export interface RosterPick {
  id: string;
  pickOrder: number;
  proPlayer: Pick<ProPlayer, 'id' | 'name' | 'team' | 'role' | 'imageUrl'>;
}

export interface Roster {
  id: string;
  status: RosterStatus;
  totalScore: number | null;
  picks: RosterPick[];
  matchDay: MatchDay;
  league: Pick<League, 'id' | 'name'>;
  user?: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

import { apiClient } from './client';
import { type League, type LeagueMember, type ApiResponse, type Game } from '../types';

export const leaguesApi = {
  getAll: async (): Promise<League[]> => {
    const res = await apiClient.get<ApiResponse<League[]>>('/leagues');
    return res.data.data;
  },
  getById: async (id: string): Promise<League> => {
    const res = await apiClient.get<ApiResponse<League>>(`/leagues/${id}`);
    return res.data.data;
  },
  create: async (data: { name: string; games: Game[]; tournaments: string[]; rosterSize: number; cooldownDays: number; onlyCreatorInvites?: boolean }): Promise<League> => {
    const res = await apiClient.post<ApiResponse<League>>('/leagues', data);
    return res.data.data;
  },
  join: async (id: string, inviteCode: string): Promise<League> => {
    const res = await apiClient.post<ApiResponse<League>>(`/leagues/${id}/join`, { inviteCode });
    return res.data.data;
  },
  getLeaderboard: async (leagueId: string): Promise<LeagueMember[]> => {
    const res = await apiClient.get<ApiResponse<LeagueMember[]>>(`/leagues/${leagueId}/leaderboard`);
    return res.data.data;
  },
  getUpcomingTournaments: async (): Promise<Record<string, string[]>> => {
    const res = await apiClient.get<ApiResponse<Record<string, string[]>>>('/leagues/upcoming-tournaments');
    const data = res.data.data;
    const formatted: Record<string, string[]> = {};
    for (const [game, tournaments] of Object.entries(data)) {
      const leagues = Array.from(new Set(tournaments.map(t => t.split(' / ')[0]))).sort();
      formatted[game] = leagues;
    }
    return formatted;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leagues/${id}`);
  },
};

import { apiClient } from './client';
import type { ProPlayer, ApiResponse, Game } from '../types';

export const proPlayersApi = {
  getAll: async (filters?: { game?: Game; team?: string; role?: string }): Promise<ProPlayer[]> => {
    const res = await apiClient.get<ApiResponse<ProPlayer[]>>('/pro-players', { params: filters });
    return res.data.data;
  },
  getById: async (id: string): Promise<ProPlayer> => {
    const res = await apiClient.get<ApiResponse<ProPlayer>>(`/pro-players/${id}`);
    return res.data.data;
  },
  getByMatchDay: async (matchDayId: string, leagueId?: string): Promise<ProPlayer[]> => {
    const res = await apiClient.get<ApiResponse<ProPlayer[]>>(`/pro-players/match-day/${matchDayId}`, {
      params: { leagueId },
    });
    return res.data.data;
  },
};

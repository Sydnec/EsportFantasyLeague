import { apiClient } from './client';
import { type Roster, type ApiResponse } from '../types';

export const rostersApi = {
  create: async (data: { leagueId: string; matchDayId: string; proPlayerIds: string[] }): Promise<Roster> => {
    const res = await apiClient.post<ApiResponse<Roster>>('/rosters', data);
    return res.data.data;
  },
  getAll: async (leagueId?: string): Promise<Roster[]> => {
    const res = await apiClient.get<ApiResponse<Roster[]>>('/rosters', { params: leagueId ? { leagueId } : {} });
    return res.data.data;
  },
  getById: async (id: string): Promise<Roster> => {
    const res = await apiClient.get<ApiResponse<Roster>>(`/rosters/${id}`);
    return res.data.data;
  },
  update: async (id: string, proPlayerIds: string[]): Promise<Roster> => {
    const res = await apiClient.patch<ApiResponse<Roster>>(`/rosters/${id}`, { proPlayerIds });
    return res.data.data;
  },
  getByLeagueAndMatchDay: async (leagueId: string, matchDayId: string): Promise<Roster[]> => {
    const res = await apiClient.get<ApiResponse<Roster[]>>(`/rosters/league/${leagueId}/match-day/${matchDayId}`);
    return res.data.data;
  },
};

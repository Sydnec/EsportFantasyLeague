import { apiClient } from './client';
import type { MatchDay, ApiResponse } from '../types';

export const matchDaysApi = {
  getAll: async (params?: { game?: string; status?: string; date?: string }) => {
    const { data } = await apiClient.get<ApiResponse<MatchDay[]>>('/esport/match-days', { params });
    return data.data;
  },
  getById: async (id: string): Promise<MatchDay & { performances: any[] }> => {
    const res = await apiClient.get<ApiResponse<MatchDay & { performances: any[] }>>(`/esport/match-days/${id}`);
    return res.data.data;
  },
};

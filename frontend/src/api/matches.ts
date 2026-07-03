import { apiClient } from './client';
import type { ApiResponse, Match } from '../types';

export const matchesApi = {
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Match>>(`/matches/${id}`);
    return response.data.data;
  },
};

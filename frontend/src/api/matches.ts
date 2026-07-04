import { apiClient } from './client';
import type { Match, ApiResponse } from '../types';

export const matchesApi = {
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Match>>(`/esport/matches/${id}`);
    return response.data.data;
  },
};

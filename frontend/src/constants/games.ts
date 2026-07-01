import type { Game } from '../types';

export const GAME_CONFIG: Record<Game, { emoji: string; label: string; color: string }> = {
  'LEAGUE_OF_LEGENDS': { emoji: '🎮', label: 'League of Legends', color: '#00d26a' },
  'COUNTER_STRIKE': { emoji: '🔫', label: 'Counter-Strike', color: '#de9b35' },
  'ROCKET_LEAGUE': { emoji: '🚀', label: 'Rocket League', color: '#0088ff' },
  'VALORANT': { emoji: '🎯', label: 'Valorant', color: '#ff4655' },
};

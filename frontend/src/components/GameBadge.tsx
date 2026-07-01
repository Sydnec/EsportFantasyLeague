import type { Game } from '../types';
import { GAME_CONFIG } from '../constants/games';

export function GameBadge({ game, size = 'md' }: { game: Game; size?: 'sm' | 'md' }) {
  const config = GAME_CONFIG[game] || { emoji: '🎮', label: game, color: '#888' };
  const padding = size === 'sm' ? '3px 8px' : '5px 12px';
  const fontSize = size === 'sm' ? '0.7rem' : '0.8rem';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: '999px',
        background: `${config.color}20`,
        color: config.color,
        cursor: 'default',
      }}
    >
      {config.label}
    </span>
  );
}

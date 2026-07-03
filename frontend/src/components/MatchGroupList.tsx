import { useState } from 'react';
import { GAME_CONFIG } from '../constants/games';
import { MatchMiniCard } from './MatchMiniCard';
import type { Game } from '../types';

interface MatchGroupListProps {
  matches: any[];
}

export function MatchGroupList({ matches }: MatchGroupListProps) {
  const [collapsedGames, setCollapsedGames] = useState<Record<string, boolean>>({});

  const toggleGame = (game: string) => {
    setCollapsedGames(prev => ({ ...prev, [game]: !prev[game] }));
  };

  if (!matches || matches.length === 0) {
    return <p className="text-secondary text-center">Aucun match disponible</p>;
  }

  // Group by game
  const byGame = matches.reduce((acc: any, match: any) => {
    if (!acc[match.game]) acc[match.game] = [];
    acc[match.game].push(match);
    return acc;
  }, {});

  const gameKeys = Object.keys(GAME_CONFIG) as Array<Game>;
  // Only keep games that have matches
  const activeGames = gameKeys.filter(game => byGame[game] && byGame[game].length > 0);

  return (
    <div className="match-group-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {activeGames.map((game) => {
        const gameMatches = byGame[game];
        const gameConfig = GAME_CONFIG[game];
        const isGameCollapsed = !!collapsedGames[game];

        // Group by tournament
        const byTournament = gameMatches.reduce((acc: any, m: any) => {
          const t = m.tournamentName?.split(' / ')[0] || 'Autres';
          if (!acc[t]) acc[t] = [];
          acc[t].push(m);
          return acc;
        }, {});

        return (
          <div 
            key={game} 
            className="match-group-game-section" 
            style={{ 
              borderLeft: `3px solid ${gameConfig?.color || 'var(--border-light)'}`, 
              paddingLeft: '12px', 
              marginBottom: '8px' 
            }}
          >
            <div 
              onClick={() => toggleGame(game)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                userSelect: 'none',
                padding: '4px 0'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {gameConfig?.label || game}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({gameMatches.length} match{gameMatches.length > 1 ? 's' : ''})
              </span>
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-secondary)', 
                transition: 'transform 0.2s', 
                transform: isGameCollapsed ? 'rotate(-90deg)' : 'none' 
              }}>
                ▼
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateRows: isGameCollapsed ? '0fr' : '1fr',
              transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}>
              <div style={{ minHeight: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: isGameCollapsed ? '0' : '12px', opacity: isGameCollapsed ? 0 : 1, transition: 'opacity 0.3s ease, margin-top 0.3s ease' }}>
                  {Object.entries(byTournament).map(([tournament, tMatches]: [string, any]) => (
                    <div key={tournament} className="match-group-tournament-section">
                      <h4 style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)', 
                        textTransform: 'uppercase', 
                        marginBottom: '6px',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                      }}>
                        {tournament}
                      </h4>
                      <div className="matches-section-grid" style={{ marginTop: 0 }}>
                        {tMatches.map((match: any) => (
                          <MatchMiniCard key={match.id} match={match} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { GAME_CONFIG } from '../constants/games';
import { MatchesSection } from '../components/MatchesSection';
import { RecentResultsSection } from '../components/RecentResultsSection';
import { isMatchVisibleOnHome } from '../utils/matchWindow';
import { type League } from '../types';
import './HomePage.css';

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [matchDays, setMatchDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(() => {
    return localStorage.getItem('showAdvanced') === 'true';
  });
  const [excludedTournaments, setExcludedTournaments] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('excludedTournaments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch {
        // Fallback
      }
    }
    return new Set();
  });

  const allGames = Object.keys(GAME_CONFIG);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('activeFilters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch {
        // Fallback
      }
    }
    return new Set(allGames);
  });
  const navigate = useNavigate();

  const fetchMatchDays = () => {
    matchDaysApi.getAll().then((data) => {
      setMatchDays(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      leaguesApi.getAll().then((data) => {
        setLeagues(data);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    fetchMatchDays();
    const interval = setInterval(fetchMatchDays, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeFilters', JSON.stringify(Array.from(activeFilters)));
  }, [activeFilters]);

  useEffect(() => {
    localStorage.setItem('showAdvanced', String(showAdvanced));
  }, [showAdvanced]);

  useEffect(() => {
    localStorage.setItem('excludedTournaments', JSON.stringify(Array.from(excludedTournaments)));
  }, [excludedTournaments]);

  const toggleFilter = (game: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game);
      else next.add(game);
      return next;
    });
  };

  const tournamentsByGame = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    matchDays.forEach((md: any) => {
      const game = md.game;
      if (!groups[game]) {
        groups[game] = new Set<string>();
      }
      if (md.matches) {
        md.matches.forEach((m: any) => {
          // Only offer a league in the filter if it actually has a match visible
          // in "Prochains matchs" or "Resultats récents" below — otherwise the
          // filter lists leagues with nothing to show for them.
          if (m.tournamentName && isMatchVisibleOnHome(m, md.date)) {
            groups[game].add(m.tournamentName.split(' / ')[0]);
          }
        });
      }
    });
    
    const result: Record<string, string[]> = {};
    Object.entries(groups).forEach(([game, set]) => {
      result[game] = Array.from(set).sort();
    });
    return result;
  }, [matchDays]);

  const toggleTournament = (tournament: string) => {
    setExcludedTournaments(prev => {
      const next = new Set(prev);
      if (next.has(tournament)) next.delete(tournament);
      else next.add(tournament);
      return next;
    });
  };

  return (
    <div className="page container" id="home-page">
      {(!user || leagues.length === 0) && (
        <div className="home-actions" id="home-actions" style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
          <button className="btn btn-primary" id="home-btn-create-league" onClick={() => navigate('/leagues/new')}>
            Créer/Rejoindre une ligue
          </button>
        </div>
      )}

      <div className="dashboard-section mt-8 mb-24" id="home-filters-section" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {allGames.map(game => {
            const config = GAME_CONFIG[game as keyof typeof GAME_CONFIG];
            const isActive = activeFilters.has(game);
            const tourneys = tournamentsByGame[game] || [];
            return (
              <div key={game} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <button
                  id={`home-filter-btn-${game}`}
                  className="home-filter-btn"
                  onClick={() => toggleFilter(game)}
                  style={{
                    width: '100%',
                    borderColor: isActive ? config?.color : 'transparent',
                    background: isActive ? `${config?.color}15` : 'var(--bg-secondary)',
                    color: isActive ? config?.color : 'var(--text-secondary)',
                    boxShadow: isActive ? `0 2px 6px ${config?.color}15` : 'none',
                    margin: 0
                  }}
                >
                  {config?.label || game}
                </button>

                {showAdvanced && tourneys.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px', 
                    width: '100%',
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-light)',
                    marginTop: '4px'
                  }}>
                    {tourneys.map(t => {
                      const isExcluded = excludedTournaments.has(t);
                      return (
                        <label 
                          key={t} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            cursor: isActive ? 'pointer' : 'not-allowed',
                            fontSize: '0.75rem',
                            color: !isActive ? 'var(--text-muted)' : (isExcluded ? 'var(--text-muted)' : 'var(--text-primary)'),
                            padding: '2px 0',
                            userSelect: 'none',
                            width: '100%'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={!isExcluded && isActive} 
                            onChange={() => toggleTournament(t)}
                            disabled={!isActive}
                            style={{ cursor: isActive ? 'pointer' : 'not-allowed' }}
                          />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={t}>{t}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ borderRadius: '8px' }}
          >
            {showAdvanced ? 'Masquer les filtres' : 'Filtres avancés'}
          </button>
        </div>
      </div>

      <div className="home-sections" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <MatchesSection 
          matchDays={matchDays} 
          loading={loading} 
          activeFilters={activeFilters} 
          excludedTournaments={excludedTournaments} 
        />
        <RecentResultsSection 
          matchDays={matchDays} 
          loading={loading} 
          activeFilters={activeFilters} 
          excludedTournaments={excludedTournaments} 
        />
      </div>
    </div>
  );
}

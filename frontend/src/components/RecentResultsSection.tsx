import { useMemo, useState } from 'react';
import { MatchGroupList } from './MatchGroupList';
import { isInRecentResultsWindow } from '../utils/matchWindow';
import './MatchesSection.css';

export function RecentResultsSection({
  matchDays,
  loading,
  activeFilters,
  excludedTournaments
}: {
  matchDays: any[];
  loading: boolean;
  activeFilters: Set<string>;
  excludedTournaments: Set<string>;
}) {

  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMatchDays = useMemo(() => {
    const pastDays = matchDays.filter((md: any) => isInRecentResultsWindow(md.date));
    const sorted = [...pastDays].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const grouped = sorted.reduce((acc: any, md: any) => {
      const dateStr = md.date.split('T')[0];
      const validMatches = md.matches ? md.matches.filter((m: any) => {
        const isFinished = m.status === 'finished' || m.status === 'canceled';
        const leagueName = m.tournamentName?.split(' / ')[0];
        const isNotExcluded = !leagueName || !excludedTournaments.has(leagueName);
        return isFinished && isNotExcluded;
      }) : [];
      if (validMatches.length === 0) return acc;
      
      if (!acc[dateStr]) {
        acc[dateStr] = { id: dateStr, date: md.date, matches: [], games: new Set<string>() };
      }
      acc[dateStr].matches.push(...validMatches.map((m: any) => ({ ...m, game: md.game })));
      acc[dateStr].games.add(md.game);
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).map((day: any) => {
      const matches = day.matches.filter((m: any) => activeFilters.has(m.game));
      return { ...day, matches, games: new Set<string>(matches.map((m: any) => m.game)) };
    }).filter(day => day.matches.length > 0);
  }, [matchDays, activeFilters, excludedTournaments]);

  if (loading) return null;
  if (filteredMatchDays.length === 0) return null;

  return (
    <div className="card no-hover dashboard-section" id="recent-results-section" style={{ padding: '24px' }}>
      <div 
        className="match-day-header" 
        style={{ borderBottom: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', marginBottom: isCollapsed ? '0' : '16px' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 id="recent-results-title" style={{ margin: 0 }}>Resultats récents</h2>
        <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}>
          ▼
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateRows: isCollapsed ? '0fr' : '1fr',
        transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        <div style={{ minHeight: 0 }}>
          <div className="recent-results-days-list" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '4px' }}>
            {filteredMatchDays.map((md) => (
              <div key={md.id} className="recent-results-day-block" id={`recent-results-day-${md.id}`}>
                <div className="match-day-header" style={{ marginBottom: '12px' }}>
                  <span className="match-day-date" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {new Date(md.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="recent-results-games" style={{ marginTop: '12px' }}>
                  <MatchGroupList matches={md.matches} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

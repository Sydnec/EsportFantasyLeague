import { useState, useMemo } from 'react';
import { MatchGroupList } from './MatchGroupList';
import './MatchesSection.css';

export function MatchesSection({ 
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

  const filteredMatches = useMemo(() => {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;
    const threeHoursAgo = now - 3 * 60 * 60 * 1000;

    // Flatten all matches
    const flattened: any[] = [];
    matchDays.forEach((md: any) => {
      if (md.matches) {
        md.matches.forEach((m: any) => {
          flattened.push({ ...m, game: md.game, matchDayDate: md.date });
        });
      }
    });

    const filtered = flattened.filter((match: any) => {
      // Filter by active games
      if (!activeFilters.has(match.game)) {
        return false;
      }
      // Filter by excluded tournaments
      const leagueName = match.tournamentName?.split(' / ')[0];
      if (leagueName && excludedTournaments.has(leagueName)) {
        return false;
      }

      const schedTime = new Date(match.scheduledAt).getTime();
      const isLive = match.status === 'running';
      const finishedTime = match.finishedAt ? new Date(match.finishedAt).getTime() : schedTime;
      const isRecentFinished = match.status === 'finished' && finishedTime >= threeHoursAgo;
      const isUpcomingNear = (match.status !== 'finished' && match.status !== 'canceled' && match.status !== 'running') && 
                             schedTime <= oneDayFromNow;

      return isLive || isRecentFinished || isUpcomingNear;
    });

    // Sort by scheduled time, then by match ID to ensure stability
    return filtered.sort((a, b) => {
      const timeDiff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [matchDays, activeFilters, excludedTournaments]);

  if (loading) {
    return (
      <div className="card-grid mt-8" id="matches-section-loading">
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }


  return (
    <div className="card no-hover dashboard-section" id="matches-section" style={{ padding: '24px' }}>
      <div 
        className="match-day-header" 
        style={{ borderBottom: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', marginBottom: isCollapsed ? '0' : '16px' }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 id="matches-section-title" style={{ margin: 0 }}>Prochains matchs</h2>
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
          <div className="upcoming-games-list" style={{ paddingTop: '4px' }}>
            <MatchGroupList matches={filteredMatches} />
          </div>
        </div>
      </div>
    </div>
  );
}

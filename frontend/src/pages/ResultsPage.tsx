import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rostersApi } from '../api/rosters';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { StatusBadge } from '../components/StatusBadge';
import type { League } from '../types';
import './ResultsPage.css';

export function ResultsPage() {
  const { leagueId, matchDayId } = useParams<{ leagueId: string; matchDayId: string }>();
  const [rosters, setRosters] = useState<any[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [status, setStatus] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId || !matchDayId) return;

    const loadData = async () => {
      try {
        const [targetMd, l, allMds] = await Promise.all([
          matchDaysApi.getById(matchDayId),
          leaguesApi.getById(leagueId),
          matchDaysApi.getAll(),
        ]);

        setLeague(l);
        setStatus(targetMd.status);

        // Find all match days on the same date for the league's games
        const targetDateStr = new Date(targetMd.date).toISOString().split('T')[0];
        const siblingMds = allMds.filter(md => 
          new Date(md.date).toISOString().split('T')[0] === targetDateStr &&
          l.games.includes(md.game)
        );

        // Fetch rosters for all sibling match days
        const rostersArrays = await Promise.all(siblingMds.map(md => 
          rostersApi.getByLeagueAndMatchDay(leagueId, md.id)
        ));

        // Merge rosters by user
        const mergedMap = new Map<string, {
          id: string;
          user: { id: string; username: string };
          totalScore: number;
          picks: any[];
        }>();

        rostersArrays.flat().forEach(roster => {
          if (!roster.user) return;
          const userId = roster.user.id;
          if (!mergedMap.has(userId)) {
            mergedMap.set(userId, {
              id: userId,
              user: {
                id: roster.user.id,
                username: roster.user.username || 'Inconnu',
              },
              totalScore: 0,
              picks: [],
            });
          }
          const entry = mergedMap.get(userId)!;
          entry.totalScore += roster.totalScore || 0;
          
          // Map picks to include game information if multi-game
          const gamePrefix = siblingMds.length > 1 ? `[${roster.matchDay.game === 'LEAGUE_OF_LEGENDS' ? 'LoL' : 'CS'}] ` : '';
          const mappedPicks = roster.picks.map((p: any) => ({
            ...p,
            proPlayer: {
              ...p.proPlayer,
              role: `${gamePrefix}${p.proPlayer.role}`
            }
          }));
          entry.picks.push(...mappedPicks);
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.totalScore - a.totalScore);
        setRosters(mergedList);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [leagueId, matchDayId]);

  if (loading) return <div className="page container" id="results-loading"><div className="skeleton" style={{ height: 400 }} /></div>;

  const highestScore = rosters.length > 0 ? Math.max(...rosters.map((r) => r.totalScore || 0)) : 0;
  const avgScore = rosters.length > 0 ? rosters.reduce((sum, r) => sum + (r.totalScore || 0), 0) / rosters.length : 0;

  return (
    <div className="page container" id="results-page">
      <div className="results-header" id="results-header">
        <div>
          <h1 id="results-title">Résultats de la journée</h1>
          <div className="results-meta" id="results-meta">
            <span className="text-secondary">{league?.name}</span>
            {status && <StatusBadge status={status as any} />}
          </div>
        </div>
      </div>

      <div className="results-stats" id="results-stats">
        <div className="card stat-mini" id="results-stat-participants">
          <span className="stat-mini-number">{rosters.length}</span>
          <span className="stat-mini-label">Participants</span>
        </div>
        <div className="card stat-mini highlight" id="results-stat-highest">
          <span className="stat-mini-number text-primary">{highestScore.toFixed(1)}</span>
          <span className="stat-mini-label">Meilleur Score</span>
        </div>
        <div className="card stat-mini" id="results-stat-avg">
          <span className="stat-mini-number">{avgScore.toFixed(1)}</span>
          <span className="stat-mini-label">Score Moyen</span>
        </div>
      </div>

      <div className="results-list" id="results-list">
        {rosters.map((roster, i) => (
          <div
            key={roster.id}
            id={`results-roster-${roster.id}`}
            className={`card result-card transition-all ${i === 0 ? 'winner' : ''}`}
            onClick={() => setExpanded(expanded === roster.id ? null : roster.id)}
          >
            <div className="result-header">
              <div className="result-header-left">
                <div className="result-rank">
                  {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="rank-number">#{i + 1}</span>}
                </div>
                <div className="result-user">
                  <span className="result-username">{roster.user?.username || 'Inconnu'}</span>
                  {i === 0 && <span className="winner-badge">Vainqueur</span>}
                </div>
              </div>
              <div className="result-score">
                <span className={`score-value ${i === 0 ? 'text-primary' : ''}`}>
                  {(roster.totalScore || 0).toFixed(1)}
                </span>
                <span className="score-unit">pts</span>
              </div>
            </div>

            {expanded === roster.id && (
              <div className="result-picks" id={`results-picks-${roster.id}`}>
                {roster.picks.map((pick: any) => (
                  <div key={pick.id} className="result-pick" id={`results-pick-${pick.id}`}>
                    <span className="result-pick-name">{pick.proPlayer.name}</span>
                    <span className="result-pick-team">{(pick.proPlayer.team?.acronym || pick.proPlayer.team?.name || '')} · {pick.proPlayer.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { rostersApi } from '../api/rosters';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { proPlayersApi } from '../api/pro-players';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../stores/auth.store';
import type { League, ProPlayer } from '../types';
import './ResultsPage.css';

const GAME_TAGS: Record<string, string> = {
  LEAGUE_OF_LEGENDS: 'LoL',
  COUNTER_STRIKE: 'CS',
  VALORANT: 'VAL',
  ROCKET_LEAGUE: 'RL',
};

export function ResultsPage() {
  const { leagueId, matchDayId } = useParams<{ leagueId: string; matchDayId: string }>();
  const { user } = useAuthStore();
  const [rosters, setRosters] = useState<any[]>([]);
  const [players, setPlayers] = useState<ProPlayer[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [status, setStatus] = useState<string>('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const toggleTeam = (teamKey: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamKey)) next.delete(teamKey);
      else next.add(teamKey);
      return next;
    });
  };

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

        // Fetch rosters and players for all sibling match days
        const [rostersArrays, playersArrays] = await Promise.all([
          Promise.all(siblingMds.map(md => rostersApi.getByLeagueAndMatchDay(leagueId, md.id))),
          Promise.all(siblingMds.map(md => proPlayersApi.getByMatchDay(md.id)))
        ]);

        // Merge rosters by user
        const mergedMap = new Map<string, {
          id: string;
          user: { id: string; username: string };
          totalScore: number;
          picks: any[];
        }>();

        rostersArrays.forEach((rosterArray, mdIndex) => {
          const currentMd = siblingMds[mdIndex];
          rosterArray.forEach((roster: any) => {
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
            const gamePrefix = siblingMds.length > 1 ? `[${currentMd.game === 'LEAGUE_OF_LEGENDS' ? 'LoL' : 'CS'}] ` : '';
            const mappedPicks = roster.picks.map((p: any) => ({
              ...p,
              proPlayer: {
                ...p.proPlayer,
                role: `${gamePrefix}${p.proPlayer.role}`
              }
            }));
            entry.picks.push(...mappedPicks);
          });
        });

        const mergedList = Array.from(mergedMap.values()).sort((a, b) => b.totalScore - a.totalScore);
        setRosters(mergedList);
        setPlayers(playersArrays.flat());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [leagueId, matchDayId]);

  const myRoster = useMemo(() => {
    if (!user) return null;
    return rosters.find((r) => r.id === user.id) || null;
  }, [rosters, user]);

  const groupedPlayers = useMemo(() => {
    const groups: Record<string, { teamName: string; teamImageUrl?: string | null; game: string; players: ProPlayer[] }> = {};
    players.forEach((player) => {
      const teamId = player.team?.id || 'unknown';
      const teamName = player.team?.name || 'Inconnue';
      const game = player.game;
      const key = `${teamId}-${game}`;
      if (!groups[key]) {
        groups[key] = {
          teamName,
          teamImageUrl: player.team?.imageUrl,
          game,
          players: [],
        };
      }
      groups[key].players.push(player);
    });
    return Object.entries(groups)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [players]);

  if (loading) return <div className="page container" id="results-loading"><div className="skeleton" style={{ height: 400 }} /></div>;

  const isMultiGame = league && league.games.length > 1;

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

      {myRoster && (
        <div className="my-roster-section" style={{ marginTop: '32px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Mon Équipe</h2>
          <div className="card result-card winner" style={{ cursor: 'default' }}>
            <div className="result-header">
              <div className="result-header-left">
                <div className="result-user">
                  <span className="result-username">{myRoster.user?.username || 'Inconnu'}</span>
                </div>
              </div>
              <div className="result-score">
                <span className="score-value text-primary">
                  {(myRoster.totalScore || 0).toFixed(1)}
                </span>
                <span className="score-unit">pts</span>
              </div>
            </div>
            <div className="result-picks" style={{ marginTop: '16px' }}>
              {myRoster.picks.map((pick: any) => {
                const playerInfo = players.find(p => p.id === pick.proPlayer.id);
                const score = playerInfo?.performances?.[0]?.score;
                return (
                  <div key={pick.id} className="result-pick" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-light)' }}>
                    <span className="result-pick-name" style={{ fontWeight: 600 }}>{pick.proPlayer.name}</span>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span className="result-pick-team text-secondary" style={{ fontSize: '0.9rem' }}>
                        {(pick.proPlayer.team?.acronym || pick.proPlayer.team?.name || '')} · {pick.proPlayer.role}
                      </span>
                      <span className="result-pick-score font-bold">
                        {score !== undefined && score !== null
                          ? `${score.toFixed(1)} pts`
                          : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Classement de la journée</h2>
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

      <div className="players-results-section" style={{ marginTop: '32px', paddingBottom: '32px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', fontWeight: 600 }}>Performances des joueurs</h2>
        <div className="player-groups" id="results-player-groups" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupedPlayers.length === 0 && (
            <div className="empty-state text-center text-secondary p-4">
              Aucun joueur trouvé
            </div>
          )}
          {groupedPlayers.map((group) => {
            const isExpanded = expandedTeams.has(group.key);
            const gameTag = isMultiGame ? (GAME_TAGS[group.game] || group.game) : GAME_TAGS[group.game] || group.game;
            
            return (
              <div key={group.key} className="team-group card" style={{ padding: '0', overflow: 'hidden' }}>
                <div 
                  className="team-group-header" 
                  onClick={() => toggleTeam(group.key)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '16px', cursor: 'pointer', background: 'var(--bg-card)',
                    borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'inline-block', width: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    {group.teamImageUrl && (
                      <img src={group.teamImageUrl} alt={group.teamName} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{group.teamName}</span>
                  </div>
                  <span className="badge badge-info">{gameTag}</span>
                </div>
                
                {isExpanded && (
                  <div className="player-grid" style={{ padding: '16px', background: 'var(--bg-light)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                    {group.players.map((player) => {
                      const displayRole = player.role;
                      const score = player.performances?.[0]?.score;
                      return (
                        <div
                          key={player.id}
                          className="card player-card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div className="player-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span className="player-name" style={{ fontWeight: 600 }}>{player.name}</span>
                              <span className="badge badge-info" style={{ width: 'fit-content', marginTop: '4px' }}>{displayRole}</span>
                            </div>
                          </div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: score !== null && score !== undefined ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {score !== null && score !== undefined ? `${score.toFixed(1)} pts` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

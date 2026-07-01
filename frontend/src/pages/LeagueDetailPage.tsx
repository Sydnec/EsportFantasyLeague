import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { rostersApi } from '../api/rosters';
import { useAuthStore } from '../stores/auth.store';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { MatchGroupList } from '../components/MatchGroupList';
import { type League, type MatchDay, type Roster } from '../types';
import './LeagueDetailPage.css';

export function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [league, setLeague] = useState<League | null>(null);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [userRosters, setUserRosters] = useState<Roster[]>([]);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);


  useEffect(() => {
    if (!id) return;
    leaguesApi.getById(id).then(setLeague);
    rostersApi.getAll(id).then(setUserRosters);
    leaguesApi.getById(id).then((l) => {
      matchDaysApi.getAll().then(mds => {
        const filtered = mds.filter(md => {
          if (!l.games.includes(md.game)) return false;
          const hasAllowedMatches = md.matches && md.matches.some((match: any) => {
            const isAllSelected = l.tournaments.includes(`ALL:${md.game}`);
            if (isAllSelected) return true;
            return l.tournaments.includes(match.tournamentName);
          });
          return hasAllowedMatches;
        });
        setMatchDays(filtered);
      });
    });
  }, [id]);

  useEffect(() => {
    if (matchDays.length > 0) {
      const dateMap = new Map<string, MatchDay[]>();
      matchDays.forEach(md => {
        const dateStr = new Date(md.date).toISOString().split('T')[0];
        if (!dateMap.has(dateStr)) dateMap.set(dateStr, []);
        dateMap.get(dateStr)!.push(md);
      });
      const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      const queryMatchDayId = searchParams.get('matchDayId');
      if (queryMatchDayId) {
        const targetMd = matchDays.find(md => md.id === queryMatchDayId);
        if (targetMd) {
          const targetDateStr = new Date(targetMd.date).toISOString().split('T')[0];
          setSelectedDateStr(targetDateStr);
          return;
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (sortedDates.includes(todayStr)) {
        setSelectedDateStr(todayStr);
      } else if (sortedDates.length > 0) {
        setSelectedDateStr(sortedDates[0]);
      }
    }
  }, [matchDays, searchParams]);

  const copyInviteCode = () => {
    if (league) {
      navigator.clipboard.writeText(league.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!league) return <div className="page container" id="league-detail-loading"><div className="skeleton" style={{ height: 400 }} /></div>;

  const handleDelete = async () => {
    try {
      await leaguesApi.delete(league.id);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression de la ligue");
    }
  };

  return (
    <div className="page container" id="league-detail-page">
      <div className="league-header" id="league-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h1 className="league-title" id="league-detail-title" style={{ margin: 0 }}>{league.name}</h1>
          {(!league.onlyCreatorInvites || user?.id === league.createdById) && (
            <span 
              className="badge badge-info cursor-pointer" 
              id="league-detail-invite-badge" 
              onClick={copyInviteCode}
              style={{ fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px' }}
            >
              🔗 {copied ? 'Copié !' : league.inviteCode}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowLeaderboard(true)} id="league-detail-leaderboard-btn" style={{ padding: '0 16px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 Classement
          </button>
          {user?.id === league.createdById && (
            <button className="btn btn-danger btn-delete-league" id="league-detail-delete-btn" onClick={() => setShowDeleteModal(true)}>
              🗑️ Supprimer la ligue
            </button>
          )}
        </div>
      </div>

      <div className="league-content" id="league-detail-content" style={{ display: 'block' }}>
        <div className="league-matchdays" id="league-detail-matchdays">
          <div className="matchday-list" id="league-detail-matchday-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(() => {
              const grouped: { dateStr: string; dateObj: Date; matchDays: MatchDay[] }[] = [];
              const dateMap = new Map<string, MatchDay[]>();
              
              matchDays.forEach(md => {
                const dateStr = new Date(md.date).toISOString().split('T')[0];
                if (!dateMap.has(dateStr)) dateMap.set(dateStr, []);
                dateMap.get(dateStr)!.push(md);
              });
              
              dateMap.forEach((mds, dateStr) => {
                grouped.push({ dateStr, dateObj: new Date(dateStr), matchDays: mds });
              });
              
              grouped.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

              if (grouped.length === 0) {
                return (
                  <div className="card text-center" style={{ padding: 32 }}>
                    <p className="text-secondary">Aucune journée de match disponible</p>
                  </div>
                );
              }

              // Helper to compute stats for a date
              const getDayStats = (dayMds: MatchDay[]) => {
                const allRelevantMatchTimes: number[] = [];
                dayMds.forEach(md => {
                  if (!md.matches) return;
                  const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
                  md.matches.forEach((match: any) => {
                    if (isAllSelected || league.tournaments.includes(match.tournamentName)) {
                      allRelevantMatchTimes.push(new Date(match.scheduledAt).getTime());
                    }
                  });
                });
                allRelevantMatchTimes.sort((a, b) => a - b);
                
                const earliestMatchTime = allRelevantMatchTimes[0];
                const effectiveLockTime = earliestMatchTime 
                  ? new Date(earliestMatchTime - 60 * 60 * 1000) 
                  : null;
                
                const now = Date.now();
                const isLocked = effectiveLockTime ? now >= effectiveLockTime.getTime() : false;
                const isScoredAll = dayMds.every(md => md.status === 'SCORED');
                const compositeStatus = isScoredAll ? 'SCORED' : isLocked ? 'LOCKED' : 'OPEN';

                return {
                  totalMatches: allRelevantMatchTimes.length,
                  effectiveLockTime,
                  compositeStatus
                };
              };

              const activeGroup = grouped.find(g => g.dateStr === selectedDateStr) || grouped[0];
              const activeStats = getDayStats(activeGroup.matchDays);

              return (
                <>
                  {/* Horizontal Timeline */}
                  <div className="timeline-container" id="league-detail-timeline">
                    {grouped.map(({ dateStr, dateObj, matchDays: dayMds }) => {
                      const isSelected = selectedDateStr === dateStr;
                      const { compositeStatus } = getDayStats(dayMds);
                      
                      const dotColor = compositeStatus === 'SCORED' 
                        ? '#00d4ff' 
                        : compositeStatus === 'LOCKED' 
                          ? '#f59e0b' 
                          : '#10b981';

                      const hasRoster = dayMds.some(md => userRosters.some(ur => ur.matchDay?.id === md.id));

                      return (
                        <div 
                          key={dateStr}
                          className={`timeline-item ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedDateStr(dateStr)}
                        >
                          {compositeStatus === 'OPEN' && !hasRoster && (
                            <div className="timeline-alert-dot" title="Équipe non validée" />
                          )}
                          <span className="timeline-day-name">
                            {dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <span className="timeline-day-num">
                            {dateObj.getDate()}
                          </span>
                          <div 
                            className="timeline-status-dot" 
                            style={{ background: isSelected ? 'white' : dotColor }} 
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Day Detail Card */}
                  <div className="card matchday-card" id={`league-detail-matchday-card-${activeGroup.dateStr}`}>
                    <div 
                      className="matchday-card-header" 
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', cursor: 'default' }}
                    >
                      <div className="matchday-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="matchday-date" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {activeGroup.dateObj.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </span>
                        <StatusBadge status={activeStats.compositeStatus as any} />
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'var(--bg-light)', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          border: '1px solid var(--border-light)', 
                          color: 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          {activeStats.totalMatches} match{activeStats.totalMatches > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="matchday-header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {activeStats.compositeStatus === 'OPEN' && activeStats.effectiveLockTime && (
                          <div className="matchday-countdown" style={{ fontSize: '0.8rem' }}>
                            <CountdownTimer targetDate={activeStats.effectiveLockTime.toISOString()} />
                          </div>
                        )}
                        <div className="matchday-actions" style={{ display: 'flex', gap: '6px' }}>
                          {(() => {
                            // Find all valid match days for this date
                            const validMatchDays = activeGroup.matchDays.filter(md => {
                              if (!md.matches || md.matches.length === 0) return false;
                              return md.matches.some((match: any) => {
                                const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
                                if (isAllSelected) return true;
                                return league.tournaments.includes(match.tournamentName);
                              });
                            });

                            if (validMatchDays.length === 0) return null;

                            // Find if we already have a roster for any of these match days
                            const existingRoster = userRosters.find(ur => validMatchDays.some(md => md.id === ur.matchDay?.id));
                            const hasRoster = !!existingRoster;
                            
                            // The target match day ID to navigate to: the one with the roster, or just the first valid one
                            const targetMatchDayId = existingRoster ? existingRoster.matchDay.id : validMatchDays[0].id;
                            
                            const buttonLabel = hasRoster ? "Mon équipe" : "Choisir mon équipe";
                            
                            const now = new Date();
                            const targetDate = activeGroup.dateObj;
                            const isPastOrToday = new Date(targetDate.toDateString()) <= new Date(now.toDateString());
                            const isLockedOrScored = activeStats.compositeStatus === 'LOCKED' || activeStats.compositeStatus === 'SCORED';
                            
                            const isDisabled = !hasRoster && isPastOrToday && isLockedOrScored;
                            const tooltipText = isDisabled 
                              ? "Vous n'avez pas composé d'équipe pour cette journée verrouillée/passée" 
                              : undefined;

                            return (
                              <button 
                                className={isDisabled ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"} 
                                style={{ 
                                  padding: '4px 10px', 
                                  fontSize: '0.75rem',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.5 : 1
                                }} 
                                id={`league-detail-btn-roster-${targetMatchDayId}`} 
                                onClick={() => {
                                  if (!isDisabled) {
                                    navigate(`/leagues/${id}/roster/${targetMatchDayId}`);
                                  }
                                }}
                                title={tooltipText}
                                disabled={isDisabled}
                              >
                                {buttonLabel}
                              </button>
                            );
                          })()}
                          {activeStats.compositeStatus === 'SCORED' && (
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                              id={`league-detail-btn-results-${activeGroup.matchDays[0].id}`} 
                              onClick={() => {
                                // Find the match day that was scored
                                const scoredMd = activeGroup.matchDays.find(md => md.status === 'SCORED') || activeGroup.matchDays[0];
                                navigate(`/leagues/${id}/results/${scoredMd.id}`);
                              }}
                            >
                              Résultats
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="matchday-matches" style={{ padding: '20px' }}>
                      {(() => {
                        const flattenedMatches: any[] = [];
                        activeGroup.matchDays.forEach(md => {
                          if (!md.matches) return;
                          
                          const allowedMatches = md.matches.filter((match: any) => {
                            const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
                            if (isAllSelected) return true;
                            return league.tournaments.includes(match.tournamentName);
                          });

                          allowedMatches.forEach((m: any) => {
                             flattenedMatches.push({ ...m, game: md.game });
                          });
                        });

                        if (flattenedMatches.length === 0) {
                          return <p className="text-secondary text-center">Aucun match disponible pour cette journée</p>;
                        }

                        return <MatchGroupList matches={flattenedMatches} />;
                      })()}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" id="league-detail-delete-modal">
          <div className="card modal-content p-6">
            <h3 className="modal-title">Supprimer la ligue ?</h3>
            <p className="modal-text">
              Êtes-vous sûr de vouloir supprimer la ligue <strong>{league.name}</strong> ? Cette action est irréversible et supprimera toutes les équipes associées.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="btn btn-danger btn-delete-league" onClick={handleDelete}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="modal-overlay" id="league-detail-leaderboard-modal" onClick={() => setShowLeaderboard(false)}>
          <div className="card modal-content p-6" style={{ maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>🏆 Classement - {league.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLeaderboard(false)}>✕</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="leaderboard-table" id="league-detail-leaderboard-table" style={{ fontSize: '0.9rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px' }}>#</th>
                    <th style={{ padding: '10px' }}>Joueur</th>
                    <th className="text-right" style={{ padding: '10px' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {league.members.map((member, i) => (
                    <tr key={member.id} className={`rank-${i + 1} ${member.user.id === user?.id ? 'current-user' : ''}`}>
                      <td style={{ padding: '10px' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td className={member.user.id === user?.id ? 'font-bold' : ''} style={{ padding: '10px' }}>
                        {member.user.username}
                      </td>
                      <td className="text-right font-semibold" style={{ padding: '10px' }}>
                        {member.totalScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

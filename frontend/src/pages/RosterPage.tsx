import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proPlayersApi } from '../api/pro-players';
import { rostersApi } from '../api/rosters';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { CountdownTimer } from '../components/CountdownTimer';
import { type ProPlayer, type League, type MatchDay } from '../types';
import './RosterPage.css';

const GAME_TAGS: Record<string, string> = {
  LEAGUE_OF_LEGENDS: 'LoL',
  COUNTER_STRIKE: 'CS',
  VALORANT: 'VAL',
  ROCKET_LEAGUE: 'RL',
};

export function RosterPage() {
  const { leagueId, matchDayId } = useParams<{ leagueId: string; matchDayId: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<ProPlayer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [cooldownPlayers, setCooldownPlayers] = useState<Set<string>>(new Set());
  const [league, setLeague] = useState<League | null>(null);
  const [matchDay, setMatchDay] = useState<(MatchDay & { performances: any[] }) | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingRoster, setExistingRoster] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

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

        // Find all match days on the same date for the league's games
        const targetDateStr = new Date(targetMd.date).toISOString().split('T')[0];
        const siblingMds = allMds.filter(md => 
          new Date(md.date).toISOString().split('T')[0] === targetDateStr &&
          l.games.includes(md.game)
        );

        // Fetch pro players for all sibling match days
        const playersArrays = await Promise.all(siblingMds.map(md => 
          proPlayersApi.getByMatchDay(md.id, leagueId)
        ));

        // Compute cooldown logic in frontend
        const relevantMatchDays = allMds
          .filter(md => 
            l.games.includes(md.game) &&
            new Date(md.date).getTime() < new Date(targetMd.date).getTime()
          )
          .filter(md => {
            if (!md.matches) return false;
            return md.matches.some((m: any) => {
              const isAllSelected = l.tournaments.includes(`ALL:${md.game}`);
              if (isAllSelected) return true;
              const leagueName = m.tournamentName?.split(' / ')[0];
              return l.tournaments.includes(leagueName || '');
            });
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, l.cooldownDays);

        const cooldownMdIds = relevantMatchDays.map(md => md.id);

        const userRosters = await rostersApi.getAll(leagueId);
        const cooldownPlayerIds = new Set<string>();
        userRosters.forEach(roster => {
          if (cooldownMdIds.includes(roster.matchDay.id)) {
            roster.picks.forEach(pick => {
              cooldownPlayerIds.add(pick.proPlayer.id);
            });
          }
        });

        const matchRoster = userRosters.find(ur => siblingMds.some(sm => sm.id === ur.matchDay.id));
        if (matchRoster) {
          setExistingRoster(matchRoster);
          setSelected(matchRoster.picks.map((p: any) => p.proPlayer.id));
          setIsEditing(false);
        }

        setCooldownPlayers(cooldownPlayerIds);
        setMatchDay(targetMd);
        setPlayers(playersArrays.flat());
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [leagueId, matchDayId]);

  const togglePlayer = (playerId: string) => {
    setError('');
    if (selected.includes(playerId)) {
      setSelected(selected.filter((id) => id !== playerId));
    } else if (league && selected.length < league.rosterSize) {
      setSelected([...selected, playerId]);
    }
  };

  const handleSubmit = async () => {
    if (!leagueId || !matchDayId) return;
    setSubmitting(true);
    setError('');
    try {
      if (existingRoster) {
        await rostersApi.update(existingRoster.id, selected);
      } else {
        await rostersApi.create({ leagueId, matchDayId, proPlayerIds: selected });
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de la validation de l\'équipe');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.team?.acronym || p.team?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase()),
  );

  const groupedPlayers = useMemo(() => {
    const groups: Record<string, { teamName: string; teamImageUrl?: string | null; game: string; players: ProPlayer[] }> = {};
    filtered.forEach((player) => {
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
  }, [filtered]);

  if (loading) return <div className="page container" id="roster-loading"><div className="skeleton" style={{ height: 500 }} /></div>;

  if (success) {
    return (
      <div className="page container" id="roster-success-page">
        <div className="card text-center" id="roster-success-card" style={{ maxWidth: 500, margin: '0 auto', padding: 48 }}>
          <span className="empty-state-icon">✅</span>
          <h2 className="mt-16" id="roster-success-title">Équipe validée !</h2>
          <p className="text-secondary mt-8 mb-24" id="roster-success-subtitle">Tes choix sont verrouillés. Bonne chance !</p>
          <button className="btn btn-primary" id="roster-btn-back-league" onClick={() => navigate(`/leagues/${leagueId}`)}>Retour à la ligue</button>
        </div>
      </div>
    );
  }

  const isMultiGame = league && league.games.length > 1;

  if (!isEditing && existingRoster) {
    const isLocked = matchDay ? new Date() >= new Date(matchDay.lockTime) : true;
    return (
      <div className="page container" id="roster-page">
        <div className="roster-header" id="roster-header">
          <div>
            <h1 id="roster-title">Ton équipe</h1>
            <div className="roster-header-meta" id="roster-meta">
              <span className="text-secondary">{league?.name}</span>
              <span>•</span>
              <span>{matchDay ? new Date(matchDay.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {matchDay && !isLocked && (
              <>
                <CountdownTimer targetDate={matchDay.lockTime} />
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                  id="roster-btn-edit"
                >
                  Modifier
                </button>
              </>
            )}
            {isLocked && <span className="badge badge-warning">🔒 Verrouillé</span>}
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1200px', margin: '32px auto 0 auto' }} id="roster-view-card">
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }} id="roster-view-cards-container">
            {selected.map((id) => {
              const player = players.find(p => p.id === id);
              if (!player) return null;
              const gameTag = isMultiGame ? (GAME_TAGS[player.game] || player.game) : '';
              const displayRole = gameTag ? `[${gameTag}] ${player.role}` : player.role;
              const avatarUrl = player.imageUrl || player.team?.imageUrl || '';
              return (
                <div 
                  key={id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '24px',
                    width: '200px',
                    textAlign: 'center',
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={player.name} 
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: player.imageUrl ? '50%' : '8px', 
                        objectFit: player.imageUrl ? 'cover' : 'contain', 
                        marginBottom: '16px',
                        marginTop: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        padding: player.imageUrl ? '0' : '8px'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: 'var(--border-light)', 
                      marginBottom: '16px', 
                      marginTop: '8px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '1.8rem' 
                    }}>
                      👤
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', wordBreak: 'break-word', minHeight: '27px' }}>{player.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                    {player.imageUrl && player.team?.imageUrl && (
                      <img src={player.team.imageUrl} alt={player.team.name} style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                    )}
                    <span>{player.team?.acronym || player.team?.name || ''}</span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem', marginTop: '16px', padding: '6px 12px' }}>
                    {displayRole}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <button className="btn btn-ghost" style={{ maxWidth: '300px' }} onClick={() => navigate(`/leagues/${leagueId}?matchDayId=${matchDayId}`)}>Retour à la ligue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page container" id="roster-page">
      <div className="roster-header" id="roster-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '8px 12px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => navigate(`/leagues/${leagueId}?matchDayId=${matchDayId}`)}
            title="Retour à la ligue"
          >
            ←
          </button>
          <div>
            <h1 id="roster-title" style={{ margin: 0 }}>Faire son équipe</h1>
            <div className="roster-header-meta" id="roster-meta">
              <span className="text-secondary">{league?.name}</span>
              <span>•</span>
              <span>{matchDay ? new Date(matchDay.date).toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}</span>
            </div>
          </div>
        </div>
        {matchDay && <CountdownTimer targetDate={matchDay.lockTime} />}
      </div>

      <div className="roster-layout" id="roster-layout">
        <div className="roster-available" id="roster-available">
          <div className="roster-search" id="roster-search">
            <input id="roster-search-input" type="text" className="input-field" placeholder="🔍 Rechercher des joueurs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="player-groups" id="roster-player-groups" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        const isSelected = selected.includes(player.id);
                        const isCooldown = cooldownPlayers.has(player.id);
                        const displayRole = player.role;
                        return (
                          <div
                            key={player.id}
                            id={`roster-player-card-${player.id}`}
                            className={`card player-card ${isSelected ? 'selected' : ''} ${isCooldown ? 'cooldown' : ''}`}
                            onClick={() => !isCooldown && togglePlayer(player.id)}
                            style={{
                              opacity: isCooldown ? 0.6 : 1,
                              cursor: isCooldown ? 'not-allowed' : 'pointer',
                              pointerEvents: isCooldown ? 'all' : 'auto',
                              border: isCooldown ? '1px dashed var(--border-light)' : undefined,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div className="player-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span className="player-name" style={{ fontWeight: 600 }}>{player.name}</span>
                              </div>
                            </div>
                            {isCooldown ? (
                              <span className="badge badge-warning" style={{ background: '#f59e0b20', color: '#d97706', border: '1px solid #d9770630' }}>🔒 Récupération</span>
                            ) : (
                              <span className="badge badge-info">{displayRole}</span>
                            )}
                            {isSelected && <span className="player-check">✓</span>}
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

        <div className="roster-selected" id="roster-selected">
          <div className="card roster-panel" id="roster-panel">
            <h3 id="roster-panel-title">Ton équipe ({selected.length}/{league?.rosterSize || 0})</h3>
            <div className="roster-progress" id="roster-progress">
              <div className="roster-progress-bar" style={{ width: `${league ? (selected.length / league.rosterSize) * 100 : 0}%` }} />
            </div>
            <div className="selected-list" id="roster-selected-list">
              {selected.map((id) => {
                const player = players.find((p) => p.id === id);
                if (!player) return null;
                const gameTag = isMultiGame ? (GAME_TAGS[player.game] || player.game) : '';
                const displayRole = gameTag ? `[${gameTag}] ${player.role}` : player.role;
                return (
                  <div key={id} className="selected-player" id={`roster-selected-player-${id}`}>
                    {player.team?.imageUrl && (
                      <img 
                        src={player.team.imageUrl} 
                        alt={player.team.name} 
                        style={{ width: '28px', height: '28px', objectFit: 'contain', marginRight: '8px' }} 
                      />
                    )}
                    <div className="selected-info">
                      <span className="selected-name">{player.name}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>{player.team?.acronym || player.team?.name || ''} · {displayRole}</span>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" id={`roster-btn-remove-${id}`} onClick={(e) => { e.stopPropagation(); togglePlayer(id); }}>✕</button>
                  </div>
                );
              })}
              {league && selected.length < league.rosterSize && (
                Array.from({ length: league.rosterSize - selected.length }).map((_, i) => (
                   <div key={`empty-${i}`} className="selected-player empty" id={`roster-empty-slot-${i}`}>
                    <span className="text-muted">Emplacement vide</span>
                  </div>
                ))
              )}
            </div>
            {error && <p className="alert alert-danger mt-12" id="roster-error">{error}</p>}
            <div className="roster-actions" id="roster-actions">
              <button className="btn btn-ghost btn-sm" id="roster-btn-back-edit" onClick={() => navigate(`/leagues/${leagueId}?matchDayId=${matchDayId}`)}>Annuler</button>
              <button className="btn btn-ghost btn-sm" id="roster-btn-clear" onClick={() => setSelected([])} disabled={selected.length === 0}>Tout effacer</button>
              <button className="btn btn-primary" id="roster-btn-submit" onClick={handleSubmit} disabled={!league || selected.length !== league.rosterSize || submitting}>
                {submitting ? 'Validation...' : 'Valider l\'équipe'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

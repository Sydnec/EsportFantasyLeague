import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchesApi } from '../api/matches';
import './MatchDetailPage.css';

export function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!matchId) return;
    
    let isSubscribed = true;

    const fetchMatch = () => {
      matchesApi.getById(matchId).then((data) => {
        if (!isSubscribed) return;
        setMatch(data);
        setLoading(false);
      }).catch(() => {
        if (!isSubscribed) return;
        setLoading(false);
      });
    };

    fetchMatch();

    // Actualisation des données toutes les 20 secondes
    const dataInterval = setInterval(() => {
      fetchMatch();
    }, 20000);

    // Actualisation purement visuelle du timer toutes les minutes (pour être sûr)
    const uiInterval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => {
      isSubscribed = false;
      clearInterval(dataInterval);
      clearInterval(uiInterval);
    };
  }, [matchId]);

  if (loading) {
    return <div className="page container" style={{ textAlign: 'center', paddingTop: '40px' }}>Chargement...</div>;
  }

  if (!match) {
    return (
      <div className="page container" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <h2>Match introuvable</h2>
        <button className="btn btn-secondary mt-4" onClick={() => navigate(-1)}>Retour</button>
      </div>
    );
  }

  // Extract players and performances
  let teamAPlayers = match.teamA?.players?.filter((p: any) => p.isActive) || [];
  let teamBPlayers = match.teamB?.players?.filter((p: any) => p.isActive) || [];

  // Filter exact active roster if match started/finished and performances exist
  if ((match.status === 'finished' || match.status === 'running') && match.matchDay?.performances?.length > 0) {
    const performedIds = new Set(match.matchDay.performances.map((p: any) => p.proPlayerId));
    teamAPlayers = match.teamA?.players?.filter((p: any) => performedIds.has(p.id)) || [];
    teamBPlayers = match.teamB?.players?.filter((p: any) => performedIds.has(p.id)) || [];
  }

  const fluidTournamentName = match.tournamentName?.replace(' / ', ' - ');
  
  const formatGameName = (game: string) => {
    const map: Record<string, string> = {
      'LEAGUE_OF_LEGENDS': 'League of Legends',
      'COUNTER_STRIKE': 'Counter-Strike',
      'VALORANT': 'Valorant',
      'DOTA_2': 'Dota 2',
      'ROCKET_LEAGUE': 'Rocket League',
      'OVERWATCH': 'Overwatch',
      'CALL_OF_DUTY': 'Call of Duty',
      'RAINBOW_SIX_SIEGE': 'Rainbow Six Siege'
    };
    return map[game] || game.replace(/_/g, ' ');
  };

  const getRunningTimeDisplay = (scheduledAt: string) => {
    const minutesPassed = Math.max(0, Math.floor((now - new Date(scheduledAt).getTime()) / 60000));
    return minutesPassed >= 60 
      ? `${Math.floor(minutesPassed / 60)} h ${minutesPassed % 60} min`
      : `${minutesPassed} min`;
  };

  const matchDate = match.scheduledAt ? new Date(match.scheduledAt).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '';

  const getPlayerStats = (playerId: string) => {
    const perf = match.matchDay?.performances?.find((p: any) => p.proPlayer?.id === playerId);
    return perf ? perf : null;
  };

  return (
    <div className="page container match-detail-page">
      {/* Match Header */}
      <div className="match-detail-header">
        <div className="match-header-top" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, top: 0 }}>
            <button className="btn btn-secondary back-btn-integrated" onClick={() => navigate(-1)}>
              &larr; Retour
            </button>
          </div>
          <div className="match-detail-tournament-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {match.matchDay?.game && <div className="match-detail-game">{formatGameName(match.matchDay.game)}</div>}
            <div className="match-detail-tournament">
              {fluidTournamentName}
            </div>
            {matchDate && <div className="match-detail-date">{matchDate}</div>}
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0 }}>
            {match.status === 'running' && match.streamUrl && (
              <a href={match.streamUrl} target="_blank" rel="noopener noreferrer" className="status-badge running stream-link-top">
                🔴 Regarder
              </a>
            )}
          </div>
        </div>
        <div className="match-detail-scoreboard-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
          <div className="match-detail-scoreboard-main" style={{ display: 'flex', justifyContent: 'center', width: '100%', gap: '32px', alignItems: 'center' }}>
            <div className="team-col team-a">
              {match.teamA?.imageUrl && <img src={match.teamA.imageUrl} alt={match.teamA.name} className="team-logo-lg" />}
              <h2 className="team-name">
                {match.teamA?.location && <span className={`fi fi-${match.teamA.location.toLowerCase()} flag-icon-lg`}></span>}
                {match.teamA?.name || 'TBD'}
              </h2>
            </div>
            
            <div className="score-col">
              <div className="status-badges">
                <div className={`status-badge ${match.status}`}>
                  {match.status === 'running' 
                    ? `En cours depuis ${getRunningTimeDisplay(match.scheduledAt)}` 
                    : match.status === 'finished' ? 'Terminé' : match.status === 'canceled' ? 'Annulé' : 'À venir'}
                </div>
              </div>
              <div className="score-display">
                <span className={`score ${match.winnerId === match.teamAId ? 'winner' : ''}`}>{match.teamAScore ?? 0}</span>
                <span className="divider">-</span>
                <span className={`score ${match.winnerId === match.teamBId ? 'winner' : ''}`}>{match.teamBScore ?? 0}</span>
              </div>
            </div>
            
            <div className="team-col team-b">
              {match.teamB?.imageUrl && <img src={match.teamB.imageUrl} alt={match.teamB.name} className="team-logo-lg" />}
              <h2 className="team-name">
                {match.teamB?.location && <span className={`fi fi-${match.teamB.location.toLowerCase()} flag-icon-lg`}></span>}
                {match.teamB?.name || 'TBD'}
              </h2>
            </div>
          </div>
          
          <div className="match-detail-scoreboard-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Format info simple */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: '500', marginBottom: '8px' }}>
              {match.matchType && match.numberOfGames ? (
                `Format: ${match.matchType === 'best_of' ? 'BO' : match.matchType === 'first_to' ? 'FT' : match.matchType}${match.numberOfGames}`
              ) : (() => {
                const aWins = match.games?.filter((g: any) => g.winner?.id?.toString() === match.teamAId).length || 0;
                const bWins = match.games?.filter((g: any) => g.winner?.id?.toString() === match.teamBId).length || 0;
                const maxWins = Math.max(aWins, bWins);
                if (maxWins > 0) return `Format: BO${maxWins * 2 - 1}`;
                return match.games?.length ? `${match.games.length} manche(s)` : '';
              })()}
            </div>

            {/* Timeline spanning wider */}
            {match.games && match.games.length > 0 && (
              <div className="games-list-compact" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {match.games.map((g: any, index: number) => {
                  const hasRealScore = g.teamAScore != null && g.teamBScore != null;
                  // Never infer the winner from score comparison — a LoL game's
                  // score is a kill count, which doesn't reliably indicate who
                  // won (objective/backdoor wins with fewer kills happen).
                  // `winnerSide` (enriched sources) / `winner.id` (raw Pandascore
                  // blob) are the only trustworthy signals.
                  const teamAWon = g.winnerSide ? g.winnerSide === 'A' : g.winner?.id?.toString() === match.teamAId;
                  const teamBWon = g.winnerSide ? g.winnerSide === 'B' : g.winner?.id?.toString() === match.teamBId;
                  return (
                    <div key={g.id || index} className="game-row-compact" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '32px' }}>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <span className={teamAWon ? 'game-winner' : 'game-loser'}>
                          {hasRealScore ? g.teamAScore : (teamAWon ? '1' : '0')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                        {g.map && (
                          <span className="game-map" style={{ textAlign: 'center', fontWeight: 600 }}>{g.map}</span>
                        )}
                        <span className="game-duration" style={{ textAlign: 'center' }}>
                          {g.length ? (
                            g.length >= 3600
                              ? `${Math.floor(g.length / 3600)} h ${Math.floor((g.length % 3600) / 60)} min ${g.length % 60} sec`
                              : `${Math.floor(g.length / 60)} min ${g.length % 60} sec`
                          ) : (!g.map ? '-' : null)}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <span className={teamBWon ? 'game-winner' : 'game-loser'}>
                          {hasRealScore ? g.teamBScore : (teamBWon ? '1' : '0')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performances */}
        <div className="match-performances-section" style={{ borderTop: '1px solid var(--border-light)', marginTop: '24px', paddingTop: '24px' }}>
          <div className="performances-grid">
          
          <div className="team-performances">
            <div className="performances-list compact">
              {teamAPlayers.length > 0 ? teamAPlayers.map((player: any) => {
                const pStats = getPlayerStats(player.id);
                const score = pStats?.score;
                const rawStats = pStats?.rawStats;
                const pImage = player.imageUrl || match.teamA?.imageUrl;
                
                return (
                <div key={player.id} className="performance-card compact">
                  <div className="player-avatar-wrapper compact">
                    {pImage ? (
                      <img src={pImage} alt={player.name} className={`player-avatar compact ${!player.imageUrl ? 'fallback' : ''}`} />
                    ) : (
                      <div className="player-avatar-placeholder compact">{player.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="player-info">
                    <span className="player-name">
                      {player.nationality && <span className={`fi fi-${player.nationality.toLowerCase()} flag-icon-sm`} style={{marginRight: '6px', fontSize: '0.85em'}}></span>}
                      {player.name}
                    </span>
                    {player.role && <span className="player-role">{player.role}</span>}
                    {rawStats?.games && rawStats.games.length > 0 && (
                      <div className="player-champions">
                        {rawStats.games.map((g: any, i: number) => 
                          g.champion ? (
                            <img key={i} src={g.champion.image_url} alt={g.champion.name} title={g.champion.name} className="champion-icon" />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                  <div className="player-score-container">
                    <div className="player-score player-kda">
                      {rawStats ? (
                        <>
                          <span className="kda-value">{rawStats.kills ?? 0}</span>
                          <span className="kda-sep">/</span>
                          <span className="kda-value">{rawStats.deaths ?? 0}</span>
                          <span className="kda-sep">/</span>
                          <span className="kda-value">{rawStats.assists ?? 0}</span>
                        </>
                      ) : '-'}
                    </div>
                    <div className="player-advanced-stat">
                      {score !== undefined && score !== null ? score : '-'} pts
                      {rawStats?.win || rawStats?.mapWin ? ' (Victoire)' : ''}
                    </div>
                  </div>
                </div>
              )}) : <div className="no-data">Aucun joueur trouvé</div>}
            </div>
          </div>

          <div className="performances-separator"></div>

          <div className="team-performances">
            <div className="performances-list compact">
              {teamBPlayers.length > 0 ? teamBPlayers.map((player: any) => {
                const pStats = getPlayerStats(player.id);
                const score = pStats?.score;
                const rawStats = pStats?.rawStats;
                const pImage = player.imageUrl || match.teamB?.imageUrl;
                
                return (
                <div key={player.id} className="performance-card compact">
                  <div className="player-avatar-wrapper compact">
                    {pImage ? (
                      <img src={pImage} alt={player.name} className={`player-avatar compact ${!player.imageUrl ? 'fallback' : ''}`} />
                    ) : (
                      <div className="player-avatar-placeholder compact">{player.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="player-info">
                    <span className="player-name">
                      {player.nationality && <span className={`fi fi-${player.nationality.toLowerCase()} flag-icon-sm`} style={{marginRight: '6px', fontSize: '0.85em'}}></span>}
                      {player.name}
                    </span>
                    {player.role && <span className="player-role">{player.role}</span>}
                    {rawStats?.games && rawStats.games.length > 0 && (
                      <div className="player-champions">
                        {rawStats.games.map((g: any, i: number) => 
                          g.champion ? (
                            <img key={i} src={g.champion.image_url} alt={g.champion.name} title={g.champion.name} className="champion-icon" />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                  <div className="player-score-container">
                    <div className="player-score player-kda">
                      {rawStats ? (
                        <>
                          <span className="kda-value">{rawStats.kills ?? 0}</span>
                          <span className="kda-sep">/</span>
                          <span className="kda-value">{rawStats.deaths ?? 0}</span>
                          <span className="kda-sep">/</span>
                          <span className="kda-value">{rawStats.assists ?? 0}</span>
                        </>
                      ) : '-'}
                    </div>
                    <div className="player-advanced-stat">
                      {score !== undefined && score !== null ? score : '-'} pts
                      {rawStats?.win || rawStats?.mapWin ? ' (Victoire)' : ''}
                    </div>
                  </div>
                </div>
              )}) : <div className="no-data">Aucun joueur trouvé</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

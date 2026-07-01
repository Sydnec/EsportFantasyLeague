import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { leaguesApi } from '../api/leagues';
import { matchDaysApi } from '../api/match-days';
import { rostersApi } from '../api/rosters';
import { GameBadge } from '../components/GameBadge';
import { type League, type MatchDay, type Roster } from '../types';
import './DashboardPage.css';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [matchDays, setMatchDays] = useState<MatchDay[]>([]);
  const [rosters, setRosters] = useState<Roster[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      leaguesApi.getAll(),
      matchDaysApi.getAll(),
      rostersApi.getAll()
    ]).then(([leaguesData, matchDaysData, rostersData]) => {
      setLeagues(leaguesData);
      setMatchDays(matchDaysData);
      setRosters(rostersData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const todayStr = new Date().toLocaleDateString('en-CA');

  const getMissingRostersCount = (league: League) => {
    const todayMatchDays = matchDays.filter(md => {
      const isToday = new Date(md.date).toLocaleDateString('en-CA') === todayStr;
      if (!isToday || md.status !== 'OPEN' || !league.games.includes(md.game)) return false;
      
      const hasAllowedMatches = md.matches && md.matches.some((match: any) => {
        const isAllSelected = league.tournaments.includes(`ALL:${md.game}`);
        if (isAllSelected) return true;
        return league.tournaments.includes(match.tournamentName);
      });
      
      return hasAllowedMatches;
    });
    
    if (todayMatchDays.length === 0) return 0;

    const hasRoster = todayMatchDays.some(md => rosters.some(r => r.league.id === league.id && r.matchDay.id === md.id));
    return hasRoster ? 0 : 1;
  };

  return (
    <div className="page container" id="dashboard-page">
      <div className="dashboard-actions" id="dashboard-actions" style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-primary" id="dashboard-btn-create-join" onClick={() => navigate('/leagues/new')}>
          ✨ Créer/Rejoindre une ligue
        </button>
      </div>

      <div className="dashboard-section" id="dashboard-leagues-section">
        <h2 id="dashboard-leagues-title">Mes Ligues</h2>
        {loading ? (
          <div className="card-grid" id="dashboard-loading-grid">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
          </div>
        ) : leagues.length === 0 ? (
          <div className="empty-state card" id="dashboard-empty-state">
            <span className="empty-state-icon">🎮</span>
            <h3>Aucune ligue pour le moment</h3>
            <p>Crée ou rejoins une ligue pour commencer !</p>
          </div>
        ) : (
          <div className="card-grid" id="dashboard-leagues-grid">
            {leagues.map((league) => {
              const myMember = league.members.find((m) => m.user.id === user?.id);
              const rank = league.members.findIndex((m) => m.user.id === user?.id) + 1;
              const missingCount = getMissingRostersCount(league);
              
              return (
                <div
                  key={league.id}
                  id={`dashboard-league-card-${league.id}`}
                  className="card league-card cursor-pointer"
                  onClick={() => navigate(`/leagues/${league.id}`)}
                  style={{ position: 'relative' }}
                >
                  {missingCount > 0 && (
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'var(--warning)', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: 'var(--shadow-md)' }}>
                      Équipe à composer !
                    </div>
                  )}
                  <div className="league-card-header">
                    <h3>{league.name}</h3>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {league.games.map(game => (
                        <GameBadge key={game} game={game} size="sm" />
                      ))}
                    </div>
                  </div>
                  <div className="league-card-meta">
                    <span>👥 {league._count?.members || league.members.length}/{league.maxMembers} membres</span>
                    <span>📊 Taille d'équipe: {league.rosterSize}</span>
                  </div>
                  <div className="league-card-score">
                    <span className="rank">#{rank}</span>
                    <span className="score gradient-text">{myMember?.totalScore.toFixed(1) || '0.0'} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

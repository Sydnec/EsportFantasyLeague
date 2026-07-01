import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaguesApi } from '../api/leagues';
import { GameBadge } from '../components/GameBadge';
import { GAME_CONFIG } from '../constants/games';
import type { Game, League } from '../types';
import './CreateLeaguePage.css';

const GAMES = [
  { value: 'LEAGUE_OF_LEGENDS', label: 'League of Legends' },
  { value: 'COUNTER_STRIKE', label: 'Counter-Strike' },
  { value: 'ROCKET_LEAGUE', label: 'Rocket League' },
  { value: 'VALORANT', label: 'Valorant' },
];

export function CreateLeaguePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [games, setGames] = useState<Game[]>(['LEAGUE_OF_LEGENDS']);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Record<string, string[]>>({});
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [rosterSize, setRosterSize] = useState(5);
  const [cooldownDays, setCooldownDays] = useState(3);
  const [created, setCreated] = useState<League | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlyCreatorInvites, setOnlyCreatorInvites] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    leaguesApi.getUpcomingTournaments()
      .then(data => {
        setUpcomingTournaments(data);
        // Automatically check "Tous les tournois" for the initial games (like LEAGUE_OF_LEGENDS)
        const initialTourneys = games.map(g => `ALL:${g}`);
        setSelectedTournaments(initialTourneys);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleGame = (gameValue: Game) => {
    setGames(prev => {
      const isActivating = !prev.includes(gameValue);
      const next = isActivating ? [...prev, gameValue] : prev.filter(g => g !== gameValue);
      
      if (isActivating) {
        // Automatically check "Tous les tournois" for this game
        setSelectedTournaments(current => [...current, `ALL:${gameValue}`]);
      } else {
        // Clean up selected tournaments that belong to this deactivated game
        setSelectedTournaments(current => {
          const gameTourneys = upcomingTournaments[gameValue] || [];
          return current.filter(t => t !== `ALL:${gameValue}` && !gameTourneys.includes(t));
        });
      }
      return next;
    });
  };

  const toggleTournament = (tName: string, game: Game) => {
    setSelectedTournaments(prev => {
      const isAllKey = tName === `ALL:${game}`;
      const allKey = `ALL:${game}`;
      const gameTourneys = upcomingTournaments[game] || [];

      if (isAllKey) {
        if (prev.includes(allKey)) {
          // Unchecking "Tous les tournois" -> remove it, let user select 1-by-1
          return prev.filter(t => t !== allKey);
        } else {
          // Checking "Tous les tournois" -> keep only allKey, clear individual ones
          const clean = prev.filter(t => !gameTourneys.includes(t));
          return [...clean, allKey];
        }
      } else {
        return prev.includes(tName) ? prev.filter(t => t !== tName) : [...prev, tName];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (games.length === 0) {
      setError('Veuillez sélectionner au moins un jeu');
      return;
    }

    // Verify that every selected game has at least one tournament (or "All") selected
    const invalidGames = games.filter(game => {
      const hasAll = selectedTournaments.includes(`ALL:${game}`);
      const gameTourneys = upcomingTournaments[game] || [];
      const hasSpecific = selectedTournaments.some(t => gameTourneys.includes(t));
      return !hasAll && !hasSpecific;
    });

    if (invalidGames.length > 0) {
      setError('Veuillez sélectionner au moins un tournoi pour chaque jeu');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const league = await leaguesApi.create({ 
        name, 
        games, 
        tournaments: selectedTournaments, 
        rosterSize, 
        cooldownDays,
        onlyCreatorInvites
      });
      setCreated(league);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Veuillez entrer un code d\'invitation');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const joinedLeague = await leaguesApi.join('join', inviteCode.trim());
      navigate(`/leagues/${joinedLeague.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code d\'invitation invalide ou ligue pleine');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (created) {
      navigator.clipboard.writeText(created.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (created) {
    return (
      <div className="page container" id="create-league-success-page">
        <div className="create-success card" id="create-league-success-card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <h2 id="create-league-success-title">Ligue Créée !</h2>
          <h3 id="create-league-success-name" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0' }}>{created.name}</h3>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
            {created.games.map(g => <GameBadge key={g} game={g} />)}
          </div>
          <div style={{ margin: '24px 0' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Partage ce code d'invitation :</p>
            <div 
              id="create-league-invite-code"
              className="invite-code-display flex-col items-center justify-center" 
              onClick={copyCode}
            >
              <span className="invite-code">{created.inviteCode}</span>
              <span className="copy-hint">{copied ? '✅ Copié !' : '📋 Clique pour copier'}</span>
            </div>
          </div>
          <button className="btn btn-primary" id="create-league-go-to-league-btn" onClick={() => navigate(`/leagues/${created.id}`)}>
            Aller à la ligue →
          </button>
        </div>
      </div>
    );
  }

  const showTournaments = activeTab === 'create' && games.length > 0;

  const isFormInvalid = games.length === 0 || games.some(game => {
    const hasAll = selectedTournaments.includes(`ALL:${game}`);
    const gameTourneys = upcomingTournaments[game] || [];
    const hasSpecific = selectedTournaments.some(t => gameTourneys.includes(t));
    return !hasAll && !hasSpecific;
  });

  return (
    <div className="page container" id="create-league-page" style={{ maxWidth: showTournaments ? 1060 : 550, margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      <div style={{ display: 'flex', gap: showTournaments ? '30px' : '0px', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'flex-start', transition: 'gap 0.3s ease' }}>
        
        {/* Panneau Principal (Créer/Rejoindre) */}
        <div 
          className="card create-form-card" 
          id="create-league-form-card" 
          style={{ 
            flex: '0 0 550px',
            width: '550px', 
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div className="tabs" style={{ display: 'flex', width: '100%', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
            <button 
              className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => { setActiveTab('create'); setError(''); }}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '8px 12px 12px 12px',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'create' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'create' ? '2px solid var(--color-primary)' : 'none',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Créer une ligue
            </button>
            <button 
              className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
              onClick={() => { setActiveTab('join'); setError(''); }}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                padding: '8px 12px 12px 12px',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'join' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'join' ? '2px solid var(--color-primary)' : 'none',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Rejoindre une ligue
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} id="create-league-form">
              <div className="form-group" id="create-league-group-name">
                <label htmlFor="create-league-input-name">Nom de la ligue</label>
                <input id="create-league-input-name" type="text" className="input-field" placeholder="Ma super ligue" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={50} />
              </div>
              
              <div className="form-group" id="create-league-group-games">
                <label style={{ marginBottom: '8px', display: 'block' }}>Jeux</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {GAMES.map((g) => {
                    const isSelected = games.includes(g.value as Game);
                    const gameConfig = GAME_CONFIG[g.value as keyof typeof GAME_CONFIG];
                    const gameColor = gameConfig?.color || 'var(--color-primary)';
                    return (
                      <div 
                        key={g.value} 
                        onClick={() => toggleGame(g.value as Game)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          cursor: 'pointer', 
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: `1px solid ${isSelected ? gameColor : 'var(--border-light)'}`,
                          background: isSelected ? `${gameColor}10` : 'none',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 600 : 500,
                          transition: 'all 0.15s ease',
                          userSelect: 'none'
                        }}
                      >
                        {g.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="create-row" id="create-league-settings-row">
                <div className="form-group" id="create-league-group-roster">
                  <label htmlFor="create-league-input-roster">Taille de l'équipe</label>
                  <input id="create-league-input-roster" type="number" className="input-field" min={1} max={10} value={rosterSize} onChange={(e) => setRosterSize(Number(e.target.value))} />
                </div>
                <div className="form-group" id="create-league-group-cooldown">
                  <label htmlFor="create-league-input-cooldown">Délai (jours)</label>
                  <input id="create-league-input-cooldown" type="number" className="input-field" min={1} max={30} value={cooldownDays} onChange={(e) => setCooldownDays(Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '16px', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  id="create-league-input-creator-invites" 
                  checked={onlyCreatorInvites}
                  onChange={(e) => setOnlyCreatorInvites(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="create-league-input-creator-invites" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Seul le créateur peut inviter de nouveaux membres
                </label>
              </div>
              {error && <p className="alert alert-danger mt-8" id="create-league-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg w-full mt-24" id="create-league-submit-btn" disabled={loading || !name || isFormInvalid}>
                {loading ? 'Création...' : '✨ Créer la ligue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} id="join-league-form">
              <div className="form-group" id="join-league-group-code">
                <label htmlFor="join-league-input-code">Code d'invitation</label>
                <input 
                  id="join-league-input-code" 
                  type="text" 
                  className="input-field" 
                  placeholder="ex: CODE123" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value)} 
                  required 
                />
              </div>
              {error && <p className="alert alert-danger mt-8" id="join-league-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-lg w-full mt-24" id="join-league-submit-btn" disabled={loading || !inviteCode}>
                {loading ? 'Rejoindre...' : '🤝 Rejoindre la ligue'}
              </button>
            </form>
          )}
        </div>

        {/* Panneau Latéral Droit (Sélection des Tournois) */}
        <div 
          className="card" 
          id="create-league-tournaments-card" 
          style={{ 
            flex: showTournaments ? '0 0 450px' : '0 0 0px',
            width: showTournaments ? '450px' : '0px', 
            padding: showTournaments ? '32px' : '0px', 
            opacity: showTournaments ? 1 : 0,
            transform: showTournaments ? 'scale(1) translateX(0)' : 'scale(0.95) translateX(20px)',
            pointerEvents: showTournaments ? 'auto' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            border: showTournaments ? '1px solid var(--border-light)' : 'none',
            boxShadow: showTournaments ? 'var(--shadow-sm)' : 'none',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Tournois</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '386px' }}>
            {GAMES.map(g => {
              const game = g.value as Game;
              if (!games.includes(game)) return null;
              
              const tourneys = upcomingTournaments[game] || [];
              const gameConfig = GAME_CONFIG[game];
              const gameColor = gameConfig?.color || 'var(--color-primary)';
              const isAllChecked = selectedTournaments.includes(`ALL:${game}`);

              return (
                <div key={game} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {gameConfig?.label || game}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '12px' }}>
                    {/* Pill "Tous les tournois" */}
                    <div 
                      onClick={() => toggleTournament(`ALL:${game}`, game)}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        cursor: 'pointer', 
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: `1px solid ${isAllChecked ? gameColor : 'var(--border-light)'}`,
                        background: isAllChecked ? `${gameColor}15` : 'none',
                        color: isAllChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        fontWeight: isAllChecked ? 600 : 400,
                        transition: 'all 0.15s ease',
                        userSelect: 'none'
                      }}
                    >
                      Tous les tournois
                    </div>

                    {/* Specific tournaments (visible only if "Tous les tournois" is NOT checked) */}
                    {!isAllChecked && tourneys.map(t => {
                      const isChecked = selectedTournaments.includes(t);
                      return (
                        <div 
                          key={t} 
                          onClick={() => toggleTournament(t, game)}
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            cursor: 'pointer', 
                            padding: '4px 10px',
                            borderRadius: '16px',
                            border: `1px solid ${isChecked ? gameColor : 'var(--border-light)'}`,
                            background: isChecked ? `${gameColor}15` : 'none',
                            color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontSize: '0.8rem',
                            fontWeight: isChecked ? 600 : 400,
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                        >
                          {t}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {games.every(g => (upcomingTournaments[g] || []).length === 0) && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Aucun tournoi trouvé pour ces jeux dans les 30 prochains jours.</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

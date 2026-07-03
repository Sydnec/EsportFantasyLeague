import { useNavigate } from 'react-router-dom';

export function MatchMiniCard({ match }: { match: any }) {
  const navigate = useNavigate();
  const isClickable = match.status === 'running' || match.status === 'finished';
  
  const handleClick = () => {
    if (isClickable) {
      navigate(`/matches/${match.id}`);
    }
  };
  const schedDate = new Date(match.scheduledAt);
  const nowDate = new Date();
  const timeStr = schedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  let displayTime = timeStr;
  if (schedDate.getDate() !== nowDate.getDate()) {
    let dayStr = schedDate.toLocaleDateString('fr-FR', { weekday: 'short' });
    dayStr = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
    if (!dayStr.endsWith('.')) dayStr += '.';
    displayTime = `${dayStr} ${timeStr}`;
  }

  return (
    <div 
      className={`match-mini-card ${isClickable ? 'clickable' : 'no-hover'}`} 
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', marginBottom: 0, cursor: isClickable ? 'pointer' : 'default' }}
      onClick={handleClick}
    >
      <div className="match-team left">
        {match.teamA.imageUrl && <img src={match.teamA.imageUrl} alt={match.teamA.name} className="match-team-logo" />}
        <span className="match-team-name">{match.teamA.acronym || match.teamA.name}</span>
      </div>
      <div className="match-mini-details">
        {match.status !== 'finished' && match.status !== 'canceled' && (
          <div className="match-mini-time" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            {match.status === 'running' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'red' }} />}
            {displayTime}
          </div>
        )}
        
        {match.status === 'finished' ? (
          <span className="match-mini-score">
            {match.teamAScore ?? 0} - {match.teamBScore ?? 0}
          </span>
        ) : match.status === 'canceled' ? (
          <span className="match-mini-status">Annulé</span>
        ) : match.status === 'running' ? (
          <span className="match-mini-score" style={{ color: 'red', fontWeight: 'bold' }}>
            {match.teamAScore ?? 0} - {match.teamBScore ?? 0}
          </span>
        ) : (
          <span className="match-mini-status">VS</span>
        )}
      </div>
      <div className="match-team right">
        <span className="match-team-name">{match.teamB.acronym || match.teamB.name}</span>
        {match.teamB.imageUrl && <img src={match.teamB.imageUrl} alt={match.teamB.name} className="match-team-logo" />}
      </div>
    </div>
  );
}

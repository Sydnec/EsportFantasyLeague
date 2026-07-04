import type { MatchDayStatus, RosterStatus } from '../types';

type Status = MatchDayStatus | RosterStatus;

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  OPEN: { color: '#10b981', label: 'Ouvert' },
  PENDING: { color: '#10b981', label: 'En attente' },
  LOCKED: { color: '#f59e0b', label: 'Verrouillé' },
  // Matches are over but our own scoring hasn't produced results yet — distinct
  // from SCORED so a "Résultats" link doesn't get shown before there's anything to show.
  FINISHED: { color: '#8b5cf6', label: 'Terminé' },
  SCORED: { color: '#00d4ff', label: 'Terminé' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status] || { color: '#888', label: status };

  return (
    <span
      className="badge"
      style={{
        background: `${config.color}20`,
        color: config.color,
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {config.label}
    </span>
  );
}

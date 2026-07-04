#!/usr/bin/env bash
set -euo pipefail

# Promote a user to ADMIN by username.
# Usage: ./scripts/set-admin.sh <username>

if [ $# -ne 1 ]; then
  echo "Usage: $0 <username>" >&2
  exit 1
fi

USERNAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ENV="$SCRIPT_DIR/../services/apps/backend/.env"

DB_USER="admin"
DB_PASSWORD="password"
DB_NAME="fantasy_league"
DB_HOST="localhost"
DB_PORT="5432"

if [ -f "$BACKEND_ENV" ]; then
  DB_USER=$(grep -E '^POSTGRES_USER=' "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"' || true)
  DB_PASSWORD=$(grep -E '^POSTGRES_PASSWORD=' "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"' || true)
  DB_NAME=$(grep -E '^POSTGRES_DB=' "$BACKEND_ENV" | cut -d'=' -f2- | tr -d '"' || true)
fi

# Escape single quotes for safe use in a SQL string literal (doubling is the
# standard SQL escape — psql's `-v`/`:'var'` interpolation isn't applied in `-c` mode).
ESCAPED_USERNAME=${USERNAME//\'/\'\'}

RESULT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tA -c \
  "UPDATE backend_db.users SET role = 'ADMIN' WHERE username = '$ESCAPED_USERNAME' RETURNING username;" \
  | grep -v '^UPDATE ' || true)

if [ -z "$RESULT" ]; then
  echo "Aucun utilisateur trouvé avec le pseudo '$USERNAME'." >&2
  exit 1
fi

echo "'$USERNAME' est maintenant ADMIN."

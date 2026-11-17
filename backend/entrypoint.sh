#!/usr/bin/env bash
set -e

echo "[STARTUP] Prabhakar Agro Mart Django Service Starting..."

# Wait for MySQL database if configured
if [ "$DATABASE_ENGINE" = "mysql" ]; then
    echo "[DATABASE] Waiting for MySQL database at $DATABASE_HOST:$DATABASE_PORT..."
    while ! nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
      sleep 1
    done
    echo "[DATABASE] MySQL is available and accepting connections."
fi

# Run database migrations
echo "[MIGRATIONS] Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "[STATIC] Collecting static files..."
python manage.py collectstatic --noinput --clear || true

echo "[READY] Django setup complete. Executing command: $@"
exec "$@"

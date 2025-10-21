#!/bin/bash
set -e

echo "=========================================="
echo "Initializing Cash-or-Card Database"
echo "=========================================="

# Run migrations in order
echo "Running database migrations..."

for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "Executing migration: $(basename $migration)"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration"
    fi
done

# Run seed data if exists
if [ -d "/docker-entrypoint-initdb.d/seeds" ]; then
    echo "Running seed data..."
    for seed in /docker-entrypoint-initdb.d/seeds/*.sql; do
        if [ -f "$seed" ]; then
            echo "Executing seed: $(basename $seed)"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$seed"
        fi
    done
fi

echo "=========================================="
echo "Database initialization complete!"
echo "=========================================="

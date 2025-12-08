#!/bin/bash
set -e

echo "=========================================="
echo "Initializing Cash-or-Card Database"
echo "=========================================="

# Clean up existing data (Drop all tables/views/etc)
echo "Cleaning up existing data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

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

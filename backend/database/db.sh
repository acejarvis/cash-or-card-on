#!/bin/bash
# Database management helper script
# Usage: ./db.sh [command]

set -e

PROJECT_NAME="cash-or-card"
CONTAINER_NAME="${PROJECT_NAME}-postgres"
DB_NAME="cash_or_card"
DB_USER="postgres"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_success ".env file created. Please update it with your settings."
        return 1
    fi
    return 0
}

# Commands
cmd_start() {
    print_warning "Starting PostgreSQL database..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    echo -n "Waiting for database to be ready"
    for i in {1..30}; do
        if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
            echo ""
            print_success "Database is ready!"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    print_error "Database failed to start within 30 seconds"
    return 1
}

cmd_stop() {
    print_warning "Stopping PostgreSQL database..."
    docker-compose stop postgres
    print_success "Database stopped"
}

cmd_restart() {
    cmd_stop
    cmd_start
}

cmd_status() {
    echo "Container status:"
    docker-compose ps postgres
    echo ""
    echo "Database connection test:"
    if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        print_success "Database is accepting connections"
    else
        print_error "Database is not accepting connections"
    fi
}

cmd_logs() {
    docker-compose logs -f postgres
}

cmd_shell() {
    print_warning "Connecting to PostgreSQL shell..."
    docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME
}

cmd_seed() {
    print_warning "Seeding database with test data..."
    docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < backend/database/seeds/001_seed_test_data.sql
    print_success "Database seeded successfully"
}

cmd_backup() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_warning "Backing up database to $BACKUP_FILE..."
    docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
    print_success "Database backed up to $BACKUP_FILE"
}

cmd_restore() {
    if [ -z "$1" ]; then
        print_error "Usage: ./db.sh restore <backup_file>"
        return 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        return 1
    fi
    
    print_warning "Restoring database from $1..."
    docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$1"
    print_success "Database restored successfully"
}

cmd_reset() {
    print_error "WARNING: This will DELETE ALL DATA in the database!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_warning "Reset cancelled"
        return 0
    fi
    
    print_warning "Resetting database..."
    docker-compose down -v
    docker-compose up -d postgres
    
    # Wait for database to be ready
    echo -n "Waiting for database to be ready"
    for i in {1..30}; do
        if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
            echo ""
            break
        fi
        echo -n "."
        sleep 1
    done
    
    print_success "Database reset complete"
}

cmd_pgadmin() {
    print_warning "Starting pgAdmin..."
    docker-compose up -d pgadmin
    PGADMIN_PORT=$(grep PGADMIN_PORT .env | cut -d '=' -f2)
    PGADMIN_PORT=${PGADMIN_PORT:-5050}
    print_success "pgAdmin started at http://localhost:$PGADMIN_PORT"
}

cmd_help() {
    cat << EOF
Database Management Helper Script

Usage: ./db.sh [command]

Commands:
  start       Start the PostgreSQL database container
  stop        Stop the PostgreSQL database container
  restart     Restart the database container
  status      Show database container status and connection test
  logs        Show and follow database logs
  shell       Connect to PostgreSQL interactive shell (psql)
  seed        Populate database with test data
  backup      Create a backup of the database
  restore     Restore database from backup file
  reset       Reset database (WARNING: deletes all data)
  pgadmin     Start pgAdmin web interface
  help        Show this help message

Examples:
  ./db.sh start                    # Start database
  ./db.sh shell                    # Connect to psql
  ./db.sh backup                   # Create backup
  ./db.sh restore backup.sql       # Restore from backup
  ./db.sh seed                     # Load test data

EOF
}

# Main
check_env || exit 1

case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    status)
        cmd_status
        ;;
    logs)
        cmd_logs
        ;;
    shell)
        cmd_shell
        ;;
    seed)
        cmd_seed
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore "$2"
        ;;
    reset)
        cmd_reset
        ;;
    pgadmin)
        cmd_pgadmin
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        cmd_help
        exit 1
        ;;
esac

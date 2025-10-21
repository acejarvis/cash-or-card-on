# Cash-or-Card-ON Database

PostgreSQL database schema and Docker setup for the Cash-or-Card-ON project.

## Overview

This database manages restaurant information, payment methods, cash discounts, user accounts, and voting systems for the Cash-or-Card-ON platform.

## Database Schema

### Core Tables

#### 1. **users**
User accounts with authentication and role-based access control.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email address |
| username | VARCHAR(100) | Unique username |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| role | ENUM | 'guest', 'registered', or 'admin' |
| is_active | BOOLEAN | Account active status |
| email_verified | BOOLEAN | Email verification status |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| last_login_at | TIMESTAMP | Last login timestamp |

**Roles:**
- `guest`: Can only search and view restaurants
- `registered`: Can vote and submit payment information
- `admin`: Can verify submissions and moderate content

#### 2. **restaurants**
Restaurant information with address and verification status.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Restaurant name |
| address | TEXT | Full street address |
| city | VARCHAR(100) | City name |
| province | VARCHAR(50) | Province (default: Ontario) |
| postal_code | VARCHAR(10) | Postal code |
| phone | VARCHAR(20) | Contact phone |
| category | ENUM | Restaurant category |
| cuisine_tags | TEXT[] | Additional cuisine descriptors |
| website_url | TEXT | Website URL |
| operating_hours | JSONB | Daily operating hours |
| is_verified | BOOLEAN | Admin verification status |
| verified_by | UUID | Admin who verified |
| verified_at | TIMESTAMP | Verification timestamp |
| data_source | VARCHAR(50) | 'user_submission', 'yelp', 'google_maps' |
| external_id | VARCHAR(255) | External API ID |

**Categories:** Chinese, Korean, Japanese, Vietnamese, Thai, Italian, French, Indian, Mexican, American, Mediterranean, Canadian, Fusion, Other

**Operating Hours Format:**
```json
{
  "monday": {"open": "11:00", "close": "22:00"},
  "tuesday": {"open": "11:00", "close": "22:00"},
  ...
}
```

#### 3. **payment_methods**
Payment methods accepted by restaurants with crowdsourced voting.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| restaurant_id | UUID | Foreign key to restaurants |
| payment_type | ENUM | Payment type |
| is_accepted | BOOLEAN | Whether payment is accepted |
| upvotes | INTEGER | Number of upvotes |
| downvotes | INTEGER | Number of downvotes |
| confidence_score | DECIMAL | Wilson score (0-1) |
| submitted_by | UUID | User who submitted |
| verified_by | UUID | Admin who verified |
| is_verified | BOOLEAN | Verification status |

**Payment Types:** cash, debit, visa, mastercard, amex, discover, other

#### 4. **payment_method_votes**
User votes on payment method accuracy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| payment_method_id | UUID | Foreign key to payment_methods |
| user_id | UUID | Foreign key to users |
| vote_type | VARCHAR(10) | 'upvote' or 'downvote' |

**Constraint:** One vote per user per payment method

#### 5. **cash_discounts**
Cash discount percentages offered by restaurants.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| restaurant_id | UUID | Foreign key to restaurants |
| discount_percentage | DECIMAL(5,2) | Discount percentage (0-100) |
| description | TEXT | Optional details |
| upvotes | INTEGER | Number of upvotes |
| downvotes | INTEGER | Number of downvotes |
| confidence_score | DECIMAL | Wilson score (0-1) |
| is_active | BOOLEAN | Whether discount is active |

#### 6. **cash_discount_votes**
User votes on cash discount accuracy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cash_discount_id | UUID | Foreign key to cash_discounts |
| user_id | UUID | Foreign key to users |
| vote_type | VARCHAR(10) | 'upvote' or 'downvote' |

#### 7. **audit_logs**
Comprehensive audit trail for all system modifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| entity_type | ENUM | 'user', 'restaurant', 'payment_method', 'cash_discount' |
| entity_id | UUID | ID of affected entity |
| action | ENUM | Action type (CREATE, UPDATE, DELETE, VERIFY, etc.) |
| performed_by | UUID | User who performed action |
| old_values | JSONB | Previous state |
| new_values | JSONB | New state |
| ip_address | INET | User's IP address |
| user_agent | TEXT | Browser user agent |
| notes | TEXT | Additional context |

### Views

#### **restaurant_summary**
Consolidated view of restaurants with all payment methods and discounts.

```sql
SELECT * FROM restaurant_summary WHERE city = 'Toronto';
```

#### **user_statistics**
User contribution and activity statistics.

```sql
SELECT * FROM user_statistics WHERE total_contributions > 10;
```

#### **restaurants_pending_verification**
List of restaurants and data requiring admin verification.

```sql
SELECT * FROM restaurants_pending_verification;
```

## Database Features

### 1. **Full-Text Search**
- Fuzzy text search using pg_trgm extension
- Indexed for fast restaurant name searches
- Example:
```sql
SELECT name, address, city
FROM restaurants
WHERE name ILIKE '%sushi%'
ORDER BY similarity(name, 'sushi') DESC;
```

### 2. **Automatic Triggers**
- **updated_at**: Automatically updated on row modification
- **vote_counts**: Real-time vote count updates

### 3. **Confidence Score**
Wilson score interval algorithm for reliable vote-based ranking:
```sql
SELECT calculate_confidence_score(upvotes, downvotes);
```

## Docker Setup

### Prerequisites
- Docker (version 20.10+)
- Docker Compose (version 2.0+)

### Quick Start

1. **Clone the repository** (if not already done):
```bash
cd /<parent-dir>/cash-or-card-on
```

2. **Create environment file**:
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

3. **Start the database**:
```bash
docker-compose up -d postgres
```

4. **Check database health**:
```bash
docker-compose ps
docker-compose logs postgres
```

5. **Start pgAdmin** (optional, for GUI management):
```bash
docker-compose up -d pgadmin
# Access at http://localhost:5050
```

### Database Access

#### Using psql (Docker exec)
```bash
docker exec -it cash-or-card-postgres psql -U postgres -d cash_or_card
```

#### Using pgAdmin
1. Navigate to http://localhost:5050
2. Login with credentials from `.env` file
3. Add new server:
   - Name: Cash-or-Card-ON
   - Host: postgres (Docker network name)
   - Port: 5432
   - Username: postgres
   - Password: (from .env)

#### Using External Tool
Connect to:
- Host: localhost
- Port: 5432 (or value from .env)
- Database: cash_or_card
- Username: postgres
- Password: (from .env)

### Seed Test Data

To populate the database with test data:

```bash
docker exec -i cash-or-card-postgres psql -U postgres -d cash_or_card < backend/database/seeds/001_seed_test_data.sql
```

Test users (password: `password123`):
- admin@test.com (admin role)
- user1@test.com (registered user)
- user2@test.com (registered user)

### Database Management

#### Stop the database:
```bash
docker-compose stop postgres
```

#### Restart the database:
```bash
docker-compose restart postgres
```

#### View logs:
```bash
docker-compose logs -f postgres
```

#### Backup database:
```bash
docker exec cash-or-card-postgres pg_dump -U postgres cash_or_card > backup.sql
```

#### Restore database:
```bash
docker exec -i cash-or-card-postgres psql -U postgres -d cash_or_card < backup.sql
```

#### Reset database (WARNING: Deletes all data):
```bash
docker-compose down -v
docker-compose up -d postgres
```

## Migrations

Migrations are automatically run when the container starts. Migration files are located in `backend/database/migrations/` and executed in alphabetical order.

### Migration Files

1. `001_create_extensions.sql` - PostgreSQL extensions (uuid-ossp, pg_trgm)
2. `002_create_users_table.sql` - Users and authentication
3. `003_create_restaurants_table.sql` - Restaurant information
4. `004_create_payment_methods_table.sql` - Payment methods and voting
5. `005_create_cash_discounts_table.sql` - Cash discounts and voting
6. `006_create_audit_logs_table.sql` - Audit trail
7. `007_create_views.sql` - Convenience views

### Adding New Migrations

1. Create new file: `backend/database/migrations/008_your_migration.sql`
2. Restart database container to apply:
```bash
docker-compose restart postgres
```

## Common Queries

### Find restaurants by payment method:
```sql
SELECT r.name, r.address, pm.payment_type
FROM restaurants r
JOIN payment_methods pm ON r.id = pm.restaurant_id
WHERE pm.payment_type = 'amex' AND pm.is_accepted = true
ORDER BY pm.confidence_score DESC;
```

### Find restaurants with cash discounts:
```sql
SELECT r.name, cd.discount_percentage, cd.confidence_score
FROM restaurants r
JOIN cash_discounts cd ON r.id = cd.restaurant_id
WHERE cd.is_active = true AND cd.is_verified = true
ORDER BY cd.discount_percentage DESC;
```

### Search restaurants by name:
```sql
SELECT name, address, city
FROM restaurants
WHERE name ILIKE '%sushi%'
ORDER BY name;
```

### Get user contribution statistics:
```sql
SELECT * FROM user_statistics
WHERE username = 'foodlover123';
```

## Troubleshooting

### Connection refused
- Check if container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`
- Verify port 5432 is not in use: `lsof -i :5432`

### Permission denied
- Ensure Docker daemon is running
- Check user permissions: `sudo usermod -aG docker $USER`

### Data not persisting
- Verify volume exists: `docker volume ls`
- Check volume mount: `docker inspect cash-or-card-postgres`

### Migrations not running
- Check init.sh permissions: `chmod +x backend/database/init.sh`
- View container logs during startup: `docker-compose logs postgres`

## Performance Optimization

- **Indexes**: Already created on frequently queried columns
- **Connection pooling**: Recommended for backend application (pg-pool)
- **Query optimization**: Use EXPLAIN ANALYZE for slow queries
- **Partitioning**: Consider for audit_logs table as data grows

## Security Considerations

- Change default passwords in `.env` before deployment
- Use strong JWT secrets for production
- Enable SSL for database connections in production
- Regularly update Docker images for security patches
- Implement database user with limited permissions for application

## Next Steps

1. ✅ Database schema implementation
2. ✅ Docker local deployment
3. 🔄 Backend API development
4. 🔄 Frontend integration
5. 🔄 Kubernetes deployment on DigitalOcean

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

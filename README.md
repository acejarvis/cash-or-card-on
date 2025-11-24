# Cash-or-Card-ON

> A community-driven platform for discovering restaurant payment methods and cash discounts across Ontario.

[![Project Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/acejarvis/cash-or-card-on)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🎯 Overview

Cash-or-Card-ON is a crowdsourcing platform that helps diners in Ontario find restaurants based on accepted payment methods and cash discount information. The platform features a verification system with confidence scoring to ensure data accuracy.

**Key Features:**
- 🔍 Search restaurants by payment methods and cash discounts
- 👥 Community-driven data contributions
- ✅ Verification system with Wilson score confidence intervals
- 🗳️ Upvote/downvote system for data validation
- 🔐 Role-based access control (guest, registered, admin)
- 📍 City and category filtering

---

## ⚡ Quick Start

### Full Stack Setup (Recommended)

Get the entire application running in one command:

```bash
# Start all services (database + backend + frontend)
docker-compose up -d

# Verify everything is running
curl http://localhost:3001/health
curl http://localhost:3001/api/restaurants

# Open the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

**Test Credentials:**
- Admin: `admin@cash-or-card.com` / `admin123`
- User: `user@cash-or-card.com` / `user123`

**Service URLs:**
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:3001/api`
- **pgAdmin:** `http://localhost:5050` (optional)

👉 See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed setup instructions.

### For Frontend Developers

```bash
# Start backend services only
docker-compose up -d postgres backend

# Run frontend in development mode
cd frontend && npm install && npm start
```

### For Backend Developers

```bash
# Start database only
docker-compose up -d postgres

# Install backend dependencies
cd backend && npm install

# Run backend locally
npm run dev
```

  See [backend/README.md](backend/README.md) for API documentation.

---

## 📚 Documentation

### Getting Started
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Quick setup guide for frontend developers
  - One-command setup
  - Test account credentials
  - API usage examples
  - Troubleshooting tips

### Backend & API
- **[backend/README.md](backend/README.md)** - Complete backend API documentation
  - All API endpoints
  - Authentication & authorization
  - Request/response examples
  - Database access
  - Development guide

### Project Planning
- **[docs/Project_Proposal.md](docs/Project_Proposal.md)** - Detailed project proposal
  - Project objectives
  - Feature specifications
  - System architecture
  - Technology stack rationale
  
- **[docs/Development_Plan.md](docs/Development_Plan.md)** - 8-week development timeline
  - Sprint planning
  - Task breakdown
  - Milestones

---

## 🏗️ Project Architecture

### System Components

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│   + Material-UI │
│   + Leaflet Map │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express.js API │ (Port 3001)
│   Node.js 22    │
└────────┬────────┘
         │
         │ node-postgres
         │
┌────────▼────────┐
│   PostgreSQL    │ (Port 5432)
│   Database      │
└─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 22 with Express.js
- JWT authentication with bcrypt
- PostgreSQL 15 with connection pooling
- Docker multi-stage builds

**Frontend:**
- React 18 with Hooks
- Material-UI (MUI) components
- Leaflet & React Leaflet for maps
- Axios for API communication
- Nginx for production serving

**Database:**
- PostgreSQL 15-alpine
- 7 tables with proper indexing
- 3 database views for aggregated data
- Automatic vote counting with triggers

**DevOps:**
- Docker & Docker Compose
- Multi-stage builds for frontend (Node + Nginx)
- pgAdmin for database management
- Automated migrations and seeding

---

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts (guest, registered, admin roles)
- **restaurants** - Restaurant information with address and operating hours
- **payment_methods** - Payment method acceptance with verification
- **payment_method_votes** - User votes on payment methods
- **cash_discounts** - Cash discount offers with percentages
- **cash_discount_votes** - User votes on cash discounts
- **audit_logs** - System activity audit trail

### Views
- **restaurant_summary** - Aggregated restaurant data with payment methods
- **user_statistics** - User contribution statistics
- **restaurants_pending_verification** - Unverified restaurant submissions

---

## 📡 API Endpoints

### Public Endpoints
```
GET  /api/restaurants                  # List all restaurants
GET  /api/restaurants/:id              # Get restaurant details
GET  /api/restaurants/search?q=sushi   # Search restaurants
GET  /api/payment-methods/restaurant/:id
GET  /api/cash-discounts/restaurant/:id
```

### Authenticated Endpoints
```
POST /api/auth/register                # Register new user
POST /api/auth/login                   # Login
GET  /api/auth/profile                 # Get user profile
POST /api/restaurants                  # Create restaurant
POST /api/payment-methods              # Submit payment method
POST /api/payment-methods/:id/vote     # Vote on payment method
POST /api/cash-discounts               # Submit cash discount
POST /api/cash-discounts/:id/vote      # Vote on discount
```

### Admin Endpoints
```
POST   /api/restaurants/:id/verify     # Verify restaurant
DELETE /api/restaurants/:id            # Delete restaurant
POST   /api/payment-methods/:id/verify # Verify payment method
DELETE /api/payment-methods/:id        # Delete payment method
```

👉 See [backend/README.md](backend/README.md) for complete API documentation.

---

## 🎯 Test Data

The database is automatically seeded with test data:

### Restaurants (6)
- Ichiban Japanese Restaurant (Scarborough, Japanese)
- Muni Robata (Toronto, Japanese)
- Cafe N One (Scarborough, Other)
- Hao Xiong Di Chinese BBQ (Scarborough, Chinese)
- Lala Spicy Food (Scarborough, Chinese)
- Omiwol Korean BBQ (North York, Korean)

### Test Users (3)
| Email | Password | Role |
|-------|----------|------|
| admin@cash-or-card.com | admin123 | Admin |
| user@cash-or-card.com | user123 | Registered |
| contributor@cash-or-card.com | contributor123 | Registered |

### Additional Data
- 29 payment methods across restaurants
- 5 cash discounts with various percentages
- Vote data demonstrating confidence scoring

---

## 🛠️ Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local backend development)
- Git

### Clone Repository
```bash
git clone https://github.com/acejarvis/cash-or-card-on.git
cd cash-or-card-on
```

### Environment Configuration
```bash
# Environment file is already configured with defaults
cat .env

# Key variables (defaults work for local development):
# - POSTGRES_DB=cash_or_card
# - POSTGRES_USER=postgres
# - POSTGRES_PASSWORD=postgres
# - BACKEND_PORT=3001
# - CORS_ORIGIN=http://localhost:3000
```

### Start Services
```bash
# Start everything (recommended)
docker-compose up -d

# Or start individually
docker-compose up -d postgres  # Database only
docker-compose up -d backend   # Backend API
docker-compose up -d frontend  # React frontend
docker-compose up -d pgadmin   # Database GUI (optional)
```

### Verify Installation
```bash
# Check services
docker-compose ps

# Test backend
curl http://localhost:3001/health

# Test API
curl http://localhost:3001/api/restaurants

# Access frontend
# Open browser: http://localhost:3000

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Common Commands
```bash
# Restart services
docker-compose restart

# Restart specific service
docker-compose restart frontend
docker-compose restart backend

# Stop services (keep data)
docker-compose stop

# Stop and remove (keep data)
docker-compose down

# Fresh start (remove all data)
docker-compose down -v && docker-compose up -d

# Rebuild after code changes
docker-compose build backend
docker-compose build frontend
docker-compose up -d

# View real-time logs
docker-compose logs -f
docker-compose logs -f frontend backend
```

---

## 🔐 Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Authentication:** 7-day token expiry
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CORS Protection:** Configurable origin whitelist
- **SQL Injection Prevention:** Parameterized queries
- **Input Validation:** Express-validator on all endpoints
- **Helmet Security Headers:** XSS, clickjacking protection
- **Role-Based Access Control:** Guest, registered, admin roles

---

## 📊 Vote Confidence System

The platform uses the **Wilson Score Confidence Interval** for vote confidence:

- Handles small sample sizes effectively
- Prevents manipulation from single votes
- Balances positive and negative feedback
- More conservative for items with few votes
- Used by Reddit, Yelp, and other major platforms

**Formula:** 95% confidence interval for Bernoulli parameter

---

## 📁 Project Structure

```
cash-or-card-on/
├── backend/
│   ├── src/
│   │   ├── config/           # Database & env configuration
│   │   ├── dao/              # Data Access Objects
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth & error handling
│   │   ├── utils/            # Helper functions
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   ├── database/
│   │   ├── migrations/       # Database schema
│   │   ├── seeds/            # Test data
│   │   └── init.sh           # Init script
│   ├── Dockerfile
│   ├── package.json
│   └── README.md             # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Account.js    # User profile
│   │   │   ├── AdminPanelModal.js  # Admin management
│   │   │   ├── Login.js      # Auth UI
│   │   │   ├── MapView.js    # Leaflet map
│   │   │   ├── RestaurantCard.js   # List item
│   │   │   └── RestaurantDetailsModal.js  # Details view
│   │   ├── utils/
│   │   │   └── format.js     # Formatting utilities
│   │   ├── files/            # Static assets
│   │   ├── App.js            # Main app component
│   │   └── index.js          # Entry point
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile            # Multi-stage build (Node + Nginx)
│   └── package.json
├── docs/
│   ├── Project_Proposal.md   # Project proposal
│   └── Development_Plan.md   # Development timeline
├── docker-compose.yml        # Service orchestration (all 4 services)
├── GETTING_STARTED.md        # Quick start guide
├── .env                      # Environment variables
└── README.md                 # This file
```

---

## 📈 Project Status

### ✅ Completed (Weeks 1-4)

**Database & Infrastructure**
- [x] PostgreSQL schema with 7 tables
- [x] Database migrations and seeding
- [x] Docker Compose setup with 4 services
- [x] pgAdmin integration

**Backend API**
- [x] Express.js server with Node.js 22
- [x] JWT authentication system
- [x] Role-based authorization
- [x] All CRUD endpoints for restaurants
- [x] Payment method submission and voting
- [x] Cash discount submission and voting
- [x] Admin verification endpoints
- [x] Connection pooling
- [x] Error handling middleware
- [x] Rate limiting and security headers
- [x] Docker multi-stage build
- [x] Health check endpoints

**Frontend Application**
- [x] React 18 application setup
- [x] Material-UI component integration
- [x] Authentication UI (Login/Register)
- [x] User profile and account management
- [x] Restaurant list view with cards
- [x] Restaurant details modal
- [x] Advanced filtering (city, cuisine, payment methods, ratings)
- [x] Search functionality
- [x] Pagination system
- [x] Interactive Leaflet map integration
- [x] Payment method submission and voting UI
- [x] Cash discount submission and voting UI
- [x] Admin panel for restaurant management
- [x] Restaurant creation, editing, and deletion
- [x] Verification system UI
- [x] Responsive design
- [x] Real-time status indicators (open/closed)
- [x] Toast notifications
- [x] Docker multi-stage build (Node + Nginx)

**Documentation**
- [x] Backend API documentation
- [x] Getting started guide
- [x] Database schema documentation
- [x] Project proposal
- [x] Development plan

### 🔄 In Progress (Week 5)

**Testing & Quality Assurance**
- [ ] Unit tests for backend
- [ ] Integration tests
- [ ] Frontend component tests
- [ ] E2E tests

**Polish & Optimization**
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness enhancements
- [ ] SEO optimization

### ⏳ Planned (Weeks 6-8)

**Advanced Features**
- [ ] User contribution history
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Data export functionality
- [ ] Advanced search filters (distance, ratings)
- [ ] Restaurant photo uploads

**Deployment & DevOps**
- [ ] Production environment setup
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment
- [ ] Monitoring and logging
- [ ] Backup and recovery procedures

---

## 🧪 Testing

### API Testing

```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"new@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cash-or-card.com","password":"user123"}'

# Get restaurants
curl http://localhost:3001/api/restaurants

# Search restaurants
curl "http://localhost:3001/api/restaurants/search?q=sushi&city=Toronto"
```

---

## 🤝 Contributing

### Team Members
- **Jarvis Wang** - Backend, DevOps, Infrastructure
- **Yicheng (Ethan) Yao** - Frontend, UI/UX, Monitoring

### Development Workflow
1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Update documentation
5. Submit a pull request

---

## 🆘 Troubleshooting

### Services Won't Start
```bash
# Check Docker status
docker ps

# View logs
docker-compose logs

# Restart everything
docker-compose down -v && docker-compose up -d
```

### API Connection Issues
```bash
# Check backend is running
curl http://localhost:3001/health

# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Database Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres

# Connect to database
docker-compose exec postgres psql -U postgres -d cash_or_card
```

### CORS Errors
```bash
# Update CORS_ORIGIN in .env
# Default: http://localhost:3000

# Restart backend
docker-compose restart backend
```

👉 See [GETTING_STARTED.md](GETTING_STARTED.md) for more troubleshooting tips.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📮 Contact

For questions or issues, please open an issue on the [GitHub repository](https://github.com/acejarvis/cash-or-card-on).

---

## 🙏 Acknowledgments

- PostgreSQL community for excellent documentation
- Express.js and Node.js communities
- Wilson Score algorithm by Edwin B. Wilson
- All contributors and testers

---

**Ready to start?** 👉 [Get Started Now](GETTING_STARTED.md)

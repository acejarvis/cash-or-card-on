# Cash-or-Card-ON Backend API

A Node.js/Express REST API for the Cash-or-Card-ON crowdsourcing platform. This backend manages restaurant data, payment methods, cash discounts, and user authentication.

---

## ⚡ Quick Reference for Frontend Developers

### Start Everything (Database + Backend + Seed Data)
```bash
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
curl http://localhost:3001/health
```

### API Base URL
```
http://localhost:3001/api
```

### Test User Credentials
### Test User Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@cash-or-card.com | admin123 | Admin |
| user@cash-or-card.com | user123 | Registered |

### Key Endpoints
```bash
# Get restaurants
GET http://localhost:3001/api/restaurants

# Login
POST http://localhost:3001/api/auth/login
Body: {"email": "user@cash-or-card.com", "password": "user123"}

# Create restaurant (needs token)
POST http://localhost:3001/api/restaurants
Header: Authorization: Bearer <token>
```

### Restart Fresh (with new seed data)
```bash
docker-compose down -v && docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f backend
```

---

## 🚀 Quick Start for Frontend Development

### Prerequisites
- Docker & Docker Compose installed
- Node.js 22+ (optional, for local development)

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
cd /path/to/cash-or-card-on
```

#### 2. Configure Environment Variables
The project comes with a `.env` file in the root directory. You can use the defaults or modify them:

```bash
# View current environment settings
cat .env

# Key variables (defaults are fine for development):
# POSTGRES_DB=cash_or_card
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres (change for production!)
# POSTGRES_PORT=5432
# BACKEND_PORT=3001
```

#### 3. Start Database and Backend (Automatic Seed Data)
```bash
# From the project root directory
docker-compose up -d

# This will:
# ✅ Start PostgreSQL database (port 5432)
# ✅ Run all database migrations automatically
# ✅ Load seed data (6 restaurants, 3 test users, payment methods, discounts)
# ✅ Start backend API (port 3001)
# ✅ Start pgAdmin (port 5050, optional for database management)
```

#### 4. Verify Everything is Running
```bash
# Check service status
docker-compose ps

# Expected output:
# cash-or-card-postgres   Running   0.0.0.0:5432->5432/tcp
# cash-or-card-backend    Running   0.0.0.0:3001->3001/tcp
# cash-or-card-pgadmin    Running   0.0.0.0:5050->80/tcp

# Check backend health
curl http://localhost:3001/health

# Check if data is loaded (should return 6+ restaurants)
curl http://localhost:3001/api/restaurants
```

#### 5. View Logs (if something goes wrong)
```bash
# View all logs
docker-compose logs

# View backend logs only
docker-compose logs backend

# View database logs only
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend
```

#### 6. Access the API
The backend API is now available at: **http://localhost:3001**

All endpoints are prefixed with `/api`:
- Restaurants: http://localhost:3001/api/restaurants
- Auth: http://localhost:3001/api/auth/login
- Payment Methods: http://localhost:3001/api/payment-methods
- Cash Discounts: http://localhost:3001/api/cash-discounts

### 🔄 Restarting or Rebuilding

#### Restart Services (keeps data)
```bash
docker-compose restart
```

#### Stop Services (keeps data)
```bash
docker-compose stop
```

#### Stop and Remove (keeps data volumes)
```bash
docker-compose down
```

#### Fresh Start (removes all data and reloads seed data)
```bash
# Stop services and delete volumes
docker-compose down -v

# Start fresh with new seed data
docker-compose up -d
```

#### Rebuild Backend After Code Changes
```bash
# Rebuild and restart backend
docker-compose build backend
docker-compose up -d backend

# Or rebuild everything
docker-compose build
docker-compose up -d
```

### Local Development

```bash
# Install dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env

# Start the database
docker-compose up -d postgres

# Run the backend locally
npm run dev
```

---

## 🎯 Test Data & Credentials

The database is automatically seeded with test data when you start the services.

### Test User Accounts

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@cash-or-card.com | admin123 | Full access to verify/delete content |
| Registered | user@cash-or-card.com | user123 | Can create restaurants, vote, submit data |
| Registered | contributor@cash-or-card.com | contributor123 | Can create restaurants, vote, submit data |

### Seed Data Included

- ✅ **6 Restaurants** in Toronto area (Scarborough, North York):
  - Ichiban Japanese Restaurant
  - Muni Robata
  - Cafe N One
  - Hao Xiong Di Chinese BBQ
  - Lala Spicy Food
  - Omiwol Korean BBQ

- ✅ **29 Payment Methods** across restaurants (various acceptance statuses)
- ✅ **5 Cash Discounts** with different percentages
- ✅ **Vote data** to demonstrate confidence scoring

### Quick Test with Pre-seeded Accounts

```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cash-or-card.com","password":"admin123"}'

# Login as regular user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cash-or-card.com","password":"user123"}'

# Get all restaurants (no auth needed)
curl http://localhost:3001/api/restaurants

# Get a specific restaurant with payment methods
curl http://localhost:3001/api/restaurants/<restaurant-id>
```

---

## 🔌 Frontend Integration Guide

### CORS Configuration
The backend is configured to accept requests from `http://localhost:3000` by default (React dev server). If your frontend runs on a different port, update the `.env` file:

```env
CORS_ORIGIN=http://localhost:3000
```

### API Base URL
Set this in your frontend environment:

```javascript
// .env.local (React)
REACT_APP_API_URL=http://localhost:3001/api

// Or in your config
const API_BASE_URL = 'http://localhost:3001/api';
```

### Authentication Flow

**1. Register or Login:**
```javascript
// Register
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'newuser',
    email: 'new@example.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();

// Login
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();
```

**2. Store Token:**
```javascript
// Store in localStorage or state management
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

**3. Use Token in Requests:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3001/api/restaurants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'New Restaurant',
    address: '123 Main St',
    city: 'Toronto',
    province: 'Ontario',
    postal_code: 'M5H2N2',
    phone: '416-555-1234',
    category: 'Italian'
  })
});
```

### Common Frontend Operations

**Fetch Restaurants:**
```javascript
// Get all restaurants
const response = await fetch('http://localhost:3001/api/restaurants');
const { restaurants, count } = await response.json();

// Filter by city
const response = await fetch('http://localhost:3001/api/restaurants?city=Toronto');

// Search
const response = await fetch('http://localhost:3001/api/restaurants/search?q=sushi');
```

**Get Restaurant Details:**
```javascript
const response = await fetch(`http://localhost:3001/api/restaurants/${restaurantId}`);
const restaurant = await response.json();
// Includes payment_methods and cash_discounts arrays
```

**Submit Payment Method:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3001/api/payment-methods', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    restaurant_id: restaurantId,
    payment_type: 'visa',
    is_accepted: true
  })
});
```

**Vote on Payment Method:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch(`http://localhost:3001/api/payment-methods/${methodId}/vote`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    vote_type: 'upvote' // or 'downvote'
  })
});
```

### Error Handling
```javascript
try {
  const response = await fetch('http://localhost:3001/api/restaurants');
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    
    // Handle specific status codes
    if (response.status === 401) {
      // Redirect to login
    } else if (response.status === 429) {
      // Rate limit exceeded
    }
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Network error:', error);
}
```

### TypeScript Types (Optional)
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  role: 'guest' | 'registered' | 'admin';
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
  category: string;
  cuisine_tags: string[];
  website_url: string | null;
  operating_hours: Record<string, { open: string; close: string }> | null;
  is_verified: boolean;
  payment_methods?: PaymentMethod[];
  cash_discounts?: CashDiscount[];
}

interface PaymentMethod {
  id: string;
  type: string;
  upvotes: number;
  downvotes: number;
  is_accepted: boolean;
  is_verified: boolean;
  confidence_score: number;
}

interface CashDiscount {
  id: string;
  percentage: number;
  description: string;
  upvotes: number;
  downvotes: number;
  is_active: boolean;
  is_verified: boolean;
  confidence_score: number;
}
```

---

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server health status and uptime.

---

### Authentication

#### Register New User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get Profile (Authenticated)
```
GET /api/auth/profile
Authorization: Bearer <token>
```

#### Update Profile (Authenticated)
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "password": "newpassword123"
}
```

---

### Restaurants

#### Get All Restaurants
```
GET /api/restaurants?city=Toronto&category=Japanese&verified=true&search=sushi
```

**Query Parameters:**
- `city`: Filter by city
- `category`: Filter by category
- `verified`: Filter verified restaurants (true/false)
- `search`: Search in name, address, or tags

#### Get Restaurant by ID
```
GET /api/restaurants/:id
```

#### Search Restaurants
```
GET /api/restaurants/search?q=sushi&city=Toronto
```

#### Create Restaurant (Authenticated)
```
POST /api/restaurants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Example Restaurant",
  "address": "123 Main Street",
  "city": "Toronto",
  "province": "Ontario",
  "postal_code": "M5H 2N2",
  "phone": "416-555-1234",
  "category": "Italian",
  "cuisine_tags": ["Pasta", "Pizza"],
  "website_url": "https://example.com",
  "operating_hours": {
    "monday": { "open": "11:00", "close": "22:00" },
    "tuesday": { "open": "11:00", "close": "22:00" }
  }
}
```

#### Update Restaurant (Authenticated, Owner Only)
```
PUT /api/restaurants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "416-555-9999"
}
```

#### Verify Restaurant (Admin Only)
```
POST /api/restaurants/:id/verify
Authorization: Bearer <token>
```

#### Get Pending Verifications (Admin Only)
```
GET /api/restaurants/admin/pending
Authorization: Bearer <token>
```

#### Delete Restaurant (Admin Only)
```
DELETE /api/restaurants/:id
Authorization: Bearer <token>
```

---

### Payment Methods

#### Get Payment Methods for Restaurant
```
GET /api/payment-methods/restaurant/:restaurantId
```

#### Submit/Update Payment Method (Authenticated)
```
POST /api/payment-methods
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant_id": "uuid-here",
  "payment_type": "visa",
  "is_accepted": true
}
```

**Payment Types:** `cash`, `debit`, `visa`, `mastercard`, `amex`, `discover`, `jcb`, `unionpay`, `wechat_pay`, `alipay`, `paypal`, `apple_pay`, `google_pay`

#### Vote on Payment Method (Authenticated)
```
POST /api/payment-methods/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "vote_type": "upvote"
}
```

**Vote Types:** `upvote`, `downvote`

#### Verify Payment Method (Admin Only)
```
POST /api/payment-methods/:id/verify
Authorization: Bearer <token>
```

#### Delete Payment Method (Admin Only)
```
DELETE /api/payment-methods/:id
Authorization: Bearer <token>
```

---

### Cash Discounts

#### Get Cash Discounts for Restaurant
```
GET /api/cash-discounts/restaurant/:restaurantId
```

#### Submit Cash Discount (Authenticated)
```
POST /api/cash-discounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurant_id": "uuid-here",
  "percentage": 5.0,
  "description": "5% off for cash payments",
  "is_active": true
}
```

#### Vote on Cash Discount (Authenticated)
```
POST /api/cash-discounts/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "vote_type": "upvote"
}
```

#### Update Cash Discount (Authenticated)
```
PUT /api/cash-discounts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "percentage": 10.0,
  "description": "Updated discount",
  "is_active": true
}
```

#### Verify Cash Discount (Admin Only)
```
POST /api/cash-discounts/:id/verify
Authorization: Bearer <token>
```

#### Delete Cash Discount (Admin Only)
```
DELETE /api/cash-discounts/:id
Authorization: Bearer <token>
```

---

## 🔐 Authentication & Authorization

### User Roles
- **guest**: Can view data only (no authentication required)
- **registered**: Can create and vote on content
- **admin**: Can verify and delete content

### JWT Token
After successful login/registration, you'll receive a JWT token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Include this token in the Authorization header for protected endpoints:

```
Authorization: Bearer <your-token-here>
```

Token expires in 7 days by default.

---

## 🗄️ Database

### Schema
- **users**: User accounts and profiles
- **restaurants**: Restaurant information
- **payment_methods**: Payment method acceptance
- **payment_method_votes**: User votes on payment methods
- **cash_discounts**: Cash discount offers
- **cash_discount_votes**: User votes on cash discounts
- **audit_logs**: System activity logs

### Views
- **restaurant_summary**: Aggregated restaurant data with payment methods
- **user_statistics**: User contribution statistics
- **restaurants_pending_verification**: Unverified restaurants

### Accessing the Database

**Using Docker:**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d cash_or_card

# Run a query
docker-compose exec postgres psql -U postgres -d cash_or_card -c "SELECT * FROM restaurants;"
```

**Using pgAdmin:**
Open http://localhost:5050 in your browser:
- Email: admin@cash-or-card.com
- Password: admin (default, change in .env)

---

## 🛠️ Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # PostgreSQL connection pool
│   │   └── env.js       # Environment variables
│   ├── dao/             # Data Access Objects
│   │   ├── userDAO.js
│   │   ├── restaurantDAO.js
│   │   ├── paymentMethodDAO.js
│   │   └── cashDiscountDAO.js
│   ├── utils/           # Utility functions
│   │   └── auth.js      # JWT and password hashing
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # Authentication & authorization
│   │   └── errorHandler.js
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── database/
│   ├── migrations/      # Database migrations
│   ├── seeds/           # Seed data
│   └── init.sh          # Database initialization script
├── Dockerfile
├── docker-compose.yml
└── package.json
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=cash_or_card
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

---

## 🧪 Testing

### Using cURL

**Test Health:**
```bash
curl http://localhost:3001/health
```

**Register User:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

**Get Restaurants:**
```bash
curl http://localhost:3001/api/restaurants
```

**Get Restaurant by ID:**
```bash
curl http://localhost:3001/api/restaurants/<restaurant-id>
```

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **SQL Injection Prevention**: Parameterized queries
- **Input Validation**: Express-validator for request validation

---

## 📊 Vote Confidence Scoring

The system uses the **Wilson Score Confidence Interval** to calculate reliable confidence scores for votes:

- Handles small sample sizes effectively
- Prevents manipulation from single votes
- Balances positive and negative feedback
- More conservative for items with few votes

---

## 🐳 Docker

### Build Image
```bash
docker build -t cash-or-card-backend .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e POSTGRES_HOST=host.docker.internal \
  -e JWT_SECRET=your_secret \
  cash-or-card-backend
```

### Multi-stage Build
The Dockerfile uses a multi-stage build for optimization:
- **Builder stage**: Installs all dependencies
- **Production stage**: Copies only production dependencies
- Final image size: ~200MB

---

## 📝 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes
- `200 OK`: Successful GET/PUT/DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## 📖 Additional Documentation

- [Project Proposal](../docs/Project_Proposal.md)
- [Development Plan](../docs/Development_Plan.md)
- [Database Schema](../docs/DB_Schema.md)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

---

## 📄 License

See [LICENSE](../LICENSE) file for details.

---

## 🆘 Troubleshooting

### For Frontend Developers

#### CORS Errors
If you see CORS errors in the browser console:

```bash
# 1. Check backend CORS settings
docker-compose logs backend | grep CORS

# 2. Update .env file with your frontend URL
# Edit .env in project root:
CORS_ORIGIN=http://localhost:3000  # or your frontend port

# 3. Restart backend
docker-compose restart backend
```

#### Connection Refused / Cannot Reach API
```bash
# 1. Check if backend is running
docker-compose ps

# 2. Check backend health
curl http://localhost:3001/health

# 3. If not running, start it
docker-compose up -d backend

# 4. Check backend logs for errors
docker-compose logs backend
```

#### Empty Data / No Restaurants
```bash
# 1. Check if seed data was loaded
curl http://localhost:3001/api/restaurants

# 2. If empty, reload seed data
docker-compose down -v
docker-compose up -d

# 3. Wait for database to initialize (~10 seconds)
sleep 10

# 4. Verify again
curl http://localhost:3001/api/restaurants
```

#### 401 Unauthorized Errors
```bash
# Your token may have expired (7 days)
# Login again to get a new token

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cash-or-card.com","password":"user123"}'
```

#### 429 Too Many Requests
```bash
# You've hit the rate limit (100 requests per 15 minutes)
# Wait 15 minutes or increase the limit in .env:

RATE_LIMIT_MAX_REQUESTS=1000

# Then restart backend:
docker-compose restart backend
```

### General Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend image
docker-compose build backend

# Restart backend
docker-compose restart backend
```

### Port Already in Use
```bash
# Check what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env
BACKEND_PORT=3002
```

---

## 📮 Contact

For questions or issues, please open an issue on the GitHub repository.

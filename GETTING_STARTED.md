# Getting Started - Frontend Development

This guide will help you quickly set up the backend API and database so you can start frontend development.

## ⚡ Quick Setup (5 minutes)

### 1. Start Everything
From the project root directory:

```bash
docker-compose up -d
```

This single command will:
- ✅ Start PostgreSQL database (port 5432)
- ✅ Run all database migrations
- ✅ Load seed data (6 restaurants, 3 test users)
- ✅ Start backend API (port 3001)
- ✅ Start pgAdmin for database management (port 5050)

### 2. Verify It's Working

```bash
# Check services are running
docker-compose ps

# Test backend health
curl http://localhost:3001/health

# Get restaurants (should return 6)
curl http://localhost:3001/api/restaurants
```

### 3. You're Ready!

The API is now running at: **http://localhost:3001/api**

## 🔑 Test Accounts

Use these pre-configured accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@cash-or-card.com | admin123 |
| **User** | user@cash-or-card.com | user123 |
| **Contributor** | contributor@cash-or-card.com | contributor123 |

### Quick Test Login

```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cash-or-card.com","password":"admin123"}'

# You'll get back a token - save it for authenticated requests
```

## 📡 API Base URL

Configure your frontend to use:

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 🔄 Common Commands

### View Logs
```bash
# All logs
docker-compose logs

# Backend only
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart backend only
docker-compose restart backend
```

### Fresh Start (reload seed data)
```bash
docker-compose down -v && docker-compose up -d
```

### Stop Services
```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (but keep data)
docker-compose down
```

## 📚 Available Endpoints

### Public (No Authentication)
- `GET /api/restaurants` - List all restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `GET /api/restaurants/search?q=sushi` - Search restaurants
- `GET /api/payment-methods/restaurant/:id` - Get payment methods
- `GET /api/cash-discounts/restaurant/:id` - Get cash discounts

### Authenticated (Need Token)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `POST /api/restaurants` - Create restaurant
- `POST /api/payment-methods` - Submit payment method
- `POST /api/payment-methods/:id/vote` - Vote on payment method
- `POST /api/cash-discounts` - Submit cash discount
- `POST /api/cash-discounts/:id/vote` - Vote on discount

### Admin Only
- `POST /api/restaurants/:id/verify` - Verify restaurant
- `DELETE /api/restaurants/:id` - Delete restaurant
- `POST /api/payment-methods/:id/verify` - Verify payment method
- `POST /api/cash-discounts/:id/verify` - Verify discount

## 🔐 Authentication Example

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@cash-or-card.com',
    password: 'user123'
  })
});

const { token, user } = await loginResponse.json();

// 2. Store token
localStorage.setItem('token', token);

// 3. Use token in requests
const createResponse = await fetch('http://localhost:3001/api/restaurants', {
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

## 🎯 Sample Data

The seed data includes:

### 6 Restaurants
- Ichiban Japanese Restaurant (Scarborough)
- Muni Robata (Toronto)
- Cafe N One (Scarborough)
- Hao Xiong Di Chinese BBQ (Scarborough)
- Lala Spicy Food (Scarborough)
- Omiwol Korean BBQ (North York)

Each restaurant has:
- Payment methods (cash, debit, visa, mastercard, amex)
- Cash discounts (2-10%)
- Votes and confidence scores
- Operating hours

### 3 Test Users
- Admin (can verify/delete)
- Regular users (can create/vote)

## 🛠️ Troubleshooting

### CORS Errors
If you see CORS errors, the backend is configured for `http://localhost:3000` by default. If your frontend runs on a different port:

```bash
# Edit .env file
CORS_ORIGIN=http://localhost:3001  # or your port

# Restart backend
docker-compose restart backend
```

### Can't Connect to API
```bash
# Check if backend is running
docker-compose ps

# Check backend logs for errors
docker-compose logs backend

# Try restarting
docker-compose restart backend
```

### Empty Data
```bash
# Reload seed data
docker-compose down -v
docker-compose up -d

# Wait 10 seconds for initialization
sleep 10

# Test again
curl http://localhost:3001/api/restaurants
```

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001

# Kill the process or change port in .env
BACKEND_PORT=3002
docker-compose up -d
```

## 📖 Full Documentation

For complete API documentation, see:
- [Backend README](backend/README.md) - Full API reference
- [Project Proposal](docs/Project_Proposal.md) - Project overview
- [Development Plan](docs/Development_Plan.md) - Architecture details

## 🆘 Need Help?

1. Check backend logs: `docker-compose logs backend`
2. Check database logs: `docker-compose logs postgres`
3. Verify services: `docker-compose ps`
4. Test health endpoint: `curl http://localhost:3001/health`

## ✅ You're All Set!

The backend is ready for frontend integration. Start building your React components and connect them to these API endpoints.

Happy coding! 🚀

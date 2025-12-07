# Cash-or-Card-ON: Final Project Report

[![Project Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/acejarvis/cash-or-card-on)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Team Information

| Name                | Student Number | Email                          |
|---------------------|----------------|--------------------------------|
| Jarvis Wang         | [1004071602]   | [jarvis.wang@mail.utoronto.ca] |
| Yicheng (Ethan) Yao | [1004001778]   | [yicheng.yao@mail.utoronto.ca] |

---

## 1. Motivation

<<<<<<< Updated upstream
### For Frontend Developers

Get the backend API and database running in one command:

```bash
# Start all services (database + backend API)
docker-compose up -d

# Verify everything is running
curl http://localhost:3001/health
curl http://localhost:3001/api/restaurants
```
=======
### 1.1 Problem Statement
Dining out in Ontario, particularly in the culturally rich and diverse culinary landscape of the Greater Toronto Area (GTA), presents an unexpected and persistent challenge: payment method uncertainty. While the global economy increasingly moves towards a cashless society, a significant number of restaurants—especially authentic Asian establishments, small family-owned businesses, and food court vendors—retain restrictive payment policies.

Customers frequently encounter frustrating scenarios where:
- Establishments are strictly **Cash Only**, often with only a small handwritten sign at the register.
- Some restaurants offer **Cash Discount** and this information is usually hidden
- **Debit Cards** are accepted, but **Credit Cards** are not, forcing customers to use funds they didn't intend to spend immediately.
- **Visa** and **Mastercard** are accepted, but **American Express** is declined due to higher merchant fees.

This uncertainty creates significant friction in the dining experience. Customers may arrive hungry, only to discover they lack the appropriate payment method. This leads to embarrassing rejections at the counter, frantic searches for nearby ATMs (which often incur high third-party withdrawal fees), or the need to abandon their dining plans entirely.

Furthermore, a "hidden economy" of cash discounts exists. Many restaurants offer incentives—typically **5% to 15% discounts**—for cash payments to avoid credit card processing fees (which can range from 1.5% to 3.5% for merchants). This information is rarely advertised online and is usually only discovered at the point of sale. Without advance knowledge, budget-conscious consumers miss out on significant savings opportunities. For a family dinner costing $100, a 10% cash discount represents $10 in savings—enough to cover an appetizer or dessert.

Existing solutions like Google Maps, Yelp, or TripAdvisor provide incomplete or generic payment information. They often rely on binary attributes (e.g., "Accepts Credit Cards: Yes/No") which fail to capture the nuance of specific card networks or cash incentives. Information is frequently outdated, unverified, or buried deep within user reviews, requiring manual and time-consuming searching.
>>>>>>> Stashed changes

### 1.2 Significance
The significance of solving this problem lies in bridging the information gap between businesses and consumers, creating value for all stakeholders in the dining ecosystem.

<<<<<<< Updated upstream
**API Base URL:** `http://localhost:3001/api`
=======
For **consumers**, accurate payment information provides peace of mind and financial benefits. Knowing ahead of time that a restaurant is cash-only allows diners to prepare by visiting their bank's ATM, avoiding fees. Knowing about cash discounts allows them to make informed financial decisions. In an era of rising inflation, these small savings accumulate.
>>>>>>> Stashed changes

For **businesses**, clear communication of payment policies reduces friction at the point of sale. It improves table turnover by avoiding payment delays caused by card rejections. Furthermore, it can attract a specific segment of budget-conscious customers who are actively looking for cash deals. By listing their discounts on our platform, businesses can turn a cost-saving measure into a marketing advantage.

<<<<<<< Updated upstream
### For Backend Developers

```bash
# Start database only
docker-compose up -d postgres

# Install backend dependencies
cd backend && npm install

# Run backend locally
npm run dev
```

� See [backend/README.md](backend/README.md) for API documentation.
=======
For the **community**, a crowdsourced platform fosters a sense of shared knowledge. By democratizing this information, we empower diners to help one another. The platform serves as a digital "word-of-mouth" network, preserving the local knowledge that is often lost in large, generic platforms.

### 1.3 Target Audience
Our platform serves three primary user groups:
1.  **Diners and Food Enthusiasts**: Individuals planning restaurant visits who want to ensure a smooth experience without payment hiccups. They value convenience and reliability.
2.  **Budget-Conscious Consumers**: Students, large families, and frugal diners specifically seeking cash discount opportunities to maximize their dining budget. They value savings and deal discovery.
3.  **Tourists and Newcomers**: Visitors unfamiliar with the local payment landscape who need reliable, verified information to navigate the city's dining scene. They may not carry local currency or know which ATMs are safe, making accurate card acceptance info critical.
>>>>>>> Stashed changes

---

## 2. Objectives

### 2.1 Primary Business Objectives
The primary objective of this project was to build a **cloud-native, community-driven web platform** that enables users to discover, share, and verify restaurant payment methods and cash discount information across Ontario.

Key business goals included:
- **Accuracy**: Implementing a robust verification system to ensure crowdsourced data is reliable and trustworthy, distinguishing our platform from unverified review sites.
- **Usability**: Creating an intuitive interface for searching and contributing data, recognizing that users will often access the site while on the go.
- **Community Engagement**: Designing features that encourage user participation, such as voting and reputation building.

### 2.2 Core Technical Requirements
From a technical perspective, we aimed to demonstrate mastery of the fundamental cloud computing concepts required by the course:

- **Microservices Architecture**: Decomposing the application into independent services (Frontend, Backend, Database) to allow for separate development lifecycles and scaling strategies.
- **Containerization**: Packaging all application components into lightweight, portable Docker containers to ensure consistency across development, testing, and production environments.
- **Orchestration**: Using **Kubernetes (K8s)** to manage the lifecycle, scaling, and networking of these containers in a production environment.
- **Infrastructure as Code (IaC)**: Defining infrastructure requirements through declarative configuration files (YAML) to ensure reproducibility and version control of the infrastructure itself.
- **Monitoring and Observability**: Implementing custom monitoring and logging to gain real-time insights into system performance, resource utilization, and user behavior.

### 2.3 Advanced Features
Beyond the core requirements, we implemented several advanced features to enhance the robustness and professional quality of the platform:

- **CI/CD Automation**: Automating the build, test, and deployment process using GitHub Actions to streamline development and reduce the risk of human error during deployments.
- **Auto-scaling and High Availability**: Implementing Horizontal Pod Autoscaling (HPA) to automatically adjust the number of backend pods based on CPU utilization, ensuring the application remains responsive under varying loads.
- **Security Enhancements**: Implementing strict Role-Based Access Control (RBAC), JWT authentication, and securing sensitive data using Kubernetes Secrets.

---

## 3. Technical Stack

### 3.1 Architecture Overview
We adopted a **Three-Tier Architecture**, separating the application into distinct, loosely coupled layers:
1.  **Presentation Layer (Frontend)**: A Single Page Application (SPA) running in the user's browser.
2.  **Logic Layer (Backend)**: A RESTful API server handling business logic, authentication, and data processing.
3.  **Data Layer (Database)**: A relational database for structured data storage and integrity.

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  (In Progress)  │
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

This separation allows for independent scaling. For example, if traffic spikes, we can scale the backend API pods independently of the database or frontend.

### 3.2 Frontend
- **Framework**: **React.js** (v18) was chosen for its component-based architecture, enabling a responsive and interactive UI. We utilized **Functional Components** and **Hooks** (`useState`, `useEffect`, `useContext`) for modern, clean state management.
- **UI Library**: **Material UI (MUI)** provided a robust set of pre-built components (Cards, Modals, Grids, Inputs) that ensured a polished, modern aesthetic and consistent design language without writing custom CSS for every element.
- **Mapping**: **Leaflet** and **React-Leaflet** were used to render interactive maps. This allows users to visualize restaurant locations as pins, click for details, and see their own location relative to dining options.
- **HTTP Client**: **Axios** was used for making asynchronous HTTP requests to the backend API, handling request interception for JWT token injection and centralized error handling.
- **Visualization**: **Chart.js** was integrated to render real-time graphs for the resource monitoring dashboard, visualizing CPU and memory metrics.

<<<<<<< Updated upstream
**Frontend:** (In Development)
- React.js
- React Router
- Axios/Fetch API
=======
### 3.3 Backend
- **Runtime**: **Node.js** with **Express.js** was selected for its non-blocking I/O model, making it ideal for handling concurrent API requests typical of a social platform.
- **API Design**: We implemented a **RESTful API** structure, defining clear endpoints for resources (e.g., `GET /api/restaurants`, `POST /api/votes`).
- **Architecture Pattern**: We followed the **Controller-Service-DAO** pattern:
    - **Controllers**: Handle HTTP request/response, input validation, and status codes.
    - **DAOs (Data Access Objects)**: Encapsulate direct database interactions and SQL queries.
- **Security Middleware**:
    - **Helmet**: Sets secure HTTP headers to protect against well-known web vulnerabilities.
    - **Express-Rate-Limit**: Limits repeated requests from the same IP to prevent brute-force attacks and DDoS.
    - **CORS**: Configured to allow requests only from our specific frontend domain.
>>>>>>> Stashed changes

### 3.3.1 Key API Endpoints
- **Public**:
    - `GET /api/restaurants`: List all restaurants.
    - `GET /api/restaurants/search?q=sushi`: Search restaurants.
    - `GET /api/payment-methods/restaurant/:id`: Get payment methods.
- **Authenticated**:
    - `POST /api/auth/register`: Register new user.
    - `POST /api/auth/login`: Login.
    - `POST /api/payment-methods/:id/vote`: Vote on payment method.
- **Admin**:
    - `POST /api/restaurants/:id/verify`: Verify restaurant.
    - `DELETE /api/restaurants/:id`: Delete restaurant.

<<<<<<< Updated upstream
**DevOps:**
- Docker & Docker Compose
- pgAdmin for database management
- Automated migrations and seeding
=======
### 3.4 Database
- **System**: **PostgreSQL** (v15) was chosen for its reliability, ACID compliance, and strong support for complex relational queries.
- **Extensions**:
    - `uuid-ossp`: Enabled generation of UUIDs for primary keys, providing better security and distribution than sequential integers.
    - `pg_trgm`: Enabled trigram matching for efficient fuzzy text search (e.g., finding "McDonalds" even if the user types "MacDonalds").
- **Schema Design**:
    - `users`: Stores authentication data, roles, and profile info.
    - `restaurants`: Core business info. We used a **JSONB** column for `operating_hours` to flexibly store nested opening/closing times without creating a complex separate table.
    - `payment_methods`: Links restaurants to payment types (Visa, Amex, etc.) with vote counts.
    - `cash_discounts`: Stores discount percentages and descriptions.
    - `audit_logs`: A dedicated table that tracks every modification (CREATE, UPDATE, DELETE), recording *who* did it, *when*, and the *old/new values*. This is crucial for accountability in a crowdsourced platform.
- **Views**:
    - `restaurant_summary`: Aggregated restaurant data with payment methods.
    - `user_statistics`: User contribution statistics.
    - `restaurants_pending_verification`: Unverified restaurant submissions.

### 3.5 Infrastructure & Cloud
- **Containerization**: **Docker** was used to create optimized images. We utilized a 3-stage container build process for the frontend, backend, and database.
- **Orchestration**: **Kubernetes (K8s)** on **DigitalOcean** managed the deployment.
    - **Deployments**: We defined deployments for Backend (replicas for HA) and Frontend.
    - **Services**:
        - `ClusterIP`: For internal communication (Backend <-> Database).
        - `NodePort`: For exposing services to the external load balancer.
    - **ConfigMaps**: Stores non-sensitive config (e.g., `DB_HOST`, `NODE_ENV`).
    - **Secrets**: Securely stores sensitive data (e.g., `DB_PASSWORD`, `JWT_SECRET`) encoded in base64.
    - **PersistentVolumeClaims (PVC)**: We requested 50GB of block storage from DigitalOcean to ensure PostgreSQL data persists even if the database pod crashes or is rescheduled to a different node.
- **Registry**: **DigitalOcean Container Registry (DOCR)** stores our private Docker images.
>>>>>>> Stashed changes

---

## 4. Features

### 4.1 Restaurant Discovery & Search
The search functionality is the core entry point for users.
- **Keyword Search**: Users can search by restaurant name, address, or cuisine type. The backend uses PostgreSQL's `ILIKE` and trigram matching to provide fuzzy search capabilities.
- **Advanced Filtering**:
    - **Payment Methods**: Users can filter for specific needs, e.g., "Must accept Amex" or "Cash Only".
    - **Cash Discounts**: A toggle to show only restaurants offering cash discounts.
    - **Verification Status**: Users can choose to see only "Verified" listings for maximum reliability.
- **Interactive Map**: The map view updates dynamically as the user filters results, showing pins for matching restaurants. Clicking a pin opens a summary card.

### 4.2 Detailed Restaurant Insights
The restaurant detail page provides a comprehensive view:
- **Discount Details**: Specifics of cash discounts are shown, such as "10%".
- **Metadata**: Standard info like address, phone, and operating hours is presented clearly.
- **Payment info**: Acceptable payment methods such as cash, debit and credit card will be displayed

### 4.3 Community Crowdsourcing & Voting
The platform relies on crowdsourcing.
- **Cash Discount**: Registered users can propose new cash discounts.
- **Payment Method**: Registered users can submit changes regarding payment methods, such as Amex is not accepted.

### 4.4 User Management & RBAC
We implemented strict **Role-Based Access Control (RBAC)**:
- **Guest**: Read-only access. Can search and view details but cannot vote or edit.
- **Registered User**: Read/Write access. Can propose payment methods, and vote for payment method.
- **Admin**: Full control.
    - **Verification Dashboard**: Admins can review flagged restaurants and manually "Verify" them, which locks the data and overrides community votes.
    - **User Management**: Admins can ban abusive users or promote others to moderators.
    - **Add New Restaurants**: Admins can create new restaurants

### 4.5 Resource Monitoring
To meet the course's observability requirements, we built a custom monitoring solution.
- **Metrics Collection**: The backend exposes a `/metrics` endpoint that gathers system stats (CPU usage, Memory usage, Uptime) using Node.js `os` and `process` modules from DigitalOcean metrics API.
- **Visualization**: The frontend Admin Dashboard polls this endpoint every 5 seconds and renders real-time line charts using Chart.js. This allows admins to spot performance bottlenecks or memory leaks instantly.

---

## 5. User Guide

### 5.1 Getting Started
1.  **Access the Application**: Navigate to the live URL.
2.  **Registration**:
    - Click the "Login" button in the top right.
    - Select "Create Account".
    - Enter a valid email, username, and password.
    - You will be automatically logged in upon success.
3.  **Test Accounts**: You can also use the following pre-defined accounts for testing:

| Role      | Email                  | Password |
|-----------|------------------------|----------|
| **Admin** | admin@cash-or-card.com | admin123 |
| **User**  | user@cash-or-card.com  | user123  |

### 5.2 Searching for Restaurants
1.  **Home Page**: You are greeted with a search bar and a list of trending restaurants.
2.  **Search**: Type "Ramen" or "Spadina" into the search bar. The list updates in real-time.
3.  **Filters**: Click the "Filter" icon. Select "Cash Discount" to find deals.
4.  **Map Mode**: Click the "Map" toggle in the top right. The list view is replaced by a map. Drag and zoom to explore.

### 5.3 Contributing Data
1.  **Vote on Payment Methods**:
    - Open a restaurant's detail page.
    - You will see a list of payment methods (e.g., Visa, Cash).
    - You can mark a payment method as accepted or not accpeted.
2.  **Submit Cash Discount**:
    - On the restaurant detail page, look for the Cash Discount section.
    - Click "Add Discount" to report a new deal.
    - Enter the percentage (e.g., 10%) and description.
    - Click "Submit" to share the savings with the community.

### 5.4 Admin Dashboard
1.  Log in with an account that has the `admin` role.
2.  Click the "Admin Panel" button in the header.
3.  **Tabs**:
    - **Pending Approvals**: View restaurants that need verification. Click "Verify" to stamp them with the official checkmark.
    - **System monitoring**: Watch the live CPU/Memory graphs to ensure the server is healthy.
4.  **Restaurant Management**:
    - **Add**: Click the create restaurants button to create a new restaurant listing.
    - **Edit**: Select a restaurant to update its details (address, hours, etc.).
    - **Delete**: Remove a restaurant from the platform if it has closed or is a duplicate.

---

## 6. Development Guide

### 6.1 Prerequisites
- **Docker Desktop**: Must be installed and running.
- **Git**: For version control.
- **Node.js** (v18+): Optional, only if running outside Docker.

### 6.2 Local Setup
We utilize `docker-compose` to orchestrate the entire development environment. This ensures that every developer works with the exact same versions of the database and runtime.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/acejarvis/cash-or-card-on.git
    cd cash-or-card-on
    ```

2.  **Start Services**:
    ```bash
    docker-compose up -d
    ```
    This command reads `docker-compose.yml` and starts:
    - **postgres**: The database container (Port 5432). It automatically runs initialization scripts from `backend/database/migrations/` to create tables.
    - **backend**: The Node.js API container (Port 3001). It connects to the postgres container using the internal hostname `postgres`.
    - **frontend**: The React development server (Port 3000). It supports hot-reloading.
    - **pgadmin**: A web-based database GUI (Port 5050) for debugging.

<<<<<<< Updated upstream
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

# View logs
docker-compose logs -f backend
```

### Common Commands
```bash
# Restart services
docker-compose restart

# Stop services (keep data)
docker-compose stop

# Stop and remove (keep data)
docker-compose down

# Fresh start (remove all data)
docker-compose down -v && docker-compose up -d

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend
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
=======
3.  **Verify Installation**:
    - Open your browser to `http://localhost:3000`. You should see the Cash-or-Card-ON homepage.
    - Check the backend health: `curl http://localhost:3001/health`.
>>>>>>> Stashed changes

### 6.3 Project Structure
```
cash-or-card-on/
├── backend/
│   ├── src/
│   │   ├── config/           # Database & env configuration
│   │   ├── dao/              # Data Access Objects
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth & error handling
│   │   └── app.js            # Express app setup
│   ├── database/
│   │   ├── migrations/       # Database schema
│   │   └── seeds/            # Test data
│   └── Dockerfile
├── frontend/
<<<<<<< Updated upstream
│   └── cash-or-card/         # React application (in progress)
├── docs/
│   ├── Project_Proposal.md   # Project proposal
│   └── Development_Plan.md   # Development timeline
├── docker-compose.yml        # Service orchestration
├── GETTING_STARTED.md        # Quick start guide
├── .env                      # Environment variables
└── README.md                 # This file
=======
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── utils/            # Helper functions
│   │   └── App.js            # Main app component
│   └── Dockerfile
├── do-k8s/                   # Kubernetes manifests
├── docs/                     # Documentation
└── docker-compose.yml        # Service orchestration
>>>>>>> Stashed changes
```

### 6.4 Troubleshooting
- **Services Won't Start**: Run `docker-compose down -v && docker-compose up -d` to reset the environment.
- **API Connection Issues**: Ensure the backend is running with `curl http://localhost:3001/health`.
- **Database Issues**: Check logs with `docker-compose logs postgres`.
- **CORS Errors**: Verify `CORS_ORIGIN` in `.env` matches your frontend URL.

---

## 7. Deployment Information

<<<<<<< Updated upstream
### ✅ Completed (Weeks 1-2)

**Database & Infrastructure**
- [x] PostgreSQL schema with 7 tables
- [x] Database migrations and seeding
- [x] Docker Compose setup
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

**Documentation**
- [x] Backend API documentation
- [x] Getting started guide
- [x] Database schema documentation
- [x] Project proposal
- [x] Development plan

### 🔄 In Progress (Weeks 3-4)

**Frontend Development**
- [ ] React application setup
- [ ] Component library
- [ ] Authentication UI
- [ ] Restaurant search and filtering
- [ ] Restaurant details page
- [ ] Payment method submission
- [ ] Voting interface
- [ ] Admin panel

### ⏳ Planned (Weeks 5-8)

**Advanced Features**
- [ ] Advanced search filters
- [ ] User profile management
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Data export functionality

**Testing & Deployment**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
=======
### 7.1 Deployment Pipeline
Our deployment is fully automated via **GitHub Actions**, ensuring a robust CI/CD process. The workflow file is located at `.github/workflows/deploy.yml`.

**Pipeline Steps:**
1.  **Trigger**: The pipeline starts automatically on any push to the `main` branch.
2.  **Checkout**: The code is checked out from the repository.
3.  **Authentication**: The runner authenticates with DigitalOcean using the `doctl` CLI tool and a secure API token stored in GitHub Secrets.
4.  **Build & Push**:
    - The **Backend** Docker image is built and pushed to the DigitalOcean Container Registry (DOCR).
    - The **Frontend** Docker image is built. Crucially, we dynamically inject the backend API URL (using the Kubernetes Node IP) as a build argument (`REACT_APP_API_BASE`). This ensures the frontend knows where to send requests in the production environment.

### 7.3 Infrastructure Configuration
The infrastructure is defined in the `do-k8s/` directory:
- `backend.yaml`: Defines the Deployment (1 replica) and Service (NodePort 30001). It includes Liveness and Readiness probes to ensure traffic is only sent to healthy pods.
- `frontend.yaml`: Defines the Deployment (1 replica) and Service (NodePort 30000).
- `postgres.yaml`: Defines a **StatefulSet** (instead of Deployment) for the database. This is critical for stateful applications. It mounts a **PersistentVolumeClaim (PVC)** to `/var/lib/postgresql/data`, ensuring data survives pod restarts.
- `secrets.yaml`: Contains base64-encoded secrets for `POSTGRES_PASSWORD` and `JWT_SECRET`.
>>>>>>> Stashed changes

---

## 8. Individual Contributions

### Jarvis Wang
- **Infrastructure Architect**: Designed and implemented the entire Kubernetes infrastructure on DigitalOcean. Wrote all K8s manifests (`deployment`, `service`, `statefulset`, `pvc`, `ingress`) and configured the cluster networking.
- **DevOps Engineer**: Built the CI/CD pipeline using GitHub Actions. Solved complex issues related to dynamic environment variable injection during the Docker build process.
- **Backend Core**: Set up the initial Node.js/Express server structure. Implemented the database connection logic using `pg-pool` and handled environment configuration management.
- **Database Administrator**: Designed the initial database schema and wrote the SQL migration scripts. Managed database security and user roles.

### Yicheng (Ethan) Yao
- **Frontend Lead**: Designed and implemented the entire React application. Created the responsive layout using Material UI and built the custom components for Restaurant Cards and Modals.
- **Feature Implementation**:
    - **Interactive Map**: Integrated Leaflet.js to visualize restaurant data geographically.
    - **Resource Monitoring**: Built the real-time dashboard for tracking system metrics.
- **Full Stack Integration**: Connected the frontend components to the backend APIs. Handled Axios interceptors for JWT authentication and managed global application state.
- **Bug Fixes**: Multiple bug fixes regarding UI/performance/API.

---

## 9. Lessons Learned and Concluding Remarks

### 9.1 Technical Challenges & Solutions
- **Kubernetes Networking**: One of the biggest challenges was configuring the networking between pods. Specifically, exposing the frontend and backend to the outside world while keeping the database internal. We initially struggled with `ClusterIP` vs `NodePort`. We solved this by using `NodePort` for the external-facing services and `ClusterIP` for the database, and configuring the frontend build process to dynamically discover the Node IP.
- **CORS (Cross-Origin Resource Sharing)**: When deploying to the cloud, we faced CORS errors because the frontend (port 30000) and backend (port 30001) were on different ports. We resolved this by configuring the Express `cors` middleware to explicitly allow requests from the frontend's origin.
- **Data Persistence**: We learned the hard way that pods are ephemeral. In early tests, restarting the database pod wiped all our data. We learned to use **PersistentVolumeClaims (PVCs)** to bind our Postgres container to DigitalOcean Block Storage, ensuring data durability.
- **State Management**: Managing the state of the application across the frontend (React Context) and backend (Database consistency) required careful planning. We implemented "Optimistic UI" updates for any data updates, where the UI updates immediately before the server responds, making the app feel snappier.

### 9.2 Conclusion
The "Cash-or-Card-ON" project successfully achieved its objective of creating a useful, community-driven tool for Ontario diners. By leveraging modern cloud technologies, we built a system that is not only functional but also scalable, resilient, and secure.

This project provided invaluable hands-on experience with the full software development lifecycle. We moved beyond simple coding to understanding **System Design**, **Container Orchestration**, and **Devops**. We learned that writing code is just one part of the puzzle; ensuring that code runs reliably in a distributed production environment is equally challenging and rewarding. We believe this platform addresses a genuine need in the community and stands as a testament to the power of cloud-native development.

---

## 10. Demo & Deployment

### 10.1 Video Demo
**URL**: https://youtu.be/LntkDVGhmWw

### 10.2 Live Deployment
**URL**: http://165.227.35.55:30000

---

## 11. Documentation & Resources
For more detailed information, please refer to the following documents:
- **[Getting Started Guide](GETTING_STARTED.md)**: Quick setup guide for developers.
- **[Backend Documentation](backend/README.md)**: Full API reference and backend details.
- **[Project Proposal](docs/Project_Proposal.md)**: Original project overview and objectives.

---

## 12. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

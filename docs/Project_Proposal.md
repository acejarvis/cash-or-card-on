# Cash-or-Card-ON - Project Proposal

## Team Member

- Jarvis Wang
- Yicheng(Ethan) Yao

## 1. Motivation

### Problem Statement

Dining out in Ontario presents an unexpected challenge: payment method uncertainty. Many restaurants, particularly Asian establishments, have limited payment options. Some don’t accept American Express, others are cash-only (especially in food courts and festivals), and surprisingly, not all even accept credit cards. This creates friction in the dining experience—customers arrive hungry, only to discover they lack the appropriate payment method.

The problem extends beyond mere inconvenience. Some restaurants incentivize cash payments by offering discounts (typically 5-15%) to avoid credit card processing fees. Without advance knowledge, customers miss these savings opportunities. Current solutions like Google Maps or Yelp provide incomplete payment information: data is often outdated, unverified, or buried in reviews requiring manual searching.

### Target Users

Our platform serves three primary user groups:

1. **Diners and Food Enthusiasts**: Individuals planning restaurant visits who want to ensure they bring appropriate payment methods and take advantage of cash discounts
2. **Budget-Conscious Consumers**: Users seeking cash discount opportunities to maximize savings on dining expenses
3. **Tourists and Newcomers**: People unfamiliar with local restaurants who need reliable payment information before visiting

### Why This Project Matters

In an increasingly cashless society, the paradox is that some businesses still prefer cash transactions. This information gap creates real-world frustrations: embarrassing payment rejections, last-minute ATM searches, or missed dining opportunities. By crowdsourcing and verifying payment information, our platform transforms this scattered knowledge into actionable, community-driven data. The verification system ensures accuracy, while the voting mechanism captures the wisdom of crowds to maintain up-to-date information.

## 2. Objective and Key Features

### Project Objectives

Build a cloud-native, community-driven web platform that enables users to discover, share, and verify restaurant payment methods and cash discount information across Ontario. The system will leverage containerization, orchestration, and cloud deployment to provide a scalable, reliable, and highly available service that meets all course technical requirements while implementing practical features that solve real user needs.

### Core Technical Implementation

### Containerization and Local Development

- **Docker**: Containerize Node.js backend, PostgreSQL database, and React frontend with multi-stage builds
- **Docker Compose**: Multi-container orchestration for local development (backend, database, frontend, nginx)

### State Management

- **PostgreSQL Database**: Relational database managing restaurants, user accounts, payment method votes, and cash discount submissions
- **Persistent Storage**: DigitalOcean Volumes (minimum 10GB) mounted to database container to ensure data survives container restarts and redeployments
- **Database Schema** includes:
    - **Restaurants**: Core information (name, address, coordinates, hours, category, verification status)
    - **Payment Methods**: Crowdsourced payment types with vote counts per restaurant
    - **Cash Discounts**: User-submitted discount percentages with voting system
    - **Users**: Authentication data with role-based access (guest, registered, admin)
    - **Audit Logs**: Tracking all modifications for accountability

### Deployment Provider

- **DigitalOcean**: Chosen for its IaaS approach, providing clear infrastructure visibility suitable for demonstrating orchestration concepts
- **Components**:
    - Managed Kubernetes cluster (3 nodes minimum)
    - PostgreSQL database with automated backups
    - DigitalOcean Volumes for persistent storage
    - Load Balancer for traffic distribution
    - Container Registry for Docker images

### Orchestration Approach: Kubernetes

- **Deployments**: Backend API (3 replicas), Frontend (2 replicas)
- **Services**: ClusterIP (internal), LoadBalancer (external)
- **ConfigMaps/Secrets**: Environment configs and sensitive data management
- **PersistentVolumeClaims**: Database storage backed by DigitalOcean Volumes
- **Horizontal Pod Autoscaler**: CPU-based auto-scaling

### Monitoring and Observability

- **DigitalOcean Monitoring**: Built-in metrics for cluster health, node CPU/memory/disk usage
- **Application-Level Monitoring**:
    - Custom metrics exported from Node.js backend (request counts, response times, error rates)
    - Database connection pool monitoring
    - API endpoint performance tracking
- **Alerting**: Configured alerts for high CPU usage (>80%), memory pressure, pod restart loops, and failed deployments
- **Logging**: Centralized logging with structured JSON logs for debugging and audit trails

### Advanced Features

### 1. Auto-scaling and High Availability

- **Horizontal Pod Autoscaler (HPA)**: Automatically scales backend API pods based on CPU utilization (target: 70%) and custom metrics (requests per second)
- **Multi-replica Deployments**: Ensures zero-downtime during updates using rolling update strategy
- **Load Balancing**: DigitalOcean Load Balancer distributes traffic across pod replicas
- **Database High Availability**: PostgreSQL replica configuration for read scalability and failover capability
- **Health Checks**: Kubernetes liveness and readiness probes ensure unhealthy pods are automatically restarted

### 2. Security Enhancements

- **Authentication & Authorization**:
    - JWT-based authentication with role-based access control (RBAC)
    - Three user roles: Guest (search only), Registered (vote and submit), Admin (verify and moderate)
    - bcrypt password hashing with salt rounds for secure credential storage
- **HTTPS/TLS**: SSL certificate provisioned via Let’s Encrypt for encrypted communication
- **Secrets Management**: Kubernetes Secrets for sensitive data with encryption at rest
- **API Security**: Rate limiting to prevent abuse, input validation to prevent SQL injection, CORS configuration for frontend-backend communication
- **Network Policies**: Kubernetes network policies restricting pod-to-pod communication

### 3. CI/CD Pipeline (GitHub Actions)

- **Automated Workflow**:
    - **Code Quality**: ESLint for JavaScript linting, cloc for code metrics
    - **Testing**: Unit tests for backend API routes, integration tests for database operations, E2E tests using Docker Compose
    - **Build**: Multi-stage Docker builds for optimized images
    - **Deploy**: Automated kubectl deployments to DigitalOcean Kubernetes on successful builds
    - **Rollback**: Automatic rollback on failed health checks post-deployment
- **Continuous Integration**: Runs on every pull request and merge to main branch
- **Benefits**: Faster iteration cycles, consistent quality checks, reduced human error

### 4. Backup and Recovery

- Daily automated PostgreSQL backups to DigitalOcean Spaces
- Retention: 7 daily, 4 weekly, 3 monthly backups
- Point-in-time recovery with WAL archival
- Monthly restoration tests for validation

### 5. Integration with External Services

- SendGrid email notifications for verification confirmations and password resets
- Weekly digest emails for active users
- Abstracted service layer for provider flexibility

### Application Features

### For All Users (No Authentication Required)

- **Advanced Search & Filtering**:
    - Search by restaurant name, address, or cuisine type
    - Filter by payment methods (Cash, Debit, Visa, Mastercard, Amex)
    - Filter by category (Chinese, Korean, Japanese, Vietnamese, Thai, Italian, French, etc.)
    - Filter by verification status (show only admin-verified restaurants)
    - Filter by distance from current location
    - Filter by currently open restaurants
- **Sorting Options**: By payment method availability, last updated date, distance
- **Responsive Dashboard**: Card grid view adapting to desktop, tablet, and mobile screens
- **Restaurant Detail Modal**: Displays complete information including payment methods with vote counts

Below is a text-based visual mockup demonstrating the card-based restaurant view (Note: Data here is real):

```
┌──────────────────────────────────────────────────────────────────────┐
│                   Restaurant Payment Methods                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Search restaurants by name, cuisine, location...               │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Ichiban [Verified]       │ Muni Robata [Verified]   │ Cafe N One [Verified]    │
│ Japanese, Sushi          │ Japanese, Izakaya        │ Cafe, Brunch             │
│ Location: Scarborough    │ Location: Toronto        │ Location: Scarborough    │
│ Status: Open Now         │ Status: Open Now         │ Status: Open Now         │
│                          │                          │                          │
│ Payment Methods:         │ Payment Methods:         │ Payment Methods:         │
│ [X] Cash  [X] Debit      │ [X] Cash  [X] Debit      │ [X] Cash  [X] Debit      │
│ [X] Visa  [X] MC         │ [X] Visa  [X] MC         │ [ ] Visa  [ ] MC         │
│ [ ] Amex                 │ [X] Amex                 │ [ ] Amex                 │
│                          │                          │                          │
│ Cash Discount: 2%        │ No cash discount         │ Cash Discount: 10%       │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘

┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Hao Xiong Di [Verified]  │ Lala Spicy [Verified]    │ Omiwol K BBQ [Verified]  │
│ Chinese BBQ              │ Szechuan                 │ Korean BBQ               │
│ Location: Scarborough    │ Location: Scarborough    │ Location: North York     │
│ Status: Closed           │ Status: Open Now         │ Status: Open Now         │
│                          │                          │                          │
│ Payment Methods:         │ Payment Methods:         │ Payment Methods:         │
│ [X] Cash  [X] Debit      │ [X] Cash  [X] Debit      │ [X] Cash  [X] Debit      │
│ [X] Visa  [X] MC         │ [X] Visa  [X] MC         │ [X] Visa  [X] MC         │
│ [X] Amex                 │ [ ] Amex                 │ [ ] Amex                 │
│                          │                          │                          │
│ Cash Discount: 5%        │ Cash Discount: 5%        │ Cash Discount: 5%        │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

### For Registered Users

- **Submit Payment Information**: Add supported payment methods for restaurants
- **Submit Cash Discounts**: Report cash discount percentages (e.g., “10% off for cash”)
- **Voting System**: Upvote payment methods and discounts to improve data accuracy
- **User Profile**: View submission history and contribution statistics

### For Admin Users

- **Verification Dashboard**: List view of pending submissions requiring review
- **Verify Submissions**: Mark restaurant payment information as verified after confirmation
- **Moderate Content**: Remove misleading or fraudulent information
- **Audit Trail**: View all modifications with timestamps and user attribution

### Data Pipeline

- **Yelp/Google Maps Integration**: Nightly data sync to populate basic restaurant information (name, address, hours, category)
- **Review Scraping**: Weekly analysis of Google reviews to extract potential payment method mentions using keyword matching (cost-optimized approach)

### Technology Stack

- **Frontend**: React.js with React Router for SPA navigation, Tailwind CSS for responsive styling, Axios for API communication
- **Backend**: Node.js with Express framework, JWT for authentication, bcrypt for password security
- **Database**: PostgreSQL 15 with PostGIS extension for location-based queries
- **Containerization**: Docker with multi-stage builds, Docker Compose for local development
- **Orchestration**: Kubernetes with Helm charts for configuration management
- **Deployment**: DigitalOcean Managed Kubernetes, DigitalOcean PostgreSQL, DigitalOcean Spaces for backups
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: DigitalOcean built-in monitoring with custom application metrics
- **External Services**: SendGrid for transactional emails

### Scope and Feasibility

This project is well-scoped for an 8-week timeline with two developers. The core features (search, filter, submit, vote, verify) and data pipeline are achievable within the first 5 weeks, leaving 3 weeks for advanced feature implementation, testing, and documentation. The data pipeline will automatically populate restaurant data, reducing manual entry burden and providing a robust foundation for the crowdsourced payment information layer.

The technical requirements align perfectly with course objectives: Docker containerization for consistent environments, Kubernetes for production-grade orchestration, PostgreSQL for reliable data persistence, and DigitalOcean for infrastructure deployment. The five advanced features (auto-scaling, security, CI/CD, backup, external integration) exceed the minimum requirement of two, showcasing commitment to building a production-ready system.

## 3. Tentative Plan

### Development Approach

The project will be completed over 8 weeks by two developers working collaboratively with clearly defined responsibilities.

### Responsibility Allocation

**Jarvis (Backend, DevOps, Infrastructure)**
- Backend API development (restaurant CRUD, voting system, admin verification)
- PostgreSQL database design and optimization
- Data pipeline implementation (Yelp/Google Maps integration, review scraping)
- Kubernetes configuration and orchestration
- CI/CD pipeline with GitHub Actions
- Security implementation (JWT authentication, secrets management, HTTPS)
- Backup/recovery system and DigitalOcean infrastructure

**Ethan (Frontend, UI/UX, Monitoring)**
- React.js frontend development (card grid, search, modals, authentication flows)
- Responsive UI/UX design with Tailwind CSS
- Admin dashboard and user profile pages
- DigitalOcean monitoring integration and custom metrics
- SendGrid email notification integration
- Frontend testing and accessibility features

**Collaborative Responsibilities**
- Initial project setup and architecture decisions
- Code reviews and integration testing
- Documentation (README, API docs, architecture diagrams)
- Final testing, presentation, and video demo

### Development Strategy

The team will follow an iterative approach: core features (weeks 1-5) including database setup, API development, frontend components, and data pipeline, followed by advanced features (weeks 5-6) including CI/CD, auto-scaling, security hardening, and monitoring, and finally testing and polish (weeks 7-8) with comprehensive testing, documentation, and optimization. Weekly sync and GitHub Projects will ensure alignment and track progress throughout development.
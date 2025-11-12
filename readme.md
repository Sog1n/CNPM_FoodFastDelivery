# 🍔 Food Fast Delivery System

A comprehensive food delivery platform with drone delivery integration, featuring a modern web application built with React and Node.js.

[![CI/CD Pipeline](https://github.com/your-repo/CNPM_FoodFastDelivery/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-repo/CNPM_FoodFastDelivery/actions)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Food Fast Delivery is a modern food delivery platform that integrates drone delivery technology for faster and more efficient food delivery services. The system allows customers to order food from various restaurants, track their orders in real-time, and receive deliveries via drone or traditional delivery methods.

## ✨ Features

### Customer Features
- 🔐 User authentication and authorization (JWT-based)
- 🍽️ Browse restaurants and menus
- 🛒 Add items to cart and place orders
- 💳 Multiple payment options (Stripe integration)
- 📍 Address management with map integration
- 📦 Real-time order tracking
- 📱 Responsive design for all devices

### Restaurant Features
- 🏪 Restaurant profile management
- 📋 Menu management (add, edit, delete items)
- 📊 Order management dashboard
- ✅ Accept/reject orders
- 🚁 Assign drones to orders
- 📈 Order history and analytics

### Delivery Features
- 🚁 Drone management system
- 📍 Real-time delivery tracking with progress simulation
- 🗺️ Map-based route visualization
- 📊 Delivery status updates
- ⚡ Automated delivery progress tracking

### Admin Features
- 👥 User management
- 🏪 Restaurant approval and management
- 🚁 Drone fleet management
- 📊 System-wide analytics

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **State Management**: Redux Toolkit
- **Routing**: React Router DOM v6
- **Styling**: 
  - TailwindCSS
  - Material-UI (MUI)
  - Emotion (CSS-in-JS)
- **Maps**: 
  - Leaflet
  - React Leaflet
- **HTTP Client**: Axios
- **UI Components**: 
  - Headless UI
  - Lucide React Icons
  - React Icons
- **Notifications**: React Hot Toast, React Toastify
- **Build Tool**: Vite
- **Testing**: Vitest

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **Payment Processing**: Stripe
- **File Upload**: 
  - Multer
  - Cloudinary (image storage)
- **Real-time Communication**: Socket.io
- **Email Service**: Nodemailer
- **Testing**: 
  - Jest
  - Supertest
  - MongoDB Memory Server
- **API Documentation**: RESTful API

### DevOps & Deployment
- **Containerization**: Docker
- **Orchestration**: Kubernetes (k8s)
- **CI/CD**: GitHub Actions
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Cloud-based (configurable)
- **Monitoring**: Prometheus (configured)

## 🏗️ System Architecture

```
┌─────────────────┐
│   React Frontend│
│   (Port 5173)   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Express Backend│
│   (Port 5000)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│MongoDB │ │Cloudinary│
└────────┘ └──────────┘
```

### Key Components

1. **User Service**: Authentication, authorization, profile management
2. **Restaurant Service**: Restaurant management, menu operations
3. **Order Service**: Order processing, status management
4. **Payment Service**: Payment processing with Stripe
5. **Delivery Service**: Drone assignment, delivery tracking
6. **Address Service**: Location management with map integration

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/CNPM_FoodFastDelivery.git
cd CNPM_FoodFastDelivery
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Environment Variables

#### Backend (.env)
Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Service (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_MAP_API_KEY=your_map_api_key
```

### Running the Application

#### Development Mode

1. **Start Backend Server**
```bash
cd backend
npm run dev
```
The backend server will run on `http://localhost:5000`

2. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

#### Production Mode

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Start Backend**
```bash
cd backend
npm start
```

#### Using Docker

1. **Build and Run with Docker Compose**
```bash
docker-compose up --build
```

2. **Stop Containers**
```bash
docker-compose down
```

## 🧪 Testing

### Backend Tests

#### Run All Tests
```bash
cd backend
npm test
```

#### Run Unit Tests
```bash
npm test -- UnitTest
```

#### Run Integration Tests
```bash
npm test -- IntegrationTest
```

#### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage reports will be available in `backend/coverage/lcov-report/index.html`

### Frontend Tests

#### Run Tests
```bash
cd frontend
npm test
```

#### Run Tests with UI
```bash
npm run test:ui
```

#### Generate Coverage
```bash
npm run coverage
```

### Test Documentation

Detailed test scenarios and plans are available in:
- [Test Plan](backend/docs/TestPlan.md)
- [Unit Tests Documentation](backend/UNIT_TESTS_COMPLETE.md)
- [Integration Test Scenarios](backend/__tests__/IntegrationTest/ORDER_FUNCTION_TEST_SCENARIOS.md)

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000`
- Production: `https://your-production-url.com`

### Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/profile` - Get user profile (Protected)

#### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `POST /api/restaurants` - Create restaurant (Protected)
- `PUT /api/restaurants/:id` - Update restaurant (Protected)
- `DELETE /api/restaurants/:id` - Delete restaurant (Protected)

#### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `POST /api/menu` - Create menu item (Protected)
- `PUT /api/menu/:id` - Update menu item (Protected)
- `DELETE /api/menu/:id` - Delete menu item (Protected)

#### Orders
- `GET /api/orders` - Get user orders (Protected)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `POST /api/orders` - Create new order (Protected)
- `PUT /api/orders/:id` - Update order status (Protected)
- `DELETE /api/orders/:id` - Cancel order (Protected)

#### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment (Protected)
- `GET /api/payments/:orderId` - Get payment details (Protected)

#### Delivery/Drones
- `GET /api/drones` - Get all drones
- `GET /api/drones/:id` - Get drone by ID
- `POST /api/drones` - Register new drone (Protected)
- `PUT /api/drones/:id` - Update drone info (Protected)
- `POST /api/drones/assign` - Assign drone to order (Protected)

#### Addresses
- `GET /api/addresses` - Get user addresses (Protected)
- `POST /api/addresses` - Add new address (Protected)
- `PUT /api/addresses/:id` - Update address (Protected)
- `DELETE /api/addresses/:id` - Delete address (Protected)

For detailed API specifications, refer to the [API Documentation](docs/API.md).

## 🚢 Deployment

### Frontend Deployment (Vercel)

1. **Connect to Vercel**
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

2. **Configure Environment Variables** in Vercel Dashboard

3. **Deploy**
```bash
vercel --prod
```

### Backend Deployment

#### Using Docker

1. **Build Image**
```bash
cd backend
docker build -t foodfast-backend .
```

2. **Run Container**
```bash
docker run -p 5000:5000 --env-file .env foodfast-backend
```

#### Using Kubernetes

1. **Apply Configurations**
```bash
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

2. **Check Status**
```bash
kubectl get pods
kubectl get services
```

### CI/CD Pipeline

The project uses GitHub Actions for automated testing and deployment:
- Runs on every push and pull request
- Executes unit and integration tests
- Generates coverage reports
- Deploys to production on successful builds

## 📁 Project Structure

```
CNPM_FoodFastDelivery/
├── backend/
│   ├── Controllers/          # Request handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── utils/               # Utility functions
│   ├── migrations/          # Database migrations
│   ├── __tests__/           # Test files
│   │   ├── UnitTest/       # Unit tests
│   │   └── IntegrationTest/# Integration tests
│   ├── coverage/            # Test coverage reports
│   ├── docs/                # Documentation
│   ├── public/              # Static files
│   ├── index.js             # Entry point
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # Redux store & slices
│   │   ├── assets/         # Images, icons, etc.
│   │   ├── css/            # Stylesheets
│   │   ├── App.jsx         # Root component
│   │   ├── Layout.jsx      # Layout wrapper
│   │   └── main.jsx        # Entry point
│   ├── public/             # Public assets
│   ├── test/               # Test files
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── Dockerfile
├── k8s/                     # Kubernetes configs
│   ├── backend/
│   ├── frontend/
│   ├── configmaps/
│   ├── secrets/
│   └── monitoring/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── .gitignore
└── README.md
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add: your feature description"
   ```
4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request**

### Coding Standards
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

### Running Linter
```bash
# Frontend
cd frontend
npm run lint

# Backend (if configured)
cd backend
npm run lint
```

## 🙏 Acknowledgments

- Material-UI for the component library
- Stripe for payment processing
- Cloudinary for image hosting
- MongoDB Atlas for database hosting
- Vercel for frontend hosting

---

Made with ❤️ by the Food Fast Delivery Team


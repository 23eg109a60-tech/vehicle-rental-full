# Vehicle Rental Management System

A full-stack vehicle rental management system built as a college project.

## 🏗️ Project Structure

```
vehicle-rental-full/
├── backend/    → Spring Boot REST API (Java 17, MySQL/PostgreSQL)
└── frontend/   → React 19 + TypeScript + Vite (TanStack Query, Tailwind CSS)
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, TanStack Query v5, React Router v7, Tailwind CSS |
| Backend | Spring Boot 3.4.2, Java 17, Spring Data JPA, Spring Security (Session) |
| Database | MySQL 8 (local) / PostgreSQL (production) |
| Deploy | Render (Docker + Static Site) |

## ⚙️ Local Setup

### Prerequisites
- Java 17+
- Maven 3.9+
- Node.js 18+
- MySQL 8

### Backend
```bash
cd backend
mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 🔐 Admin Login
- **Username:** admin
- **Password:** admin

## 📦 Deployment
Both services are configured for [Render](https://render.com) via `render.yaml` files in each subfolder.

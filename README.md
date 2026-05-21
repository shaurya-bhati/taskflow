# TaskFlow — Team Task Manager

A production-ready full-stack Team Task Manager built with React, Node.js, Express, and MongoDB.

---

## 🚀 Features

- **Authentication** — JWT-based login/register with bcrypt password hashing
- **Role-Based Access** — Admin and Member roles with protected routes
- **Project Management** — Create, edit, delete projects with deadlines and member management
- **Task Management** — Create/assign tasks with priority, status, due dates, and comments
- **Dashboard** — Analytics with charts, progress tracking, and activity overview
- **Responsive UI** — Modern dark-themed design built with Tailwind CSS

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| HTTP | Axios |

---

## 📁 Project Structure

```
taskmanager/
├── backend/
│   ├── config/         # DB connection & seed data
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth & validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── context/    # Auth context
    │   ├── pages/      # Route pages
    │   └── services/   # API service layer
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Seed Demo Data

```bash
cd backend
npm run seed
```

Demo credentials:
- Admin: `admin@taskmanager.com` / `admin123`
- Member: `sam@taskmanager.com` / `member123`

---

## 🚂 Railway Deployment

### Backend

1. Create a new project on [Railway](https://railway.app)
2. Add a new service → Deploy from GitHub repo
3. Set root directory to `backend/`
4. Add environment variables:
   ```
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret_key_minimum_32_chars
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   PORT=5000
   ```
5. Railway auto-detects `npm start` from package.json

### Frontend

1. Add another service in the same Railway project
2. Set root directory to `frontend/`
3. Add build command: `npm run build`
4. Add start command: `npm run start`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

> **Note:** Set `VITE_API_URL` before building. Railway injects env vars at build time for Vite.

---

## 🔌 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/projects` | All users |
| POST | `/api/projects` | Admin only |
| PUT | `/api/projects/:id` | Admin only |
| DELETE | `/api/projects/:id` | Admin only |
| POST | `/api/projects/:id/members` | Admin only |
| DELETE | `/api/projects/:id/members/:userId` | Admin only |

### Tasks
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/tasks` | All users (filtered by role) |
| POST | `/api/tasks` | Admin only |
| PUT | `/api/tasks/:id` | Admin only |
| PATCH | `/api/tasks/:id/status` | Assigned user or Admin |
| DELETE | `/api/tasks/:id` | Admin only |
| POST | `/api/tasks/:id/comments` | Assigned user or Admin |

### Users
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/users` | All logged-in users |
| PUT | `/api/users/:id/role` | Admin only |
| DELETE | `/api/users/:id` | Admin only |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Stats (role-filtered) |

---

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with expiry
- Protected API routes via middleware
- Role-based authorization (Admin/Member)
- CORS configured for specific origins
- Input validation on all endpoints

---

## 📄 License

MIT

# Employee Training Management System — Backend

A RESTful API built with **Node.js**, **Express**, **MongoDB**, and **JWT Authentication**.

---

## Folder Structure

```
etm_backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   └── authController.js   # Register, Login, Get Me
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protect + role authorization
│   ├── models/
│   │   └── User.js             # User schema (admin / employee)
│   ├── routes/
│   │   └── auth.js             # Auth routes
│   └── server.js               # Express app entry point
├── .env                        # Environment variables (not committed)
├── .gitignore
├── package.json
└── README.md
```

---

## Roles

| Role       | Permissions                                              |
|------------|----------------------------------------------------------|
| `admin`    | Create/manage training programs, assign to employees, view all progress |
| `employee` | View assigned trainings, mark completion, view own progress |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/etm_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

### 3. Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Endpoints

### Auth

| Method | Endpoint              | Access  | Description          |
|--------|-----------------------|---------|----------------------|
| POST   | `/api/auth/register`  | Public  | Register a new user  |
| POST   | `/api/auth/login`     | Public  | Login and get token  |
| GET    | `/api/auth/me`        | Private | Get logged-in user   |

### Register — Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "employee"
}
```

### Login — Request Body

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### Protected Route — Header

```
Authorization: Bearer <your_jwt_token>
```

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB + Mongoose
- **Auth**: JSON Web Tokens (JWT)
- **Password Hashing**: bcryptjs

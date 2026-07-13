# Mini Attendance Management System

A full-stack employee attendance management system built for the Twite AI Technologies Software Engineer Trainee technical assessment.

**Stack:** React.js · Python (Flask) · MySQL · JWT Authentication

---

## Features

### Authentication
- Login screen (username/password)
- JWT-based authentication on all protected APIs
- Forgot Password via email — a 6-digit OTP is emailed to the account's registered address, expires in 10 minutes

### Role-Based Access Control
Three roles:
- **admin** — full access: add/edit/delete employees, mark attendance, issue employee logins, reset passwords
- **manager** — view employees and attendance, mark attendance; cannot add/edit/delete employees
- **employee** — self-service only: logs in and sees just their own attendance history and attendance rate, nothing else

### Employee Management
- Add, edit, delete, view employees
- Search by name, email, or employee code
- Filter by department and status
- Sortable, paginated table

### Attendance Management
- Mark attendance (Present / Absent / Half Day / On Leave) with check-in/check-out times
- Re-marking the same employee+date updates the existing record (no duplicates — enforced by a unique DB constraint)
- Filterable, paginated attendance records
- Attendance summary with aggregate counts
- Employee-wise attendance history
- CSV export of attendance records

### Dashboard
- Total employees, active employees
- Present today, absent today, on leave today
- Department-wise employee count

### Bonus features included
- JWT Authentication
- Role-Based Access Control (3 roles)
- Pagination, search, filtering, sorting
- Responsive UI
- Swagger / OpenAPI documentation (via Flasgger, at `/api/docs/`)
- CSV export of attendance
- Unit tests (Pytest, in-memory SQLite)
- Docker setup (backend, frontend, MySQL via docker-compose)
- Postman collection

---

## Architecture

- **Frontend (React, port 3000)** sends JWT-authenticated REST/JSON requests to the
- **Backend (Flask, port 5000)**, which talks to the
- **Database (MySQL, port 3306)** via SQLAlchemy ORM

- **Frontend:** React (functional components + Hooks), React Router, Axios, plain CSS design-token system
- **Backend:** Flask app factory pattern, Blueprints per resource, Flask-SQLAlchemy ORM, Flask-JWT-Extended, Flasgger for Swagger docs
- **Database:** MySQL, normalized tables (`users`, `departments`, `employees`, `attendance`) with primary/foreign keys, unique constraints, and audit timestamps

---

## Database Design

| Table | Purpose | Key constraints |
|---|---|---|
| `users` | Login accounts (admin/manager/employee) | `username` unique, optional link to one `employee` record |
| `departments` | Lookup table | `name` unique |
| `employees` | Employee records | `employee_code` & `email` unique, FK → `departments` |
| `attendance` | Daily attendance | FK → `employees`, unique `(employee_id, attendance_date)` |

Schema file: [`database/schema.sql`](database/schema.sql)

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
copy .env.example .env      # then edit with your real DB password, admin email, and Gmail app password
python seed.py               # creates tables + default admin user
python app.py                 # runs on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start                     # runs on http://localhost:3000
```

Default login: `admin` / `Admin@123`

### Running tests
```bash
cd backend
pytest -v
```

---

## API Reference

Full interactive documentation at `/api/docs/` (Swagger UI) once the backend is running. Key endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate, returns JWT |
| POST | `/api/auth/forgot-password` | Request a password reset OTP by email |
| POST | `/api/auth/reset-password-otp` | Complete password reset using the emailed OTP |
| POST | `/api/auth/register-employee-login` | Admin: issue a login for an employee |
| GET/POST/PUT/DELETE | `/api/employees` | Employee CRUD |
| POST | `/api/attendance` | Mark attendance |
| GET | `/api/attendance` | List attendance records |
| GET | `/api/attendance/summary` | Aggregate attendance counts |
| GET | `/api/attendance/me` | Employee: view own attendance |
| GET | `/api/attendance/export` | Export attendance as CSV |
| GET | `/api/dashboard/stats` | Dashboard statistics |

---

## Project Structure
\`\`\`
attendance-management/
├── database/schema.sql
├── backend/
│   ├── app.py, config.py, extensions.py, models.py, decorators.py, email_utils.py, seed.py
│   ├── routes/ (auth, employees, attendance, dashboard)
│   └── tests/
├── frontend/src/
│   ├── api/api.js
│   ├── context/AuthContext.js
│   ├── components/ (Sidebar, Pagination, StatusBadge, modals)
│   └── pages/ (Login, Dashboard, Employees, Attendance, Reports, MyAttendance)
└── README.md
\`\`\`
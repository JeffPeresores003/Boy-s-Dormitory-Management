# BISU Boy's Dormitory Management System

A full-stack web application for managing the Boy's Dormitory at Bohol Island State University (BISU). Built with React.js, Node.js, Express, and MySQL. This is an **admin-only** system — the admin manages tenants (students, staff, faculty), rooms, payments, visitors, maintenance requests, and announcements.

## Features

- **Admin-Only Authentication** — JWT-based login for admin accounts
- **Tenant Management** — CRUD for tenants with types: student, staff, and faculty
- **Room Management** — Room inventory, assign/remove tenants, capacity tracking with availability reminders (e.g. "1 bed available")
- **Payment & Billing** — Record payments, track dues, payment status (paid/unpaid/partial)
- **Visitor Logbook** — Log visitors, check-in/check-out tracking
- **Maintenance Requests** — Admin creates and manages maintenance requests
- **Announcements** — Post and manage dorm-wide announcements with categories
- **Reports & Dashboard** — Statistics, charts (tenants by type, room status), export to PDF and Excel

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts |
| Backend | Node.js, Express.js, mysql2 (direct pool queries) |
| Database | MySQL |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Export | PDFKit (PDF), ExcelJS (Excel) |

## Prerequisites

- **Node.js** >= 18
- **MySQL** server (e.g. XAMPP, MySQL Workbench, or MySQLyog)
- **npm**

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/JeffPeresores003/Boy-s-Dormitory-Management.git
cd Boy-s-Dormitory-Management
```

### 2. Setup the database

Open your MySQL client and create the database:

```sql
CREATE DATABASE bisu_dormitory;
```

Then import the schema:

```bash
mysql -u root -p bisu_dormitory < database/db.sql
```

Or open `database/db.sql` in your MySQL client (MySQLyog, phpMyAdmin, etc.) and execute it against the `bisu_dormitory` database.

### 3. Configure environment variables

Create a `.env` file inside the `server/` folder:

```
PORT=5000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bisu_dormitory
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Admin Seed
ADMIN_EMAIL=admin@bisu.edu.ph
ADMIN_PASSWORD=Admin@123

# Frontend URL (CORS)
CLIENT_URL=http://localhost:5173
```

> Update `DB_PASSWORD` if your MySQL root account has a password.

### 4. Install dependencies

Open **two terminals** (or use split terminal).

**Terminal 1 — Server:**

```bash
cd server
npm install
```

**Terminal 2 — Client:**

```bash
cd client
npm install
```

### 5. Seed the admin account

In the **server** terminal:

```bash
npm run seed
```

This creates the default admin account. You only need to run this once.

### 6. Run the server (backend)

In the **server** terminal:

```bash
npm run dev
```

The API server will start at **http://localhost:5000**.

### 7. Run the frontend (client)

In the **client** terminal:

```bash
npm run dev
```

The frontend will start at **http://localhost:5173**. Open this URL in your browser.

### Default Admin Login

| Field | Value |
|-------|-------|
| Email | `admin@bisu.edu.ph` |
| Password | `Admin@123` |

## Project Structure

```
Boy-s-Dormitory-Management/
├── database/
│   └── db.sql               # Full database schema
├── server/
│   ├── config/config.js      # MySQL2 pool configuration
│   ├── middleware/            # Auth middleware
│   ├── routes/               # All route files (*.routes.js)
│   ├── uploads/              # Uploaded files
│   ├── server.js             # Express app entry point
│   └── seed.js               # Admin account seeder
├── client/
│   ├── src/
│   │   ├── components/       # Shared components (Sidebar, Navbar, etc.)
│   │   ├── context/          # Auth context provider
│   │   ├── pages/admin/      # Admin pages (Dashboard, Tenants, Rooms, etc.)
│   │   ├── pages/auth/       # Login & password reset pages
│   │   ├── services/api.js   # Axios API instance
│   │   ├── App.jsx           # Main routing
│   │   └── main.jsx          # React entry point
│   └── index.html
└── README.md
```

## API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Login, register, password reset |
| Tenants | `/api/tenants` | Tenant CRUD (student, staff, faculty) |
| Rooms | `/api/rooms` | Room CRUD + assign/remove tenants |
| Payments | `/api/payments` | Payment CRUD + recording |
| Visitors | `/api/visitors` | Visitor log + checkout |
| Maintenance | `/api/maintenance` | Maintenance requests + status updates |
| Announcements | `/api/announcements` | Announcement CRUD |
| Dashboard | `/api/dashboard` | Stats + reports export (PDF/Excel) |

## License

This project is for academic purposes at BISU.

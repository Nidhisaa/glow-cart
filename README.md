# GlowCart 🌟 - Full-Stack Glassmorphic E-Commerce Application

GlowCart is a highly dynamic, colorful, and fully-featured Full-Stack Web Application built using modern vanilla HTML5, CSS3, and client-side JavaScript on the frontend, with a Node.js + Express backend and a MySQL database.

The interface is optimized to feel extremely responsive, utilizing a dark-mode cyberpunk design with vibrant neon gradients, glassmorphism, and micro-animations.

---

## 📁 Repository Structure

```text
glow-cart/
├── assets/                  # High-quality mockups and visual banner images
├── frontend/                # Client-Side Assets
│   ├── css/
│   │   └── styles.css       # Global design system, glassmorphism, & animations
│   ├── js/
│   │   ├── products.js      # Client-side API connector (performs fetches)
│   │   ├── components.js    # HTML template rendering layouts
│   │   └── app.js           # Navigation routing and UI state controllers
│   ├── assets/              # Copied product visual files
│   └── index.html           # Main Single Page App index shell
├── backend/                 # API Application Layer
│   ├── db.js                # MySQL database connection manager and SQL compiler
│   ├── server.js            # Express server (implements REST APIs, handles static routing)
│   └── package.json         # Node dependencies (Express, Cors, mysql2, dotenv)
├── db/                      # Database Schema & Seed Data
│   ├── schema.sql           # SQL DDL script defining tables
│   └── seed.sql             # SQL seed script populating mock products and user roles
├── .env                     # Local configuration credentials (ignored by Git)
├── .gitignore               # Files excluded from Git commits
├── package.json             # Root runner configurations
└── README.md                # Project documentation (this file)
```

---

## 🚀 Key Features

* **Express API Server**: Direct backend router providing unified endpoints for product catalogs, registration, sessions, and transaction orders.
* **Persistent MySQL Database**: Stores catalogs, accounts, and transactions. Utilizing JSON fields inside SQL tables for dynamic item storage.
* **Auto-Initialization Database Compiler**: On server startup (`npm start`), the backend automatically creates the MySQL database `glowcart_db`, runs `schema.sql` to compile tables, and seeds data if empty. No manual database setup required!
* **Transactional Order Processing**: Submitting checkout forms runs a secure SQL transaction to write order records, log line items, and safely decrement product stock in a single atomic database operation.
* **Background Status Simulator Daemon**: The server runs a background thread that periodically increments order tracking statuses (Processing ➔ Shipped ➔ On Route ➔ Delivered) in MySQL.
* **Dynamic Cart & 3D Flipped Payment Card**: Custom discount codes (try `GLOW20` for 20% off) and a virtual 3D credit card that rotates 180° when typing your CVV code.

---

## 🛠️ Local Installation & Setup

### Prerequisites
- Node.js (version 20.x or higher recommended)
- MySQL Server (default port `3306` must be active)

### 1. Database Configuration
Open the `.env` file in the project root directory and update it with your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=glowcart_db
```

### 2. Install Dependencies
Run the setup script from the root folder to automatically install all backend packages:
```bash
npm run setup
```

### 3. Run the Application
Start the backend server:
```bash
npm start
```
The server will output:
```text
Connecting to MySQL server at localhost...
Connection pool created for database "glowcart_db".
Database tables verified.
==================================================
 GlowCart Server started on port 5000
 Access application at: http://localhost:5000
==================================================
```

Open **`http://localhost:5000`** in your browser to view the application.

---

## 🔑 Demo Credentials

To login directly from the modal, use the quick credentials helpers at the bottom of the auth dialog:

* **Customer Account**: 
  * Email: `user@glowcart.com`
  * Password: `user123`
* **Admin Dashboard Account**:
  * Email: `admin@glowcart.com`
  * Password: `admin123`

## 🧠 Interview-Ready Architecture

GlowCart is intentionally split into four layers:

1. **Presentation layer** — [`frontend/index.html`](frontend/index.html) defines the SPA shell. [`frontend/js/components.js`](frontend/js/components.js) renders reusable HTML templates, while [`frontend/js/app.js`](frontend/js/app.js) owns navigation, cart state, authentication state, and checkout events.
2. **API/client layer** — [`frontend/js/products.js`](frontend/js/products.js) contains the browser's API client. It adds the signed bearer token to protected requests and keeps network errors separate from rendering code.
3. **Application/API layer** — [`backend/server.js`](backend/server.js) exposes REST endpoints, validates input, authenticates requests, and enforces the admin role. The browser never decides which email or role is trusted.
4. **Persistence layer** — [`backend/db.js`](backend/db.js) owns SQL access and transactions. [`db/schema.sql`](db/schema.sql) defines relational tables and [`db/seed.sql`](db/seed.sql) provides demo data.

### Authentication flow

Login verifies the password with `crypto.scrypt`, then returns a signed token. The token contains the user's email and role and is sent as:

```text
Authorization: Bearer <token>
```

The server verifies the signature on every protected request. Passwords are not returned to the browser. Existing plain-text demo passwords are upgraded to hashes after their first successful login so the demo remains usable.

This is a lightweight demonstration session mechanism. In production, use a long random `AUTH_SECRET`, HTTPS, short token expiry/refresh tokens, rate limiting, and an established identity provider or carefully reviewed session library.

### Checkout consistency

The checkout request contains only product IDs, quantities, promo code, and shipping details. The server:

1. Starts a MySQL transaction.
2. Locks the requested product rows with `FOR UPDATE`.
3. Re-reads prices and stock from the database.
4. Rejects invalid quantities or insufficient stock.
5. Calculates subtotal, discount, tax, and total.
6. Inserts the order and line items.
7. Decrements stock.
8. Commits everything, or rolls back everything on failure.

This prevents a client from changing prices and prevents two concurrent checkouts from selling the same stock.

### Useful API examples

```bash
# Public catalog
curl http://localhost:5000/api/products

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@glowcart.com\",\"password\":\"user123\"}"

# Authenticated orders
curl http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

For an interview, be ready to explain why authorization is enforced on the server, why client totals are untrusted, why stock updates belong in a transaction, and why passwords require salted one-way hashing.

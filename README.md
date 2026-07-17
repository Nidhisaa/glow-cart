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

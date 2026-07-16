# GlowCart 🌟 - Premium Glassmorphic E-Commerce Storefront

GlowCart is a highly dynamic, colorful, and fully-featured Single-Page Application (SPA) built using modern vanilla HTML5, CSS3, and JavaScript. The interface is optimized to feel extremely responsive, utilizing a dark-mode cyberpunk design with vibrant neon gradients, glassmorphism, and micro-animations.

This project is built from scratch and structured cleanly for easy integration, tracking, and uploading to a Git repository.

---

## 🚀 Key Features

* **Dynamic Catalog & Search**: Instant searching, category tabs, and sorting filters (price/rating) that update the storefront grid without refreshing the page.
* **Responsive Shopping Cart**: Slide-out drawer displaying selected items, item quantities, and real-time total updates.
* **Interactive Checkout & 3D Payment Card**: A security form supporting coupon codes (try `GLOW20` for 20% off) and a virtual 3D credit card that dynamically updates as you type and rotates 180° when filling out the security code (CVV).
* **Order History & Live Progress Tracker**: Logged-in users can inspect past transactions. Each order has a visual timeline detailing ship progress (Processing ➔ Shipped ➔ On Route ➔ Delivered) which advances automatically in the background.
* **Admin Dashboard CRUD Panel**: Real-time sales statistics cards and an admin inventory table for adding, updating, and deleting products in the catalog.
* **State Persistence**: The entire application state (cart, products database, credentials, and order history) is synchronized and stored in `localStorage` in-memory.

---

## 📁 Repository Structure

```text
glow-cart/
├── assets/                  # High-quality mockups and visual banner images
│   ├── hero_banner.jpg      # Homepage workspace banner
│   ├── neon_keyboard.jpg    # Mechanical keyboard product photo
│   ├── cyber_headphones.jpg  # Bluetooth audio headset product photo
│   ├── cyber_watch.jpg      # Cyberpunk smartwatch product photo
│   └── ambient_lamp.jpg     # Smart ambient desk lamp product photo
├── css/
│   └── styles.css           # Global design system, glassmorphism, & animations
├── js/
│   ├── products.js          # Core product definitions and localStorage CRUD utility
│   ├── components.js        # HTML template generator modules for views
│   └── app.js               # Central application state, routing, and event controllers
├── .gitignore               # Config to ignore IDE settings or OS files in Git
├── index.html               # Main entry page shell
└── README.md                # Project documentation (this file)
```

---

## 🔑 Demo Credentials

To check out the roles without registering manually, click **Login** in the header and use the quick credentials helpers at the bottom of the modal:

* **Customer Profile**: 
  * Email: `user@glowcart.com`
  * Password: `user123`
* **Admin Dashboard Profile**:
  * Email: `admin@glowcart.com`
  * Password: `admin123`

---

## 🛠️ How to Run Locally

Since the application runs entirely client-side:
1. Clone this repository to your local drive.
2. Double-click the `index.html` file to open it in any web browser.
3. *Alternative (Optional)*: Spin up a lightweight local web server if desired (e.g., using Python `python -m http.server 8000` or the VS Code Live Server extension).

// backend/server.js - REST API Server for GlowCart

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const {
  createToken,
  getBearerToken,
  hashPassword,
  verifyPassword,
  verifyToken
} = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json({ limit: '100kb' }));

function requireAuth(req, res, next) {
  const user = verifyToken(getBearerToken(req));
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
  next();
}

function validateProduct(body) {
  return body && typeof body.name === 'string' && body.name.trim().length >= 2 &&
    typeof body.description === 'string' && body.description.trim().length >= 5 &&
    typeof body.category === 'string' && body.category.trim() &&
    Number.isFinite(Number(body.price)) && Number(body.price) > 0 &&
    typeof body.image === 'string' && body.image.trim() &&
    Number.isInteger(Number(body.stock)) && Number(body.stock) >= 0;
}

function validateRegistration(body) {
  return body && typeof body.name === 'string' && body.name.trim().length >= 2 &&
    typeof body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) &&
    typeof body.password === 'string' && body.password.length >= 6;
}

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../frontend')));

// ----------------------------------------------------
// PRODUCT CATALOG API ENDPOINTS
// ----------------------------------------------------

// Retrieve all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve single product details
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add new product
app.post('/api/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!validateProduct(req.body)) return res.status(400).json({ error: 'Invalid product fields' });
    const newProduct = await db.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update product details
app.put('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!validateProduct(req.body)) return res.status(400).json({ error: 'Invalid product fields' });
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete product from catalog
app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// ----------------------------------------------------

// Handle login
app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  try {
    const user = await db.getUserByEmail(email);
    const valid = user && await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.password.startsWith('scrypt:')) {
      await db.updateUserPassword(email, await hashPassword(password));
    }
    // Return user session object (excluding password for security)
    res.json({
      token: createToken(user),
      email: user.email,
      role: user.role,
      name: user.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle registration
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!validateRegistration(req.body)) return res.status(400).json({ error: 'Name, valid email, and a 6-character password are required' });
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }
    const newUser = await db.createUser({ email: normalizedEmail, password, name: name.trim(), role: 'user' });
    res.status(201).json({
      token: createToken(newUser),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ORDERS AND CHECKOUT API ENDPOINTS
// ----------------------------------------------------

// Retrieve customer orders list
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const allOrders = await db.getAdminAllOrders();
      return res.json(allOrders);
    }
    const orders = await db.getOrders(req.user.email);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit checkout order
app.post('/api/orders', requireAuth, async (req, res) => {
  try {
    if (!req.body.shippingDetails || !Array.isArray(req.body.items)) {
      return res.status(400).json({ error: 'Shipping details and items are required' });
    }
    const order = await db.createOrder({
      id: `GC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userEmail: req.user.email,
      items: req.body.items,
      promoCode: req.body.promoCode,
      shippingDetails: req.body.shippingDetails
    });
    res.status(201).json(order);
  } catch (error) {
    const isClientError = /Invalid order item|only \d+ item|Shipping details/.test(error.message);
    res.status(isClientError ? 400 : 500).json({ error: error.message });
  }
});

// Fallback index.html router for client-side single page app (SPA) mapping
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ----------------------------------------------------
// BACKGROUND ORDER TRACKING DAEMON
// ----------------------------------------------------
function startOrderStatusSimulator() {
  const statuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  
  setInterval(async () => {
    try {
      // Fetch all orders (admin helper)
      const allOrders = await db.getAdminAllOrders();
      for (const order of allOrders) {
        const curIndex = statuses.indexOf(order.status);
        // If not delivered yet, 35% chance to advance status in MySQL
        if (curIndex !== -1 && curIndex < statuses.length - 1) {
          if (Math.random() < 0.35) {
            const nextStatus = statuses[curIndex + 1];
            await db.updateOrderStatus(order.id, nextStatus);
            console.log(`Daemon: Advanced Order #${order.id} status to "${nextStatus}"`);
          }
        }
      }
    } catch (err) {
      console.error('Daemon order simulation error:', err.message);
    }
  }, 25000); // Check every 25 seconds
}

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
async function startServer() {
  try {
    // Initialize MySQL connections
    await db.initDB();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` GlowCart Server started on port ${PORT}`);
      console.log(` Access application at: http://localhost:${PORT}`);
      console.log(`==================================================`);
      
      // Start tracker status advances
      startOrderStatusSimulator();
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

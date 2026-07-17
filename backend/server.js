// backend/server.js - REST API Server for GlowCart

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing middlewares
app.use(cors());
app.use(express.json());

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
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = await db.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update product details
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Delete product from catalog
app.delete('/api/products/:id', async (req, res) => {
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
  const { email, password } = req.body;
  try {
    const user = await db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Return user session object (excluding password for security)
    res.json({
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
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email address already registered' });
    }
    const newUser = await db.createUser({ email, password, name, role: 'user' });
    res.status(201).json({
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
app.get('/api/orders', async (req, res) => {
  const { email, role } = req.query;
  try {
    if (role === 'admin') {
      const allOrders = await db.getAdminAllOrders();
      return res.json(allOrders);
    }
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const orders = await db.getOrders(email);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit checkout order
app.post('/api/orders', async (req, res) => {
  try {
    await db.createOrder(req.body);
    res.status(201).json({ success: true, message: 'Order created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

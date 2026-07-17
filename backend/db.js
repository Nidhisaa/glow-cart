// backend/db.js - MySQL Database Connection and Operations Manager

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Read DB Configuration from Environment variables
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'Nidhi@20';
const dbName = process.env.DB_NAME || 'glowcart_db';

let pool;

async function initDB() {
  try {
    // 1. First establish connection to MySQL without selecting database (to check/create database)
    const initConnection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true
    });

    console.log(`Connecting to MySQL server at ${dbHost}...`);

    // 2. Create database if not exists
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await initConnection.end();

    // 3. Establish Connection Pool with the database selected
    pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    console.log(`Connection pool created for database "${dbName}".`);

    // 4. Check if tables exist. If products table is missing, initialize schema and seed data
    const [tables] = await pool.query(`SHOW TABLES LIKE 'products'`);
    if (tables.length === 0) {
      console.log('Tables not found. Initializing database schema...');
      
      const schemaPath = path.join(__dirname, '../db/schema.sql');
      const seedPath = path.join(__dirname, '../db/seed.sql');

      const schemaSQL = await fs.readFile(schemaPath, 'utf-8');
      const seedSQL = await fs.readFile(seedPath, 'utf-8');

      // Execute schema creation
      await pool.query(schemaSQL);
      console.log('Database tables created successfully.');

      // Execute seed insertion
      await pool.query(seedSQL);
      console.log('Seed data inserted successfully.');
    } else {
      console.log('Database tables verified.');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

// ----------------------------------------------------
// DATABASE API HELPER METHODS
// ----------------------------------------------------

// Products CRUD
async function getProducts() {
  const [rows] = await pool.query('SELECT * FROM products');
  // Return specs parsed back to JS object
  return rows.map(p => ({
    ...p,
    specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs
  }));
}

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const p = rows[0];
  return {
    ...p,
    specs: typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs
  };
}

async function addProduct(p) {
  const specsStr = JSON.stringify(p.specs || {});
  // Get next numeric ID
  const [rows] = await pool.query('SELECT MAX(CAST(id AS UNSIGNED)) as maxId FROM products');
  const nextId = String((rows[0].maxId || 0) + 1);

  await pool.query(
    'INSERT INTO products (id, name, description, category, price, image, rating, reviewsCount, stock, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nextId, p.name, p.description, p.category, p.price, p.image, p.rating || 5.0, p.reviewsCount || 0, p.stock || 0, specsStr]
  );
  return { ...p, id: nextId };
}

async function updateProduct(id, p) {
  const specsStr = JSON.stringify(p.specs || {});
  await pool.query(
    'UPDATE products SET name = ?, description = ?, category = ?, price = ?, image = ?, rating = ?, reviewsCount = ?, stock = ?, specs = ? WHERE id = ?',
    [p.name, p.description, p.category, p.price, p.image, p.rating, p.reviewsCount, p.stock, specsStr, id]
  );
  return getProductById(id);
}

async function deleteProduct(id) {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
}

// Authentication
async function getUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (rows.length === 0) return null;
  return rows[0];
}

async function createUser(u) {
  await pool.query(
    'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
    [u.email, u.password, u.role || 'user', u.name]
  );
  return getUserByEmail(u.email);
}

// Orders and Tracking
async function getOrders(userEmail) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE user_email = ? ORDER BY date DESC', [userEmail]);
  
  // Return orders with nested items
  const orders = [];
  for (const order of rows) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    orders.push({
      id: order.id,
      userEmail: order.user_email,
      date: order.date,
      status: order.status,
      totals: {
        subtotal: parseFloat(order.subtotal),
        discount: parseFloat(order.discount),
        tax: parseFloat(order.tax),
        total: parseFloat(order.total)
      },
      shippingDetails: typeof order.shipping_details === 'string' ? JSON.parse(order.shipping_details) : order.shipping_details,
      items: items.map(it => ({
        productId: it.product_id,
        name: it.name,
        price: parseFloat(it.price),
        quantity: it.quantity
      }))
    });
  }
  return orders;
}

async function getAdminAllOrders() {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY date DESC');
  
  const orders = [];
  for (const order of rows) {
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    orders.push({
      id: order.id,
      userEmail: order.user_email,
      date: order.date,
      status: order.status,
      totals: {
        subtotal: parseFloat(order.subtotal),
        discount: parseFloat(order.discount),
        tax: parseFloat(order.tax),
        total: parseFloat(order.total)
      },
      shippingDetails: typeof order.shipping_details === 'string' ? JSON.parse(order.shipping_details) : order.shipping_details,
      items: items.map(it => ({
        productId: it.product_id,
        name: it.name,
        price: parseFloat(it.price),
        quantity: it.quantity
      }))
    });
  }
  return orders;
}

async function createOrder(o) {
  // Start MySQL Transaction
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const shippingDetailsStr = JSON.stringify(o.shippingDetails);
    
    // 1. Insert order record
    await connection.query(
      'INSERT INTO orders (id, user_email, subtotal, discount, tax, total, status, shipping_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [o.id, o.userEmail, o.totals.subtotal, o.totals.discount, o.totals.tax, o.totals.total, o.status || 'Processing', shippingDetailsStr]
    );

    // 2. Insert order items & reduce product stocks
    for (const item of o.items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [o.id, item.productId, item.name, item.price, item.quantity]
      );

      // Reduce stock
      await connection.query(
        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    await connection.commit();
    console.log(`Transaction committed for Order ID #${o.id}`);
  } catch (error) {
    await connection.rollback();
    console.error('Failed to place order in transaction:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

async function updateOrderStatus(orderId, status) {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
}

module.exports = {
  initDB,
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getUserByEmail,
  createUser,
  getOrders,
  getAdminAllOrders,
  createOrder,
  updateOrderStatus
};

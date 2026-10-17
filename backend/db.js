// backend/db.js - MySQL Database Connection and Operations Manager

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { hashPassword } = require('./auth');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Read DB Configuration from Environment variables
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'Nidhi@20';
const dbName = process.env.DB_NAME || 'glowcart_db';

let pool;

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

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

    // 4. Create any missing tables, then seed an empty catalog.
    const [tables] = await pool.query(`SHOW TABLES LIKE 'products'`);
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf-8');
    await pool.query(schemaSQL);
    if (tables.length === 0) {
      console.log('Tables not found. Initializing database schema...');
      const seedPath = path.join(__dirname, '../db/seed.sql');
      const seedSQL = await fs.readFile(seedPath, 'utf-8');
      await pool.query(seedSQL);
      console.log('Seed data inserted successfully.');
    } else {
      const [products] = await pool.query('SELECT COUNT(*) AS count FROM products');
      if (products[0].count === 0) {
        const seedPath = path.join(__dirname, '../db/seed.sql');
        await pool.query(await fs.readFile(seedPath, 'utf-8'));
        console.log('Seed data inserted successfully.');
      }
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
    price: Number(p.price),
    rating: Number(p.rating),
    specs: parseJson(p.specs, {})
  }));
}

async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const p = rows[0];
  return {
    ...p,
    price: Number(p.price),
    rating: Number(p.rating),
    specs: parseJson(p.specs, {})
  };
}

async function addProduct(p) {
  const specsStr = JSON.stringify(p.specs || {});
  // Get next numeric ID
  const [rows] = await pool.query('SELECT MAX(CAST(id AS UNSIGNED)) as maxId FROM products');
  const nextId = String((rows[0].maxId || 0) + 1);

  await pool.query(
    'INSERT INTO products (id, name, description, category, price, image, rating, reviewsCount, stock, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [nextId, p.name, p.description, p.category, p.price, p.image, p.rating || 5.0, p.reviewsCount || 0, p.stock, specsStr]
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
  const passwordHash = await hashPassword(u.password);
  await pool.query(
    'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
    [u.email, passwordHash, u.role || 'user', u.name]
  );
  return getUserByEmail(u.email);
}

async function updateUserPassword(email, passwordHash) {
  await pool.query('UPDATE users SET password = ? WHERE email = ?', [passwordHash, email]);
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
      shippingDetails: parseJson(order.shipping_details, {}),
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
      shippingDetails: parseJson(order.shipping_details, {}),
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
    
    if (!Array.isArray(o.items) || o.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const productIds = [...new Set(o.items.map(item => item.productId))];
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await connection.query(
      `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );
    const productsById = new Map(products.map(product => [String(product.id), product]));
    let subtotal = 0;
    const normalizedItems = o.items.map(item => {
      const product = productsById.get(String(item.productId));
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Invalid order item');
      }
      if (quantity > product.stock) {
        throw new Error(`${product.name} has only ${product.stock} item(s) left`);
      }
      subtotal += Number(product.price) * quantity;
      return { productId: product.id, name: product.name, price: product.price, quantity };
    });
    const discount = o.promoCode === 'GLOW20' ? subtotal * 0.20 : 0;
    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;

    // Insert order record using server-calculated totals.
    await connection.query(
      'INSERT INTO orders (id, user_email, subtotal, discount, tax, total, status, shipping_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [o.id, o.userEmail, subtotal, discount, tax, total, 'Processing', shippingDetailsStr]
    );

    // 2. Insert order items & reduce product stocks
    for (const item of normalizedItems) {
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
    return {
      id: o.id,
      userEmail: o.userEmail,
      status: 'Processing',
      totals: { subtotal, discount, tax, total },
      shippingDetails: o.shippingDetails,
      items: normalizedItems
    };
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
  updateUserPassword,
  getOrders,
  getAdminAllOrders,
  createOrder,
  updateOrderStatus
};

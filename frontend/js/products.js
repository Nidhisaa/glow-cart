// frontend/js/products.js - Refactored client-side Database API Connector

// Fetch all products from the backend API
function apiHeaders() {
  const user = JSON.parse(localStorage.getItem('glowcart_user') || 'null');
  return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
}

async function apiRequest(url, options = {}) {
  const headers = { ...apiHeaders(), ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return response;
}

async function getProducts() {
  try {
    const response = await apiRequest('/api/products');
    return await response.json();
  } catch (error) {
    console.error('getProducts error:', error.message);
    return [];
  }
}

// Fetch single product details by ID
async function getProductById(id) {
  try {
    const response = await apiRequest(`/api/products/${id}`);
    return await response.json();
  } catch (error) {
    console.error('getProductById error:', error.message);
    return null;
  }
}

// Admin CRUD: Create a new product
async function addProduct(product) {
  try {
    const response = await apiRequest('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });
    return await response.json();
  } catch (error) {
    console.error('addProduct error:', error.message);
    throw error;
  }
}

// Admin CRUD: Update existing product details
async function updateProduct(id, updatedProduct) {
  try {
    const response = await apiRequest(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedProduct)
    });
    return await response.json();
  } catch (error) {
    console.error('updateProduct error:', error.message);
    throw error;
  }
}

// Admin CRUD: Delete product
async function deleteProduct(id) {
  try {
    const response = await apiRequest(`/api/products/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('deleteProduct error:', error.message);
    throw error;
  }
}

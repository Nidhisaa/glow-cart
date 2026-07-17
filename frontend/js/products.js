// frontend/js/products.js - Refactored client-side Database API Connector

// Fetch all products from the backend API
async function getProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to fetch catalog products');
    return await response.json();
  } catch (error) {
    console.error('getProducts error:', error.message);
    return [];
  }
}

// Fetch single product details by ID
async function getProductById(id) {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch product details for ID #${id}`);
    return await response.json();
  } catch (error) {
    console.error('getProductById error:', error.message);
    return null;
  }
}

// Admin CRUD: Create a new product
async function addProduct(product) {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Failed to create new product');
    return await response.json();
  } catch (error) {
    console.error('addProduct error:', error.message);
    throw error;
  }
}

// Admin CRUD: Update existing product details
async function updateProduct(id, updatedProduct) {
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedProduct)
    });
    if (!response.ok) throw new Error(`Failed to update product ID #${id}`);
    return await response.json();
  } catch (error) {
    console.error('updateProduct error:', error.message);
    throw error;
  }
}

// Admin CRUD: Delete product
async function deleteProduct(id) {
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`Failed to delete product ID #${id}`);
    return await response.json();
  } catch (error) {
    console.error('deleteProduct error:', error.message);
    throw error;
  }
}

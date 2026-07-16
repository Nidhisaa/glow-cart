// products.js - Initial products list and local storage database functions

const INITIAL_PRODUCTS = [
  {
    id: "1",
    name: "GlowBoard X90",
    description: "Experience the ultimate keystroke satisfaction with custom-lubed mechanical switches and vibrant, double-shot keycaps backed by multi-zone reactive RGB lighting.",
    category: "Keyboards",
    price: 149.99,
    image: "assets/neon_keyboard.jpg",
    rating: 4.8,
    reviewsCount: 124,
    stock: 12,
    specs: {
      "Switch Type": "Gateron Yellow (Linear)",
      "Layout": "75% ANSI layout",
      "Connectivity": "USB-C, Bluetooth 5.1, 2.4GHz Wireless",
      "Battery Life": "Up to 150 hours (RGB off)"
    }
  },
  {
    id: "2",
    name: "CyberSound Pulse",
    description: "Tune out the world with advanced Active Noise Cancelling. Features dynamic dual drivers, a customizable aura neon light ring, and breathable cooling-gel cushions.",
    category: "Audio",
    price: 199.99,
    image: "assets/cyber_headphones.jpg",
    rating: 4.9,
    reviewsCount: 89,
    stock: 8,
    specs: {
      "Driver": "50mm Neodymium dynamic drivers",
      "ANC Level": "Up to -40dB Hybrid ANC",
      "Frequency Response": "10Hz - 40kHz",
      "Battery Life": "Up to 40 hours with ANC & RGB on"
    }
  },
  {
    id: "3",
    name: "Hologra Chrono",
    description: "A premium smartwatch blending physical titanium craftsmanship with a high-definition holographic interface display. Tracks biometrics and projects key notifications.",
    category: "Wearables",
    price: 299.99,
    image: "assets/cyber_watch.jpg",
    rating: 4.7,
    reviewsCount: 56,
    stock: 5,
    specs: {
      "Casing Material": "Aerospace Grade Titanium",
      "Display": "1.4-inch Holographic Micro-OLED",
      "Sensors": "Heart rate, SpO2, Accelerometer, Gyroscope",
      "Water Resistance": "5ATM (up to 50m)"
    }
  },
  {
    id: "4",
    name: "AuraRing Lamp",
    description: "An elegant circular ambient desk lamp casting a beautiful blend of programmable sunset orange and neon cyan. Complete with sound-reactive music modes.",
    category: "Smart Home",
    price: 89.99,
    image: "assets/ambient_lamp.jpg",
    rating: 4.6,
    reviewsCount: 142,
    stock: 15,
    specs: {
      "Illumination": "16 Million Colors + Tunable Warm White",
      "Control": "WiFi Smartphone App, Google/Alexa, Touch Bar",
      "Material": "Anodized Sandblasted Aluminum",
      "Height": "35 cm"
    }
  },
  {
    id: "5",
    name: "GlowBoard Mini (Pro Edition)",
    description: "A compact 60% mechanical layout featuring a clean frosted acrylic shell that diffuses lighting beautifully across your workspace. Ideal for clean, minimal setups.",
    category: "Keyboards",
    price: 119.99,
    image: "assets/neon_keyboard.jpg",
    rating: 4.5,
    reviewsCount: 34,
    stock: 20,
    specs: {
      "Switch Type": "Cherry MX Red (Linear)",
      "Layout": "60% ultra-compact layout",
      "Connectivity": "Detachable USB-C",
      "Case Material": "Frosted CNC Polycarbonate"
    }
  },
  {
    id: "6",
    name: "CyberSound In-Ear Buds",
    description: "Ultra-low latency wireless earbuds engineered for gaming and music. Comes in a futuristic slide-to-open charging case with pulsing neon battery indicator stripes.",
    category: "Audio",
    price: 79.99,
    image: "assets/cyber_headphones.jpg",
    rating: 4.4,
    reviewsCount: 78,
    stock: 25,
    specs: {
      "Latency": "38ms Ultra-Low Latency Mode",
      "Waterproofing": "IPX5 Sweat resistance",
      "Charging Case": "300mAh with USB-C Fast Charge",
      "Total Playtime": "24 hours with case"
    }
  },
  {
    id: "7",
    name: "Hologra Chrono Elite",
    description: "The ultimate edition smartwatch featuring custom carbon fiber accents and a stealth-matte finish. Comes with custom watch faces and premium black steel link band.",
    category: "Wearables",
    price: 399.99,
    image: "assets/cyber_watch.jpg",
    rating: 4.9,
    reviewsCount: 18,
    stock: 3,
    specs: {
      "Casing Material": "DLC (Diamond-Like Carbon) Coated Steel",
      "Strap": "Interchangeable Matte Black Stainless Link + Fluororubber Sport",
      "Battery": "Up to 7 days smart mode / 30 days low power",
      "Storage": "32GB On-board audio & map storage"
    }
  },
  {
    id: "8",
    name: "AuraSphere Glow",
    description: "A floating-orb ambient light utilizing magnetic levitation to spin gently. Features wire-free induction charging and interactive touch colors.",
    category: "Smart Home",
    price: 129.99,
    image: "assets/ambient_lamp.jpg",
    rating: 4.8,
    reviewsCount: 22,
    stock: 4,
    specs: {
      "Technology": "Magnetic Levitation, Inductive Charging",
      "Modes": "Breathing, Strobe, Solid, Sound-Reactive",
      "Diameter": "15 cm sphere",
      "Base Material": "Walnut wood veneer finish"
    }
  }
];

// Initialize and Retrieve products from Local Storage
function getProducts() {
  const products = localStorage.getItem("glowcart_products");
  if (!products) {
    localStorage.setItem("glowcart_products", JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(products);
}

// Save products to Local Storage
function saveProducts(products) {
  localStorage.setItem("glowcart_products", JSON.stringify(products));
}

// Get product details by ID
function getProductById(id) {
  const products = getProducts();
  return products.find(p => p.id === id);
}

// Add a new product (Admin CRUD)
function addProduct(product) {
  const products = getProducts();
  // Simple numeric id generation
  const nextId = String(Math.max(...products.map(p => parseInt(p.id) || 0), 0) + 1);
  const newProduct = {
    id: nextId,
    name: product.name,
    description: product.description,
    category: product.category,
    price: parseFloat(product.price) || 0.0,
    image: product.image || "assets/ambient_lamp.jpg", // fallback
    rating: parseFloat(product.rating) || 5.0,
    reviewsCount: parseInt(product.reviewsCount) || 0,
    stock: parseInt(product.stock) || 0,
    specs: product.specs || {}
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

// Update a product (Admin CRUD)
function updateProduct(id, updatedProduct) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updatedProduct,
      price: parseFloat(updatedProduct.price) || 0.0,
      stock: parseInt(updatedProduct.stock) || 0,
      rating: parseFloat(updatedProduct.rating) || 5.0
    };
    saveProducts(products);
    return products[index];
  }
  return null;
}

// Delete a product (Admin CRUD)
function deleteProduct(id) {
  let products = getProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);
}
